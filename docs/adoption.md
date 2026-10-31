# Adoption guide

Start with a bounded surface and semantic HTML. Wrap it in `.l-room`; use `l-document` only when Lamplight owns the whole page. Check that the host outside the Room remains unchanged.

## Browser starter

The planned `lamplight-browser-0.1.0-beta.2.zip` contains a copyable starter and local assets. Extract it and serve the directory with a static web server. Use its relative stylesheet path and preserve the asset directory when copying it. No release is available yet.

```html
<!doctype html>
<html lang="en" class="l-document">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reading room</title>
  <link rel="stylesheet" href="./core/lamplight.css">
</head>
<body>
  <main class="l-room" data-mode="day" data-surface="ledger">
    <article class="l-panel" data-depth="focal">
      <h1>Reading room</h1>
      <p>One passage, held quietly.</p>
      <button class="l-btn" data-kind="primary" type="button">Keep reading</button>
    </article>
  </main>
</body>
</html>
```

The button is a native button. Connect its action in your application; CSS does not supply the action. The browser starter's own HTML is the authoritative copyable example for its asset paths.

## React with a bundler

After the beta assets are released, install `lamplight-core-0.1.0-beta.2.tgz` and `lamplight-react-0.1.0-beta.2.tgz` by local file path. Install React separately; the adapter declares it as a peer. For example, in a JSX-capable React application:

```jsx
import React from 'react';
import { Room, Panel, Button } from '@lamplight/react';
import '@lamplight/core/styles.css';
// Optional IBM Plex font faces:
// import '@lamplight/core/fonts.css';

export function ReadingRoom() {
  return (
    <Room data-mode="day" data-surface="ledger">
      <Panel depth="focal">
        <h1>Reading room</h1>
        <p>One passage, held quietly.</p>
        <Button kind="primary" onClick={() => console.log('Keep reading')}>
          Keep reading
        </Button>
      </Panel>
    </Room>
  );
}
```

Replace the example handler with application behaviour. Fonts are opt-in; without the font stylesheet system faces are used. `styles.css` includes modes and surfaces. When importing individual CSS exports, include `tokens.css`, `components.css`, `modes.css` and `surfaces.css` in that order.

## Modes, surfaces and enhancement

Night and Study are defaults. `data-mode="day"` selects Day; `data-surface="ledger"` and `data-surface="folio"` select surfaces independently. Ledger can be Night or Day; Folio is always ink. Printing applies Folio styling automatically but physical monochrome print has not been observed and remains experimental.

Living light never starts on import. In a browser application, opt in with:

```js
import { initLivingLight } from '@lamplight/core/living-light';
initLivingLight();
```

Check keyboard operation, visible focus, text contrast, reduced motion and no-JavaScript reading in your own composition. Pair state with a word or shape and appropriate semantics, never colour or motion alone. See [accessibility](accessibility.md) for limits. Override semantic tokens on your Room or add a consumer stylesheet instead of editing generated CSS.
