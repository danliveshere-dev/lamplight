import assert from 'node:assert/strict';
import test from 'node:test';
import { formatModesCss, loadTokenDocument, validateTokenDocument } from '../scripts/token-tools.mjs';

function withDay(mutate) {
  const document = structuredClone(loadTokenDocument());
  mutate(document);
  return document;
}
const day = (token, value) => {
  token.$extensions['org.lamplight.modes'] = { day: value };
};

test('a mode override and everything aliasing it are redeclared', () => {
  const css = formatModesCss(withDay((d) => day(d.primitive.moss, '{primitive.soot-1}')));
  const dayBlock = css.slice(css.indexOf('[data-mode="day"],\n'));
  assert.match(dayBlock, /--lamp-moss: var\(--lamp-soot-1\);/);
  assert.match(dayBlock, /--lamp-success: var\(--lamp-moss\);/);
  assert.match(dayBlock, /--lamp-focal-catch-settled: color-mix/);
});

test('the night block restores the same properties', () => {
  const css = formatModesCss(withDay((d) => day(d.primitive.moss, '{primitive.soot-1}')));
  const nightBlock = css.slice(0, css.indexOf('[data-mode="day"],\n'));
  assert.match(nightBlock, /--lamp-moss: #a8c398;/);
  assert.match(nightBlock, /--lamp-success: var\(--lamp-moss\);/);
});

test('focal catches inherit Day while focal panels and presence retain their own treatment', () => {
  const css = formatModesCss(loadTokenDocument());
  assert.match(css, /:where\(\[data-mode="day"\]:not\(\[data-surface="folio"\]\)\) \.l-panel\[data-depth="focal"\]/);
  assert.match(css, /:where\(\[data-mode="day"\]:not\(\[data-surface="folio"\]\)\) \.l-presence/);
  assert.doesNotMatch(css, /:where\(\[data-mode="day"\]:not\(\[data-surface="folio"\]\)\) \.l-focal-catch/);
  assert.match(css, /--l-focal-light-strength: 0;/);
});

test('print always gets Day values', () => {
  const css = formatModesCss(withDay((d) => day(d.primitive.moss, '{primitive.soot-1}')));
  assert.match(css, /@media print \{[\s\S]*--lamp-moss: var\(--lamp-soot-1\);/);
});

test('mode values fail closed', () => {
  assert.throws(() => validateTokenDocument(withDay((d) => {
    d.primitive.moss.$extensions['org.lamplight.modes'] = { dusk: '{primitive.soot-1}' };
  })), /unknown mode dusk/);
  assert.throws(() => validateTokenDocument(withDay((d) => day(d.primitive.moss, '#000000'))),
    /only an alias/);
  assert.throws(() => validateTokenDocument(withDay((d) => day(d.primitive.moss, '{primitive.nope}'))),
    /unknown alias/);
  assert.throws(() => validateTokenDocument(withDay((d) => day(d.semantic['glass-bg'], 'url(https://x.test)'))));
});
import { readFileSync } from 'node:fs';

function channels(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
}
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, b2] = channels(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('every Day text ink is AA on every Day paper', () => {
  const css = readFileSync(new URL('../packages/core/generated/tokens.css', import.meta.url), 'utf8');
  const value = (name) => css.match(new RegExp(`--lamp-${name}: (#[0-9a-f]{6});`))[1];
  const papers = ['paper', 'paper-bright', 'paper-white', 'paper-deep'].map(value);
  const inks = ['soot-1', 'ink-secondary', 'ink-muted', 'ink-tallow', 'ink-brass', 'ink-umber',
    'ink-dusk', 'ink-phosphor', 'ink-moss', 'ink-ember', 'ink-hearth'].map(value);
  for (const ink of inks) {
    for (const paper of papers) {
      assert.ok(contrast(ink, paper) >= 4.5, `${ink} on ${paper}: ${contrast(ink, paper).toFixed(2)}`);
    }
  }
  assert.ok(contrast(value('paper'), value('ink-tallow')) >= 4.5, 'text on fill');
});

test('Day redefines every light-bearing token', () => {
  const css = formatModesCss(loadTokenDocument());
  const dayBlock = css.slice(css.indexOf('[data-mode="day"],\n'), css.indexOf('@media print'));
  for (const property of ['--lamp-surface-page', '--lamp-text', '--lamp-candle', '--lamp-wire-warm-halo',
    '--lamp-focal-pool', '--lamp-bezel-face', '--lamp-node-glow', '--lamp-skeleton-fill']) {
    assert.match(dayBlock, new RegExp(`${property}:`), property);
  }
});

test('Day rejects cycles, type mismatches and malformed mode maps', () => {
  assert.throws(() => validateTokenDocument(withDay(d => day(d.primitive.moss, '{semantic.success}'))), /day alias cycle/);
  assert.throws(() => validateTokenDocument(withDay(d => day(d.primitive.moss, '{semantic.space-4}'))), /type mismatch/);
  assert.throws(() => validateTokenDocument(withDay(d => { d.primitive.moss.$extensions['org.lamplight.modes'] = []; })), /modes must be an object/);
});
