import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
const output = new URL('./dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8').replace('../../packages/core/dist/lamplight.css', './core/lamplight.css');
writeFileSync(new URL('./index.html', output), html);
cpSync(new URL('../../packages/core/dist/', import.meta.url), new URL('./core/', output), { recursive: true });
console.log('Built synthetic vanilla example.');
