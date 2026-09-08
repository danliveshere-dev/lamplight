import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Field, FocalCatch, Input, Menu, Room, Status, Tabs } from '../dist/index.js';

const h = React.createElement;
const tabs = [
  { id: 'reading', label: 'Reading', content: 'A quiet reading surface.' },
  { id: 'notes', label: 'Notes', content: 'Notes worth carrying forward.' },
];

test('Tabs scopes ids for repeated instances', () => {
  const html = renderToStaticMarkup(h('main', null,
    h(Tabs, { label: 'First window', tabs }),
    h(Tabs, { label: 'Second window', tabs })));
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, html);
  for (const target of [...html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)]) {
    assert.match(html, new RegExp(`\\sid="${target[1]}"`));
  }
});

test('Menu binds its controlled trigger to a uniquely identified sheet', () => {
  const html = renderToStaticMarkup(h(Menu, {
    trigger: 'Place this',
    open: true,
    onOpenChange() {},
    items: [{ label: 'Keep it' }],
  }));
  const controls = html.match(/aria-controls="([^"]+)"/)?.[1];
  assert.ok(controls, html);
  assert.match(html, new RegExp(`role="menu"[^>]*id="${controls}"|id="${controls}"[^>]*role="menu"`));
});

test('Field owns the stable error relationship and invalid state', () => {
  const html = renderToStaticMarkup(h(Field, {
    label: 'A note back',
    description: 'One line is enough.',
    error: 'The note could not be kept. Your words are still here.',
  }, h(Input, { name: 'note' })));
  const controlId = html.match(/<input[^>]*\sid="([^"]+)"/)?.[1];
  const describedBy = html.match(/<input[^>]*aria-describedby="([^"]+)"/)?.[1]?.split(' ') ?? [];
  assert.ok(controlId, html);
  assert.match(html, new RegExp(`<label[^>]*for="${controlId}"`));
  assert.match(html, /<input[^>]*aria-invalid="true"/);
  assert.equal(describedBy.length, 2, html);
  for (const id of describedBy) assert.match(html, new RegExp(`\\sid="${id}"`));
});

test('Status announces truthful loading state politely', () => {
  const html = renderToStaticMarkup(h(Status, { state: 'loading' }, 'Looking for it'));
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-atomic="true"/);
  assert.match(html, /data-state="loading"/);
  assert.doesNotMatch(html, /aria-busy=/);
});

test('FocalCatch keeps presence decorative and focus meaning visible', () => {
  const html = renderToStaticMarkup(h(FocalCatch, {
    label: 'Current focus',
    state: 'active',
  }, h('h3', null, 'Shape the sustained working surface.')));
  assert.match(html, /class="l-focal-catch"/);
  assert.match(html, /data-state="active"/);
  assert.match(html, /class="l-focal-source" aria-hidden="true"/);
  assert.match(html, />Current focus</);
  assert.match(html, />Active work</);
  assert.doesNotMatch(html, /role="status"/);
});

test('Room is a pure scoped boundary with no automatic document runtime', () => {
  const source = readFileSync(new URL('../src/compound.js', import.meta.url), 'utf8');
  const html = renderToStaticMarkup(h('div', null,
    h('p', null, 'Host document'),
    h(Room, null, h('p', null, 'Lamplight room'))));
  assert.match(html, /<div class="l-room"><p>Lamplight room<\/p><\/div>/);
  assert.doesNotMatch(source, /initLivingLight|living-light/);
});

test('React adapter exports structure without copying core assets or runtime', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const root = readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8');
  assert.deepEqual(Object.keys(pkg.exports), ['.']);
  assert.deepEqual(pkg.peerDependencies, { react: '>=18' });
  assert.equal(pkg.dependencies, undefined);
  assert.doesNotMatch(root, /import\s+['"][^'"]+\.css|initLivingLight|data-press-phase|DWELL_DELAY/);
});
