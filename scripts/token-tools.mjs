import { readFileSync } from 'node:fs';

export const TOKEN_DOCUMENT = new URL('../tokens/lamplight.tokens.json', import.meta.url);
export const GROUPS = ['primitive', 'semantic', 'component'];
export const EXPECTED_TOKEN_COUNT = 161;
const ALLOWED_TYPES = new Set([
  'color', 'dimension', 'duration', 'cubicBezier', 'fontFamily', 'fontWeight', 'number', 'string',
]);
const REFERENCE = /\{(primitive|semantic|component)\.([a-z0-9-]+)\}/g;

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
    return value.replace(REFERENCE, (_, group, name) => {
      const target = byPath.get(`${group}.${name}`);
      return `var(${target.token.$extensions['org.lamplight.css'].property})`;
    });
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
  return lines.join('\n');
}
