import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const output = new URL('./dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8')
  .replace('../../packages/core/generated/tokens.css', './tokens.css')
  .replace('../../packages/core/src/components.css', './components.css');
writeFileSync(new URL('./index.html', output), html);
copyFileSync(new URL('../../packages/core/dist/tokens.css', import.meta.url), new URL('./tokens.css', output));
copyFileSync(new URL('../../packages/core/dist/components.css', import.meta.url), new URL('./components.css', output));

console.log('Built synthetic vanilla example.');
