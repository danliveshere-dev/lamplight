import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { Page } from './src/page.mjs';

const output = new URL('./dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const body = renderToStaticMarkup(Page());
writeFileSync(new URL('./index.html', output), `<!doctype html>
<html lang="en" class="l-document">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Lamplight React reading room</title>
    <link rel="stylesheet" href="./tokens.css">
    <link rel="stylesheet" href="./components.css">
  </head>
  <body>${body}</body>
</html>
`);
copyFileSync(new URL('../../packages/core/dist/tokens.css', import.meta.url), new URL('./tokens.css', output));
copyFileSync(new URL('../../packages/core/dist/components.css', import.meta.url), new URL('./components.css', output));

console.log('Built synthetic React example by static rendering the adapter.');
