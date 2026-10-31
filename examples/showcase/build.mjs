import { cpSync, mkdirSync, rmSync } from 'node:fs';
const output = new URL('./dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'examples.html', 'components.html', 'principles.html', 'showcase.css', 'showcase.js']) cpSync(new URL(`./${file}`, import.meta.url), new URL(`./${file}`, output));
cpSync(new URL('../../docs/ai-starters.md', import.meta.url), new URL('./ai-starters.md', output));
cpSync(new URL('../../packages/core/dist/', import.meta.url), new URL('./core/', output), { recursive: true });
console.log('Built synthetic showcase with relocatable ./core/ assets.');
