import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const root = json('../package.json');
const core = json('../packages/core/package.json');
const react = json('../packages/react/package.json');

function filesWithin(rootPath) {
  const found = [];
  for (const entry of readdirSync(new URL(rootPath, import.meta.url), { withFileTypes: true })) {
    const child = join(new URL(rootPath, import.meta.url).pathname, entry.name);
    if (entry.isDirectory()) found.push(...filesWithin(`file://${child}/`));
    else found.push(child);
  }
  return found;
}

test('private workspace has exactly two private beta packages', () => {
  assert.equal(root.private, true);
  assert.deepEqual(root.workspaces, ['packages/core', 'packages/react']);
  for (const pkg of [core, react]) {
    assert.equal(pkg.private, true);
    assert.equal(pkg.version, '0.1.0-beta.3');
    assert.match(pkg.name, /^@lamplight\//);
  }
});

test('Style Dictionary is pinned for DTCG ecosystem compatibility', () => {
  assert.equal(root.devDependencies['style-dictionary'], '5.5.2');
  const installed = json('../node_modules/style-dictionary/package.json');
  assert.equal(installed.version, '5.5.2');
  const config = readFileSync(new URL('../style-dictionary.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /usesDtcg:\s*true/);
});

test('core has no dependencies and keeps fonts and living light opt-in', () => {
  assert.equal(core.dependencies, undefined);
  assert.equal(core.peerDependencies, undefined);
  assert.equal(core.exports['./styles.css'], './dist/lamplight.css');
  assert.equal(core.exports['./tokens.json'], './dist/lamplight.tokens.json');
  assert.equal(core.exports['./fonts.css'], './dist/fonts/lamplight-fonts.css');
  assert.deepEqual(core.exports['./living-light'], {
    types: './dist/living-light.d.ts', import: './dist/living-light.js',
  });
  const styles = readFileSync(new URL('../packages/core/dist/lamplight.css', import.meta.url), 'utf8');
  assert.match(styles, /tokens\.css/);
  assert.match(styles, /components\.css/);
  assert.doesNotMatch(styles, /fonts|living-light|\.js/);
  assert.ok(existsSync(new URL('../packages/core/dist/fonts/lamplight-fonts.css', import.meta.url)));
  assert.ok(existsSync(new URL('../packages/core/dist/lamplight.tokens.json', import.meta.url)));
});

test('living light is explicit, document-idempotent and SSR-safe', async () => {
  const runtime = readFileSync(new URL('../packages/core/dist/living-light.js', import.meta.url), 'utf8');
  assert.match(runtime, /export function initLivingLight\(\)/);
  assert.match(runtime, /lamplight\.living-light\.v1/);
  assert.match(runtime, /typeof window === 'undefined'/);
  assert.match(runtime, /node\.closest\("\.l-room"\)/);
  assert.match(runtime, /room = room\.parentElement && room\.parentElement\.closest\("\.l-room"\)/);
  assert.match(runtime, /room\.dataset\.motion === "reduced"/);
  const module = await import('../packages/core/dist/living-light.js');
  assert.doesNotThrow(() => module.initLivingLight());
});

test('React has only its peer contract and contains no copied core assets', () => {
  assert.equal(react.dependencies, undefined);
  assert.equal(react.optionalDependencies, undefined);
  assert.deepEqual(react.peerDependencies, { react: '>=18' });
  assert.deepEqual(Object.keys(react.exports), ['.']);
  const files = filesWithin('../packages/react/dist/');
  assert.equal(files.some((file) => /\.css$|fonts|living-light/.test(file)), false, files.join('\n'));
  const runtime = files.filter((file) => file.endsWith('.js')).map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(runtime, /lamplight\.living-light\.v1|DWELL_DELAY|data-press-phase/);
});

test('Room and l-document remain distinct scoping contracts', () => {
  const css = readFileSync(new URL('../packages/core/dist/components.css', import.meta.url), 'utf8');
  const reactSource = readFileSync(new URL('../packages/react/src/compound.js', import.meta.url), 'utf8');
  assert.match(css, /html\.l-document body/);
  assert.match(css, /\.l-room,/);
  assert.doesNotMatch(css, /(?:^|\})\s*body\s*\{/m);
  assert.match(reactSource, /export function Room/);
  assert.doesNotMatch(reactSource, /initLivingLight|living-light/);
});

test('DAS and MLA are not executable package contracts', () => {
  const executable = [
    readFileSync(new URL('../packages/core/package.json', import.meta.url), 'utf8'),
    readFileSync(new URL('../packages/react/package.json', import.meta.url), 'utf8'),
    readFileSync(new URL('../packages/core/src/components.css', import.meta.url), 'utf8'),
    readFileSync(new URL('../packages/react/src/compound.js', import.meta.url), 'utf8'),
  ].join('\n');
  assert.doesNotMatch(executable, /\b(?:DAS|MLA)\b/);
});


test('distributed component CSS preserves the source syntax after comment removal', async () => {
  const { parse, generate } = await import('css-tree');
  const source = readFileSync(new URL('../packages/core/src/components.css', import.meta.url), 'utf8');
  const dist = readFileSync(new URL('../packages/core/dist/components.css', import.meta.url), 'utf8');
  assert.equal(generate(parse(dist)), generate(parse(source)));
});
