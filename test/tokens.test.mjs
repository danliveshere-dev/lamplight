import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { flattenTokens, formatTokenCss, loadTokenDocument, validateTokenDocument } from '../scripts/token-tools.mjs';

const document = loadTokenDocument();
const generatedCss = readFileSync(new URL('../packages/core/generated/tokens.css', import.meta.url), 'utf8');
const componentsCss = readFileSync(new URL('../packages/core/src/components.css', import.meta.url), 'utf8');

test('DTCG 2025.10 document accounts for all 161 tokens by tier', () => {
  const { entries } = validateTokenDocument(document);
  const counts = Object.fromEntries(['primitive', 'semantic', 'component'].map((group) => [
    group, entries.filter((entry) => entry.group === group).length,
  ]));
  assert.deepEqual(counts, { primitive: 19, semantic: 118, component: 24 });
  assert.equal(entries.length, 161);
});

test('generated CSS is deterministic and has not drifted', () => {
  assert.equal(generatedCss, formatTokenCss(document));
  const properties = [...generatedCss.matchAll(/(--lamp-[a-z0-9-]+)\s*:/g)].map((match) => match[1]);
  assert.equal(properties.length, 161);
  assert.equal(new Set(properties).size, 161);
});

test('aliases remain aliases instead of being flattened to raw values', () => {
  assert.equal(document.semantic['surface-page'].$value, '{primitive.soot-1}');
  assert.equal(document.component['btn-radius'].$value, '{semantic.radius-md}');
  assert.match(document.semantic['focal-catch-settled'].$value, /\{primitive\.moss\}/);
  assert.match(generatedCss, /--lamp-surface-page: var\(--lamp-soot-1\);/);
  assert.match(generatedCss, /--lamp-btn-radius: var\(--lamp-radius-md\);/);
  assert.match(generatedCss, /color-mix\(in srgb, var\(--lamp-moss\) 75%, transparent\)/);
});

test('validator fails closed on unknown aliases, cycles and unclassified CSS strings', () => {
  const unknown = structuredClone(document);
  unknown.semantic['surface-page'].$value = '{primitive.missing}';
  assert.throws(() => validateTokenDocument(unknown), /unknown alias primitive\.missing/);

  const cycle = structuredClone(document);
  cycle.semantic['surface-page'].$value = '{semantic.surface-panel}';
  cycle.semantic['surface-panel'].$value = '{semantic.surface-page}';
  assert.throws(() => validateTokenDocument(cycle), /alias cycle/);

  const unclassified = structuredClone(document);
  delete unclassified.semantic['glass-bg'].$extensions['org.lamplight.css'].syntax;
  assert.throws(() => validateTokenDocument(unclassified), /CSS-bound string must declare/);
});

test('typed values and CSS-bound projections are explicitly distinguishable', () => {
  const entries = flattenTokens(document);
  for (const { token, path } of entries) {
    if (token.$type === 'string') {
      assert.ok(token.$extensions?.['org.lamplight.css']?.syntax, path);
    }
  }
  assert.equal(document.primitive['soot-0'].$type, 'color');
  assert.equal(document.semantic['space-4'].$type, 'dimension');
  assert.equal(document.semantic['motion-base'].$type, 'duration');
  assert.equal(document.semantic['ease-out'].$type, 'cubicBezier');
  assert.equal(document.semantic['font-sans'].$type, 'fontFamily');
  assert.equal(document.semantic['weight-semibold'].$type, 'fontWeight');
  assert.equal(document.component['list-cap'].$type, 'number');
});

test('every component token reference is defined by the generated core', () => {
  const defined = new Set([...generatedCss.matchAll(/(--lamp-[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
  const read = new Set([...componentsCss.matchAll(/var\((--lamp-[a-z0-9-]+)/g)].map((match) => match[1]));
  assert.deepEqual([...read].filter((property) => !defined.has(property)), []);
});

test('breakpoint tokens retain their five registers and phone CSS projection', () => {
  const expected = { narrow: 520, phone: 600, tablet: 834, desk: 1024, mirror: 2200 };
  for (const [name, value] of Object.entries(expected)) {
    assert.deepEqual(document.semantic[`bp-${name}`].$value, { value, unit: 'px' });
  }
  const phoneMedia = componentsCss.match(/@media \(max-width: ([\d.]+)rem\)/);
  assert.ok(phoneMedia, 'component phone breakpoint exists');
  assert.equal(Number(phoneMedia[1]) * 16, expected.phone);
});

test('consumer contracts do not enter the token namespace', () => {
  const names = flattenTokens(document).map(({ name }) => name);
  const forbidden = ['domain-', 'da' + 'ius', 'd' + 'anliveshere', 'das', 'mla'];
  assert.equal(names.some((name) => forbidden.some((part) => name.includes(part))), false);
});
