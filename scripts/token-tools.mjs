import { readFileSync } from 'node:fs';
import * as csstree from 'css-tree';

export const TOKEN_DOCUMENT = new URL('../tokens/lamplight.tokens.json', import.meta.url);
export const GROUPS = ['primitive', 'semantic', 'component'];
export const EXPECTED_TOKEN_COUNT = 175;
const ALLOWED_TYPES = new Set([
  'color', 'dimension', 'duration', 'cubicBezier', 'fontFamily', 'fontWeight', 'number', 'string',
]);
const REFERENCE = /\{(primitive|semantic|component)\.([a-z0-9-]+)\}/g;
const CSS_STRING_SYNTAXES = new Set([
  '<border>', '<color>', '<image>', '<length>', '<number>#', '<percentage>', '<shadow>',
]);
const REVIEWED_INLINE_DATA_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E";

export function loadTokenDocument() {
  return JSON.parse(readFileSync(TOKEN_DOCUMENT, 'utf8'));
}

export function flattenTokens(document) {
  return GROUPS.flatMap((group) => Object.entries(document[group] ?? {})
    .filter(([name]) => !name.startsWith('$'))
    .map(([name, token]) => ({ group, name, path: `${group}.${name}`, token })));
}

function referencesIn(value) {
  if (typeof value !== 'string') return [];
  return [...value.matchAll(REFERENCE)].map((match) => `${match[1]}.${match[2]}`);
}

function replaceAliases(value, byPath) {
  return value.replace(REFERENCE, (_, group, name) => {
    const target = byPath.get(`${group}.${name}`);
    return `var(${target.token.$extensions['org.lamplight.css'].property})`;
  });
}

function representativeValue(value, syntax) {
  const replacement = ['<color>', '<border>', '<shadow>'].includes(syntax) ? '#000' : '50%';
  const ast = csstree.parse(value, { context: 'value', positions: true });
  const ranges = [];
  csstree.walk(ast, (node) => {
    if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
      ranges.push([node.loc.start.offset, node.loc.end.offset]);
    }
  });
  let represented = value;
  for (const [start, end] of ranges.sort((a, b) => b[0] - a[0])) {
    represented = `${represented.slice(0, start)}${replacement}${represented.slice(end)}`;
  }
  return represented;
}

function validateCssStringProjection(entry, byPath) {
  const syntax = entry.token.$extensions?.['org.lamplight.css']?.syntax;
  if (!CSS_STRING_SYNTAXES.has(syntax)) throw new Error(`unsupported CSS syntax ${syntax}`);
  const resolved = replaceAliases(entry.token.$value, byPath);
  if (/[;{}]|\/\*|\*\/|[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(resolved)) {
    throw new Error('CSS projection contains a declaration, rule, comment or control-character boundary');
  }
  if (/[{}]/.test(resolved)) throw new Error('CSS projection contains an unresolved alias or rule boundary');

  let ast;
  try {
    ast = csstree.parse(resolved, { context: 'value', positions: true });
  } catch (error) {
    throw new Error(`CSS projection cannot be parsed: ${error.message}`);
  }
  let raw = false;
  let stringSource = false;
  const urls = [];
  const variableRanges = [];
  csstree.walk(ast, (node) => {
    if (node.type === 'Function' && node.name.toLowerCase() === 'var') {
      variableRanges.push([node.loc.start.offset, node.loc.end.offset]);
    }
  });
  csstree.walk(ast, (node) => {
    if (node.type === 'Raw' && !variableRanges.some(([start, end]) => (
      node.loc.start.offset >= start && node.loc.end.offset <= end
    ))) raw = true;
    if (node.type === 'Atrule') raw = true;
    if (node.type === 'String') stringSource = true;
    if (node.type === 'Url') urls.push(node.value);
  });
  if (raw) throw new Error('CSS projection contains an unsupported raw value or at-rule');
  if (stringSource) throw new Error('CSS projection contains a string-valued image source');
  if (urls.some((url) => entry.path !== 'semantic.glass-grain' || url !== REVIEWED_INLINE_DATA_URL)) {
    throw new Error('CSS projection contains a URL outside the reviewed inline image allowance');
  }
  if (entry.path === 'semantic.glass-grain'
    && (urls.length !== 1 || urls[0] !== REVIEWED_INLINE_DATA_URL)) {
    throw new Error('reviewed inline image changed');
  }

  if (syntax === '<number>#') {
    if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:\s*,\s*[-+]?(?:\d+\.?\d*|\.\d+))+$/.test(resolved)) {
      throw new Error('CSS projection does not match <number>#');
    }
    return;
  }
  const property = {
    '<border>': 'outline',
    '<color>': 'color',
    '<image>': 'background-image',
    '<length>': 'letter-spacing',
    '<percentage>': 'left',
    '<shadow>': 'box-shadow',
  }[syntax];
  const represented = representativeValue(resolved, syntax);
  const match = csstree.lexer.matchProperty(property, csstree.parse(represented, { context: 'value' }));
  if (!match.matched) throw new Error(`CSS projection does not match ${syntax}: ${match.error?.message ?? 'invalid value'}`);
}

function validateGeneratedStylesheet(css, entries) {
  let ast;
  try {
    ast = csstree.parse(css, { context: 'stylesheet' });
  } catch (error) {
    throw new Error(`generated CSS cannot be parsed: ${error.message}`);
  }
  const nodes = [...ast.children];
  if (nodes.length !== 1 || nodes[0].type !== 'Rule' || csstree.generate(nodes[0].prelude) !== ':root') {
    throw new Error('generated CSS must contain exactly one :root rule');
  }
  const declarations = [...nodes[0].block.children];
  const expected = entries.map((entry) => entry.token.$extensions['org.lamplight.css'].property);
  if (declarations.length !== expected.length
    || declarations.some((node, index) => node.type !== 'Declaration' || node.property !== expected[index])) {
    throw new Error('generated CSS declaration shape does not match the canonical token inventory');
  }
}

function assertTypedValue(entry, errors) {
  const { token, path } = entry;
  const type = token.$type;
  const value = token.$value;
  if (!type) return;
  if (!ALLOWED_TYPES.has(type)) errors.push(`${path}: unsupported $type ${type}`);
  if (type === 'color') {
    if (!value || value.colorSpace !== 'srgb' || !Array.isArray(value.components)
      || value.components.length !== 3 || value.components.some((channel) => typeof channel !== 'number'
        || channel < 0 || channel > 1) || typeof value.alpha !== 'number') {
      errors.push(`${path}: color must be an srgb object with three 0..1 components and alpha`);
    }
  }
  if (['dimension', 'duration'].includes(type)) {
    const units = type === 'dimension' ? ['px', 'rem'] : ['ms', 's'];
    if (!value || typeof value.value !== 'number' || !units.includes(value.unit)) {
      errors.push(`${path}: invalid ${type} value`);
    }
  }
  if (type === 'cubicBezier' && (!Array.isArray(value) || value.length !== 4
    || value.some((part) => typeof part !== 'number'))) {
    errors.push(`${path}: cubicBezier must contain four numbers`);
  }
  if (type === 'fontFamily' && (!Array.isArray(value) || !value.length
    || value.some((family) => typeof family !== 'string'))) {
    errors.push(`${path}: fontFamily must be a non-empty string array`);
  }
  if (type === 'fontWeight' && typeof value !== 'number') errors.push(`${path}: fontWeight must be numeric`);
  if (type === 'number' && typeof value !== 'number') errors.push(`${path}: number must be numeric`);
  if (type === 'string') {
    if (typeof value !== 'string') errors.push(`${path}: string token must contain a string`);
    if (!token.$extensions?.['org.lamplight.css']?.syntax) {
      errors.push(`${path}: CSS-bound string must declare org.lamplight.css.syntax`);
    }
  }
}

export function validateTokenDocument(document) {
  const errors = [];
  if (document.$schema !== 'https://www.designtokens.org/schemas/2025.10/format.json') {
    errors.push('document: expected the DTCG 2025.10 schema identifier');
  }
  for (const group of GROUPS) {
    if (!document[group] || typeof document[group] !== 'object') errors.push(`document: missing ${group} group`);
  }
  const entries = flattenTokens(document);
  if (entries.length !== EXPECTED_TOKEN_COUNT) {
    errors.push(`document: expected ${EXPECTED_TOKEN_COUNT} tokens, found ${entries.length}`);
  }
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const properties = new Set();
  for (const entry of entries) {
    const { token, name, path } = entry;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) errors.push(`${path}: invalid token name`);
    if (!Object.hasOwn(token, '$value')) errors.push(`${path}: missing $value`);
    const property = token.$extensions?.['org.lamplight.css']?.property;
    if (property !== `--lamp-${name}`) errors.push(`${path}: CSS property must be --lamp-${name}`);
    if (properties.has(property)) errors.push(`${path}: duplicate CSS property ${property}`);
    properties.add(property);
    assertTypedValue(entry, errors);
    const references = referencesIn(token.$value);
    for (const target of references) {
      if (!byPath.has(target)) errors.push(`${path}: unknown alias ${target}`);
    }
    if (!token.$type && !(typeof token.$value === 'string'
      && /^\{(?:primitive|semantic|component)\.[a-z0-9-]+\}$/.test(token.$value))) {
      errors.push(`${path}: only a pure alias may inherit its type`);
    }
  }
  for (const entry of entries.filter(({ token }) => token.$type === 'string')) {
    try {
      validateCssStringProjection(entry, byPath);
    } catch (error) {
      errors.push(`${entry.path}: ${error.message}`);
    }
  }

  function resolveType(path, stack = []) {
    if (stack.includes(path)) {
      errors.push(`${path}: alias cycle ${[...stack, path].join(' -> ')}`);
      return undefined;
    }
    const entry = byPath.get(path);
    if (!entry) return undefined;
    if (entry.token.$type) return entry.token.$type;
    const target = referencesIn(entry.token.$value)[0];
    return resolveType(target, [...stack, path]);
  }
  for (const entry of entries) {
    if (!resolveType(entry.path)) errors.push(`${entry.path}: could not resolve an inherited type`);
  }
  // Validate the effective graph independently for each mode. An override may introduce
  // cycles even when every default alias is valid.
  for (const entry of entries) {
    const modes = entry.token.$extensions?.['org.lamplight.modes'];
    if (modes === undefined) continue;
    if (!modes || typeof modes !== 'object' || Array.isArray(modes)) {
      errors.push(`${entry.path}: modes must be an object`); continue;
    }
    for (const [mode, value] of Object.entries(modes)) {
      if (mode !== 'day') errors.push(`${entry.path}: unknown mode ${mode}`);
      if (typeof value !== 'string') { errors.push(`${entry.path}: mode value must be a string`); continue; }
      const refs = referencesIn(value);
      for (const ref of refs) if (!byPath.has(ref)) errors.push(`${entry.path}: unknown alias ${ref}`);
      const pure = /^\{(?:primitive|semantic|component)\.[a-z0-9-]+\}$/.test(value);
      if (pure && byPath.has(refs[0])) {
        if (resolveType(entry.path) !== resolveType(refs[0])) errors.push(`${entry.path}: mode alias type mismatch`);
      } else if (!pure && resolveType(entry.path) === 'string' && entry.token.$type === 'string') {
        if (refs.every((ref) => byPath.has(ref))) {
          try { validateCssStringProjection({ ...entry, token: { ...entry.token, $value: value } }, byPath); }
          catch (error) { errors.push(`${entry.path}: ${error.message}`); }
        }
      } else if (!pure) errors.push(`${entry.path}: this token takes only an alias in a mode`);
    }
  }
  const complete = new Set();
  function visitMode(path, stack = []) {
    if (stack.includes(path)) { errors.push(`${path}: day alias cycle ${[...stack, path].join(' -> ')}`); return; }
    if (complete.has(path) || !byPath.has(path)) return;
    const entry = byPath.get(path);
    const value = entry.token.$extensions?.['org.lamplight.modes']?.day ?? entry.token.$value;
    for (const target of referencesIn(value)) visitMode(target, [...stack, path]);
    complete.add(path);
  }
  for (const entry of entries) visitMode(entry.path);
  if (errors.length) throw new Error(`Lamplight token validation failed:\n - ${errors.join('\n - ')}`);
  return { entries, byPath, properties };
}

function colourToHex(value) {
  const channels = value.components.map((channel) => Math.round(channel * 255));
  const hex = channels.map((channel) => channel.toString(16).padStart(2, '0')).join('');
  if (value.alpha === 1) return `#${hex}`;
  return `rgba(${channels.join(', ')}, ${value.alpha})`;
}

function formatFamily(family) {
  const unquoted = new Set(['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-monospace', '-apple-system']);
  if (unquoted.has(family) || /^[A-Za-z][A-Za-z0-9-]*$/.test(family)) return family;
  return `'${family.replaceAll("'", "\\'")}'`;
}

export function formatTokenValue(entry, byPath) {
  const { token } = entry;
  const value = token.$value;
  if (typeof value === 'string') {
    return replaceAliases(value, byPath);
  }
  switch (token.$type) {
    case 'color': return colourToHex(value);
    case 'dimension':
    case 'duration': return `${value.value}${value.unit}`;
    case 'cubicBezier': return `cubic-bezier(${value.join(', ')})`;
    case 'fontFamily': return value.map(formatFamily).join(', ');
    case 'fontWeight':
    case 'number': return String(value);
    default: throw new Error(`${entry.path}: no CSS formatter for ${token.$type}`);
  }
}

export function formatTokenCss(document) {
  const { entries, byPath } = validateTokenDocument(document);
  const grouped = new Map(GROUPS.map((group) => [group, entries.filter((entry) => entry.group === group)]));
  const lines = [
    '/* Generated from tokens/lamplight.tokens.json by scripts/build-tokens.mjs. */',
    '/* Do not edit this file directly. */',
    ':root {',
  ];
  for (const group of GROUPS) {
    lines.push('', `  /* ${group.toUpperCase()} */`);
    for (const entry of grouped.get(group)) {
      lines.push(`  ${entry.token.$extensions['org.lamplight.css'].property}: ${formatTokenValue(entry, byPath)};`);
    }
  }
  lines.push('}', '');
  const css = lines.join('\n');
  validateGeneratedStylesheet(css, entries);
  return css;
}

// Re-declare the transitive aliases in each scope: inherited custom properties
// resolve their references at the element where they were originally declared.
export function formatModesCss(document) {
  const { entries, byPath } = validateTokenDocument(document);
  const changed = new Set(entries.filter(e => e.token.$extensions?.['org.lamplight.modes']?.day !== undefined).map(e => e.path));
  let grew = true;
  while (grew) {
    grew = false;
    for (const entry of entries) {
      if (!changed.has(entry.path) && referencesIn(entry.token.$value).some(path => changed.has(path))) {
        changed.add(entry.path); grew = true;
      }
    }
  }
  const selected = entries.filter(e => changed.has(e.path));
  const declarations = mode => selected.map(e => {
    const value = mode ? e.token.$extensions?.['org.lamplight.modes']?.day : undefined;
    return `  ${e.token.$extensions['org.lamplight.css'].property}: ${value !== undefined ? replaceAliases(value, byPath) : formatTokenValue(e, byPath)};`;
  });
  const islands = ['.l-panel[data-depth="focal"]', '.l-focal-catch', '.l-presence'];
  const within = root => islands.map(selector => `${root} ${selector}`);
  const day = declarations(true), night = declarations(false);
  const printRoot = ':is(.l-room, html.l-document)';
  return [
    '/* Generated from tokens/lamplight.tokens.json by scripts/build-tokens.mjs. */',
    '/* Do not edit this file directly. */',
    `${['[data-mode="night"]', ...within(':where([data-mode="day"]:not([data-surface="folio"]))')].join(',\n')} {`,
    '  color-scheme: dark;', '  color: var(--lamp-text);', ...night, '}', '',
    `${['[data-mode="day"]', 'html.l-document[data-mode="day"]', '[data-surface="folio"]', 'html.l-document[data-surface="folio"]', ...within(':where([data-surface="folio"])')].join(',\n')} {`,
    '  color-scheme: light;', '  color: var(--lamp-text);', ...day, '}', '',
    '@media print {', `${[printRoot, ...within(printRoot)].join(',\n')} {`,
    '  color-scheme: light;', '  color: var(--lamp-text);', ...day, '}', '}', '',
  ].join('\n');
}
