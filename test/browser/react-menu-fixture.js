import React from 'react';
import { createRoot } from 'react-dom/client';
import { Menu } from '../../packages/react/src/compound.js';

const h = React.createElement;
const items = [{ label: 'First' }, { label: 'Second' }, { label: 'Third' }];

function App() {
  const [generation, setGeneration] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [lastChange, setLastChange] = React.useState('none');
  React.useEffect(() => {
    window.rerenderMenuParent = () => setGeneration((value) => value + 1);
    return () => { delete window.rerenderMenuParent; };
  }, []);
  return h('main', null,
    h('output', { 'data-testid': 'generation' }, generation),
    h('output', { 'data-testid': 'last-change' }, lastChange),
    h('section', { 'aria-label': 'Controlled menu' }, h(Menu, {
      trigger: 'Controlled', items, open,
      onOpenChange: (next) => { setLastChange(`${generation}:${next}`); setOpen(next); },
    })),
    h('section', { 'aria-label': 'Uncontrolled menu' }, h(Menu, {
      trigger: 'Uncontrolled', items,
      onOpenChange: (next) => setLastChange(`${generation}:${next}`),
    })),
    h('button', { type: 'button' }, 'Outside'));
}

createRoot(document.getElementById('root')).render(h(App));
