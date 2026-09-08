#!/usr/bin/env node
// Generate the lamplight-ui package from Lamplight's own stylesheets.
//
// Run:  node packages/react/generate.mjs
//
// This is a binding generator, not a design tool. It never invents styling: every
// component it emits is a class from ../components.css and nothing more. Before it
// writes anything it checks that every class and data-attribute the kit claims is
// actually defined in the stylesheet, and that every token the stylesheet reads is
// defined in ../tokens.css. A drift between the kit and the theme fails the build
// here rather than surfacing as a wrong design three weeks later.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, copyFileSync, readdirSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simple, appFacingTokens } from './manifest.mjs';
import { examples, compoundGroups } from './examples.mjs';

const KIT = dirname(fileURLToPath(import.meta.url));
const ROOT = join(KIT, '..', '..');
const THEME = join(ROOT, 'src');
const PKG = join(KIT, 'pkg');
const DIST = join(PKG, 'dist');

const tokensCss = readFileSync(join(THEME, 'tokens.css'), 'utf8');
const componentsCss = readFileSync(join(THEME, 'components.css'), 'utf8');
const compoundJs = readFileSync(join(KIT, 'src/compound.js'), 'utf8');
const livingLightJs = readFileSync(join(THEME, 'living-light.js'), 'utf8');
const compoundDts = readFileSync(join(KIT, 'src/compound.d.ts'), 'utf8');

const errors = [];
const warns = [];

/* ---- 1. What the stylesheet actually defines ---------------------------- */

const definedClasses = new Set();
for (const m of componentsCss.matchAll(/\.(l-[a-z0-9-]+)/g)) definedClasses.add(m[1]);

// class -> attr -> Set(values), from selectors like .l-btn[data-kind="primary"]
const definedAttrs = new Map();
for (const m of componentsCss.matchAll(/\.(l-[a-z0-9-]+)\[data-([a-z-]+)="([^"]+)"\]/g)) {
  const [, cls, attr, value] = m;
  if (!definedAttrs.has(cls)) definedAttrs.set(cls, new Map());
  const byAttr = definedAttrs.get(cls);
  if (!byAttr.has(attr)) byAttr.set(attr, new Set());
  byAttr.get(attr).add(value);
}

// Declarations, not references: several tokens share a line, so strip every
// var(--lamp-*) read before looking for definitions.
const definedTokens = new Set();
const declarationsOnly = tokensCss.replace(/var\(\s*--lamp-[a-z0-9-]+/g, 'var(');
for (const m of declarationsOnly.matchAll(/(--lamp-[a-z0-9-]+)\s*:/g)) definedTokens.add(m[1]);

/* ---- 2. Does the theme still define every token it reads? --------------- */

const readTokens = new Set();
for (const m of componentsCss.matchAll(/var\((--lamp-[a-z0-9-]+)/g)) readTokens.add(m[1]);
for (const m of tokensCss.matchAll(/var\((--lamp-[a-z0-9-]+)/g)) readTokens.add(m[1]);
for (const t of readTokens) {
  if (!definedTokens.has(t)) errors.push(`token ${t} is read but never defined in tokens.css`);
}

/* ---- 2b. Does every component token still reach an instrument? ---------- */
/* Tier 3 is the component layer: those tokens exist to be read by a rule in
   components.css. One that nothing consumes is a wire soldered at one end -
   it looks like the feature is there, and no card will ever show otherwise.
   That is exactly how --lamp-presence-attention sat unused: the presence had a
   documented attention state with no rule behind it. Tiers 1 and 2 are
   deliberately exempt - the space, radius and type scales are public API. */
const tier3Source = tokensCss.slice(tokensCss.indexOf('TIER 3'));
const tier3Declared = [...tier3Source
  .replace(/var\(\s*--lamp-[a-z0-9-]+/g, 'var(')
  .matchAll(/(--lamp-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
const consumed = new Set([
  ...[...componentsCss.matchAll(/var\((--lamp-[a-z0-9-]+)/g)].map((m) => m[1]),
  ...[...tokensCss.matchAll(/var\((--lamp-[a-z0-9-]+)/g)].map((m) => m[1]),
]);
for (const token of tier3Declared) {
  if (consumed.has(token) || appFacingTokens.includes(token)) continue;
  warns.push(`${token} is a component token nothing consumes - either give it a rule in `
    + 'components.css, or list it in appFacingTokens if application code reads it');
}

/* ---- 3. Does every class the kit binds still exist? --------------------- */

function requireClass(cls, where) {
  if (!definedClasses.has(cls)) errors.push(`${where}: class .${cls} is not defined in components.css`);
}

for (const c of simple) {
  requireClass(c.cls, c.name);
  for (const p of c.props || []) {
    if (p.addClass) requireClass(p.addClass, `${c.name}.${p.name}`);
    if (!p.attr) continue;
    const attr = p.attr.replace(/^data-/, '');
    const values = (p.type.match(/'([^']+)'/g) || []).map((v) => v.slice(1, -1));
    const defined = definedAttrs.get(c.cls)?.get(attr);
    if (!defined) {
      errors.push(`${c.name}.${p.name}: components.css has no .${c.cls}[${p.attr}="..."] rule`);
      continue;
    }
    for (const v of values) {
      if (!defined.has(v)) errors.push(`${c.name}.${p.name}: .${c.cls}[${p.attr}="${v}"] is not defined in components.css`);
    }
    for (const v of defined) {
      if (!values.includes(v)) warns.push(`${c.name}.${p.name}: components.css defines "${v}" but the kit does not expose it`);
    }
  }
}

// Compound sources: every quoted l-* string must be a real class.
for (const m of compoundJs.matchAll(/'(l-[a-z0-9-]+)'/g)) requireClass(m[1], 'compound.js');

// Compound components: name, group and prose, read back out of compound.d.ts so
// the docs can never disagree with the declared API.
const compound = [];
for (const m of compoundDts.matchAll(/\/\*\* ([^*]+?) \*\/\nexport declare function (\w+)\(/g)) {
  compound.push({ name: m[2], doc: m[1].trim(), group: compoundGroups[m[2]] });
}
for (const c of compound) {
  if (!c.group) errors.push(`${c.name}: no group in examples.mjs compoundGroups`);
}
for (const c of [...simple, ...compound]) {
  if (!examples[c.name]) errors.push(`${c.name}: no usage example in examples.mjs`);
}
for (const name of Object.keys(examples)) {
  if (![...simple, ...compound].some((c) => c.name === name)) {
    errors.push(`examples.mjs has an example for ${name}, which is not a component`);
  }
}

// Anything the stylesheet defines that nothing in the kit binds.
const bound = new Set([
  ...simple.map((c) => c.cls),
  ...simple.flatMap((c) => (c.props || []).map((p) => p.addClass).filter(Boolean)),
  ...[...compoundJs.matchAll(/'(l-[a-z0-9-]+)'/g)].map((m) => m[1]),
  ...[...livingLightJs.matchAll(/["'](l-[a-z0-9-]+)["']/g)].map((m) => m[1]),
]);
const nonComponentClasses = new Set(['l-document']);
for (const cls of definedClasses) {
  if (nonComponentClasses.has(cls)) continue;
  if (!bound.has(cls)) warns.push(`components.css defines .${cls} but no kit component binds it`);
}

// The optional living light (src/living-light.js) ships through its own package
// subpath. Its bare IIFE body owns the shared document sentinel and body-ready
// start; if that wrapper ever changes shape, fail rather than shipping a mangled
// copy with different lifecycle semantics.
const iifeOpen = /^\(function \(\) \{\s*\n\s*"use strict";\n/;
const iifeClose = /\}\)\(\);\s*$/;
if (!iifeOpen.test(livingLightJs) || !iifeClose.test(livingLightJs)) {
  errors.push('components.js is no longer a bare `(function () { "use strict"; ... })();` IIFE - '
    + 'the living-light wrapper in generate.mjs needs updating to match it');
}
const livingLightBody = livingLightJs.replace(iifeOpen, '').replace(iifeClose, '');

if (errors.length) {
  console.error('\n  Lamplight kit is out of step with the theme:\n');
  for (const e of errors) console.error(`   x ${e}`);
  console.error('\n  Fix the manifest or the stylesheet, then re-run.\n');
  process.exit(1);
}

/* ---- 4. Emit the package ------------------------------------------------ */

const HTML_ATTRS = {
  p: 'React.HTMLAttributes<HTMLParagraphElement>',
  span: 'React.HTMLAttributes<HTMLSpanElement>',
  div: 'React.HTMLAttributes<HTMLDivElement>',
  article: 'React.HTMLAttributes<HTMLElement>',
  button: 'React.ButtonHTMLAttributes<HTMLButtonElement>',
  label: 'React.LabelHTMLAttributes<HTMLLabelElement>',
  input: 'React.InputHTMLAttributes<HTMLInputElement>',
  select: 'React.SelectHTMLAttributes<HTMLSelectElement>',
  textarea: 'React.TextareaHTMLAttributes<HTMLTextAreaElement>',
};

function emitComponent(c) {
  const props = c.props || [];
  const named = props.map((p) => p.name);
  const sig = [...named, 'className', ...(c.void ? [] : ['children']), '...rest'].join(', ');
  const classArgs = ["'" + c.cls + "'", ...props.filter((p) => p.addClass).map((p) => `${p.name} && '${p.addClass}'`), 'className'];
  const attrs = props.filter((p) => p.attr).map((p) => `'${p.attr}': ${p.name}`);
  const defaults = Object.entries(c.defaultAttrs || {}).map(([k, v]) => `${k}: '${v}'`);
  const bag = [...defaults, '...rest', `className: cx(${classArgs.join(', ')})`, ...attrs].join(', ');
  return `export function ${c.name}({ ${sig} }) {\n`
    + `  return h('${c.tag}', { ${bag} }${c.void ? '' : ', children'});\n}\n`;
}

function emitDts(c) {
  const base = HTML_ATTRS[c.tag] || 'React.HTMLAttributes<HTMLElement>';
  const lines = (c.props || []).map((p) => `  /** ${p.doc} */\n  ${p.name}?: ${p.type};`);
  const iface = `export interface ${c.name}Props extends ${base} {\n${lines.join('\n')}${lines.length ? '\n' : ''}}`;
  return `${iface}\n/** ${c.doc} */\nexport declare function ${c.name}(props: ${c.name}Props): React.ReactElement;\n`;
}

const banner = '// Generated by packages/react/generate.mjs - do not edit.\n'
  + '// Lamplight bindings: each component is a class from src/components.css.\n\n';

const indexJs = banner
  + "import React from 'react';\n\nconst h = React.createElement;\n"
  + 'function cx(...parts) {\n  const out = parts.filter(Boolean).join(\' \');\n  return out || undefined;\n}\n\n'
  + '/* ---- Class bindings (from manifest.mjs) ---- */\n\n'
  + simple.map(emitComponent).join('\n')
  + '\n/* ---- Structured parts (from src/compound.js) ---- */\n'
  + compoundJs
      .replace(/^import React from 'react';\n/m, '')
      .replace(/^import \{[^}]*\} from '\.\/runtime\.js';\n/m, '');

const livingLightIndexJs = banner
  + 'export function initLivingLight() {\n'
  + '  if (typeof window === \'undefined\' || typeof document === \'undefined\') return;\n'
  + livingLightBody.replace(/^/gm, '  ').replace(/^\s+$/gm, '')
  + '}\n';

const livingLightIndexDts = banner
  + '/** Install Lamplight pointer, dwell, Press, Beam and validation behaviour once per document. */\n'
  + 'export declare function initLivingLight(): void;\n';

const indexDts = banner
  + "import type * as React from 'react';\n\n"
  + simple.map(emitDts).join('\n')
  + '\n'
  + compoundDts.replace(/^import type \* as React from 'react';\n/m, '');

rmSync(PKG, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

writeFileSync(join(PKG, 'package.json'), JSON.stringify({
  name: 'lamplight-ui',
  version: '2.5.0',
  description: 'React bindings for the Lamplight design system.',
  type: 'module',
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  exports: {
    '.': { types: './dist/index.d.ts', default: './dist/index.js' },
    './styles.css': './dist/lamplight.css',
    './living-light': { types: './dist/living-light.d.ts', default: './dist/living-light.js' },
  },
  peerDependencies: { react: '>=18' },
  sideEffects: ['**/*.css'],
  private: true,
}, null, 2) + '\n');

writeFileSync(join(DIST, 'index.js'), indexJs);
writeFileSync(join(DIST, 'index.d.ts'), indexDts);
writeFileSync(join(DIST, 'living-light.js'), livingLightIndexJs);
writeFileSync(join(DIST, 'living-light.d.ts'), livingLightIndexDts);

// The stylesheets ship verbatim - the kit never restyles Lamplight.
copyFileSync(join(THEME, 'tokens.css'), join(DIST, 'tokens.css'));
copyFileSync(join(THEME, 'components.css'), join(DIST, 'components.css'));

const fontsDir = join(ROOT, 'assets', 'fonts');
const fontFaceCss = join(fontsDir, 'lamplight-fonts.css');
let fontImport = '';
if (existsSync(fontFaceCss)) {
  mkdirSync(join(DIST, 'fonts'), { recursive: true });
  for (const f of readdirSync(fontsDir)) copyFileSync(join(fontsDir, f), join(DIST, 'fonts', f));
  fontImport = '@import "./fonts/lamplight-fonts.css";\n';
}

writeFileSync(join(DIST, 'lamplight.css'),
  '/* Lamplight scoped core, in load order: faces, tokens, components. */\n'
  + fontImport + '@import "./tokens.css";\n@import "./components.css";\n');

// Per-component docs. The converter binds these as each component's .prompt.md -
// the usage reference the design agent reads before composing. Frontmatter
// `category` is what sets the component's group in the Design System pane.
const DOCS = join(KIT, 'docs');
rmSync(DOCS, { recursive: true, force: true });
mkdirSync(DOCS, { recursive: true });
for (const c of [...simple, ...compound]) {
  writeFileSync(join(DOCS, `${c.name}.md`),
    `---\ncategory: ${c.group}\n---\n\n# ${c.name}\n\n${c.doc}\n\n## Usage\n\n\`\`\`jsx\n${examples[c.name]}\n\`\`\`\n`);
}

// Resolve the kit as a real package from theme/designkit/node_modules. The
// design-sync converter reads token files through the package resolver
// (cfg.tokensPkg), so without this link tokens.css never reaches the bundle and
// every component ships referencing custom properties nothing defines.
const link = join(KIT, 'node_modules', 'lamplight-ui');
if (!existsSync(link)) {
  mkdirSync(join(KIT, 'node_modules'), { recursive: true });
  symlinkSync('../pkg', link, 'dir');
}

console.log(`  Lamplight kit built: ${simple.length} class bindings + ${(compoundJs.match(/^export function/gm) || []).length} structured parts`);
console.log(`  ${definedTokens.size} tokens, ${definedClasses.size} classes checked against the theme`);
if (warns.length) {
  console.log('\n  Notes (not failures):');
  for (const w of warns) console.log(`   - ${w}`);
}
