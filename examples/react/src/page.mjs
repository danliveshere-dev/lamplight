import React from 'react';
import { Actions, Button, Etched, Panel, Reading, Room } from '@lamplight/react';

const h = React.createElement;

export function Page() {
  return h(Room, { style: { minHeight: '100vh', padding: '2rem' } },
    h(Panel, { depth: 'focal', style: { padding: '1.5rem' } },
      h(Etched, null, 'Field notebook'),
      h('h1', null, 'A small observation, held gently.'),
      h(Reading, null, 'The last light reached the far shelf just before the rain.'),
      h(Actions, null,
        h(Button, { kind: 'primary' }, 'Keep the note'),
        h(Button, { kind: 'ghost' }, 'Let it rest'))));
}
