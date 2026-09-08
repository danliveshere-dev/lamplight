import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Gauge, ModeDial } from '../dist/index.js';

const h = React.createElement;
const modes = [
  { value: 'dawn', label: 'Dawn' },
  { value: 'day', label: 'Day' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'night', label: 'Night' },
];

function loadModeDialReconciliation() {
  const source = readFileSync(new URL('../src/compound.js', import.meta.url), 'utf8');
  const start = source.indexOf('// MODE_DIAL_RECONCILIATION_START');
  const end = source.indexOf('// MODE_DIAL_RECONCILIATION_END');
  assert.notEqual(start, -1, 'reconciliation helper start marker');
  assert.notEqual(end, -1, 'reconciliation helper end marker');
  const helper = source.slice(start, end).replace('// MODE_DIAL_RECONCILIATION_START', '');
  return Function(`${helper}; return resolveModeDialSelection;`)();
}

test('ModeDial lights the tick the hand is pointing at', () => {
  const html = renderToStaticMarkup(h(ModeDial, { label: 'Room light', defaultValue: 'dusk', options: modes }));
  const ticks = [...html.matchAll(/--tick-turn:\s*(-?[\d.]+)deg([^>]*)/g)];
  assert.equal(ticks.length, modes.length, html);
  const lit = ticks.filter((t) => t[2].includes('data-on'));
  assert.equal(lit.length, 1, 'exactly one detent is lit');
  const hand = html.match(/--dial-turn:\s*(-?[\d.]+)deg/);
  assert.equal(Number(lit[0][1]), Number(hand[1]), 'the lit detent and the hand agree');
});

test('ModeDial announces a two-position dial as a switch', () => {
  const onOff = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }];
  const binary = renderToStaticMarkup(h(ModeDial, { label: 'The big light', defaultValue: 'on', options: onOff }));
  assert.match(binary, /role="switch"/);
  assert.match(binary, /aria-checked="true"/);
  // More than two positions is a selector, not a switch - claiming otherwise
  // would tell a screen reader there are two states when there are four.
  const many = renderToStaticMarkup(h(ModeDial, { label: 'Room light', options: modes }));
  assert.match(many, /role="slider"/);
  assert.doesNotMatch(many, /aria-checked/);
  assert.match(many, /aria-valuemin="0"/);
  assert.match(many, /aria-valuemax="3"/);
  assert.match(many, /aria-valuenow="0"/);
  assert.match(many, /aria-valuetext="Dawn"/);
});

test('ModeDial names the current mode beneath the face', () => {
  const html = renderToStaticMarkup(h(ModeDial, { label: 'Room light', defaultValue: 'night', options: modes }));
  assert.match(html, /class="l-etched"[^>]*>Night</);
  assert.doesNotMatch(html, /aria-live=/);
});

test('ModeDial degrades safely for empty, single and invalid selections', () => {
  assert.equal(renderToStaticMarkup(h(ModeDial, { label: 'Empty', options: [] })), '');

  const single = renderToStaticMarkup(h(ModeDial, {
    label: 'Only mode',
    options: [{ value: 'quiet', label: 'Quiet' }],
  }));
  assert.match(single, /role="img"/);
  assert.match(single, /data-single/);
  assert.doesNotMatch(single, /data-turnable|role="switch"|role="slider"/);
  assert.match(single, />Quiet</);

  const invalid = renderToStaticMarkup(h(ModeDial, {
    label: 'Room light', value: 'missing', options: modes,
  }));
  assert.match(invalid, /data-selection-invalid/);
  assert.match(invalid, /role="img"/);
  assert.match(invalid, /aria-invalid="true"/);
  assert.match(invalid, />Unavailable</);
  assert.doesNotMatch(invalid, /role="switch"|role="slider"|aria-valuenow|aria-valuetext|data-on/);
});

test('ModeDial reconciliation handles options arriving and controlled drift honestly', () => {
  const resolve = loadModeDialReconciliation();
  assert.deepEqual(resolve([], undefined, false), {
    index: -1, value: undefined, invalid: false,
  });
  assert.deepEqual(resolve(modes, undefined, false), {
    index: 0, value: 'dawn', invalid: false,
  });
  assert.deepEqual(resolve(modes, 'night', true), {
    index: 3, value: 'night', invalid: false,
  });
  assert.deepEqual(resolve(modes, 'missing', true), {
    index: -1, value: undefined, invalid: true,
  });
});

test('ModeDial keeps wrapper props separate from face props', () => {
  const html = renderToStaticMarkup(h(ModeDial, {
    label: 'Reading lamp',
    options: [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }],
    id: 'dial-face',
    className: 'face-class',
    wrapperProps: { id: 'dial-wrapper', className: 'wrapper-class', 'data-wrapper': '' },
  }));
  assert.match(html, /<div[^>]*id="dial-wrapper"[^>]*class="l-mode-dial wrapper-class"[^>]*data-wrapper/);
  assert.match(html, /<button[^>]*id="dial-face"[^>]*class="l-dial face-class"/);
  assert.doesNotMatch(html, /<div[^>]*id="dial-face"/);
});

test('Gauge temperature is caller owned rather than inferred from magnitude', () => {
  const at = (value, reading) => renderToStaticMarkup(h(Gauge, { value, reading, label: 'Letters held' }));
  assert.match(at(0.95), /data-reading="quiet"/);
  assert.match(at(0.6, 'warming'), /data-reading="warming"/);
  assert.match(at(0.2, 'attention'), /data-reading="attention"/);
  assert.match(at(0.5, 'unknown'), /data-reading="quiet"/);
});

test('Gauge owns finite range ARIA while the caller owns metric words', () => {
  const html = renderToStaticMarkup(h(Gauge, {
    value: 6, min: 0, max: 10, valueText: 'Six of ten', label: 'Letters held',
    role: 'progressbar', 'aria-valuenow': 999, 'aria-valuetext': 'Wrong',
  }));
  assert.match(html, /role="meter"/);
  assert.match(html, /aria-valuemin="0"/);
  assert.match(html, /aria-valuemax="10"/);
  assert.match(html, /aria-valuenow="6"/);
  assert.match(html, /aria-valuetext="Six of ten"/);
  assert.match(html, /aria-label="Letters held"/);
  assert.doesNotMatch(html, /progressbar|999|Wrong/);
});

test('Gauge normalises non-finite values, invalid ranges and tick counts', () => {
  const invalid = renderToStaticMarkup(h(Gauge, {
    value: Number.POSITIVE_INFINITY, min: 8, max: 2, ticks: Number.NaN, label: 'Invalid input',
  }));
  assert.match(invalid, /data-value-invalid/);
  assert.match(invalid, /data-range-invalid/);
  assert.match(invalid, /aria-valuemin="0"/);
  assert.match(invalid, /aria-valuemax="1"/);
  assert.match(invalid, /aria-valuenow="0"/);
  assert.equal([...invalid.matchAll(/class="l-tick"/g)].length, 9, invalid);

  const minimum = renderToStaticMarkup(h(Gauge, { ticks: 1, label: 'Minimum' }));
  const maximum = renderToStaticMarkup(h(Gauge, { ticks: 1000, label: 'Maximum' }));
  assert.equal([...minimum.matchAll(/class="l-tick"/g)].length, 2, minimum);
  assert.equal([...maximum.matchAll(/class="l-tick"/g)].length, 101, maximum);
});

test('Gauge lights a live needle and leaves a held one metal', () => {
  const live = renderToStaticMarkup(h(Gauge, { value: 0.5, live: true, label: 'Live' }));
  const held = renderToStaticMarkup(h(Gauge, { value: 0.5, live: false, label: 'Held', 'data-live': 'caller' }));
  assert.match(live, /data-live/);
  assert.doesNotMatch(held, /data-live/);
});
