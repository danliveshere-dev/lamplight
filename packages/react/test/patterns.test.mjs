import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Knot, LeadLine, Thread } from '../dist/index.js';

const h = React.createElement;

test('LeadLine and Thread preserve content, caller semantics and class bindings', () => {
  const html = renderToStaticMarkup(h('section', null,
    h(LeadLine, { className: 'l-etched', role: 'heading', 'aria-level': 2 }, 'Evidence'),
    h(Thread, { state: 'live', 'aria-label': 'Evidence trail' },
      h(Knot, { kind: 'lead' }, 'Live · current reading'),
      h(Knot, { state: 'live' }, 'Live · first source witnessed'))));
  assert.match(html, /class="l-lead-line l-etched"/);
  assert.match(html, /role="heading" aria-level="2"/);
  assert.match(html, /class="l-thread" data-state="live"/);
  assert.match(html, /aria-label="Evidence trail"/);
  assert.match(html, /class="l-knot" data-kind="lead"/);
  assert.match(html, /Live · current reading/);
  assert.match(html, /class="l-knot" data-state="live"/);
  assert.match(html, /Live · first source witnessed/);
  assert.doesNotMatch(html, /aria-hidden=/);
});
