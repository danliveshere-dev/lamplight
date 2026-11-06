import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const output = new URL('./dist/', import.meta.url);
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'examples.html', 'components.html', 'chapters.html', 'principles.html', 'showcase.css', 'showcase.js']) {
  cpSync(new URL(`./${file}`, import.meta.url), new URL(`./${file}`, output));
}
cpSync(new URL('../../docs/ai-starters.md', import.meta.url), new URL('./ai-starters.md', output));
cpSync(new URL('../../packages/core/dist/', import.meta.url), new URL('./core/', output), { recursive: true });

// Version every imported CSS layer so a cached entry sheet cannot retain old modes.
const layers = ['tokens', 'components', 'modes', 'surfaces'];
const resources = ['showcase.css', 'showcase.js', 'core/chapter-rail.js', ...layers.map(name => `core/${name}.css`)];
const hash = createHash('sha256');
for (const resource of resources) hash.update(resource).update(readFileSync(new URL(resource, output)));
const version = hash.digest('hex').slice(0, 12);
writeFileSync(new URL('showcase-core.css', output), layers.map(name => `@import "./core/${name}.css?v=${version}";\n`).join(''));
for (const file of ['index.html', 'examples.html', 'components.html', 'chapters.html', 'principles.html']) {
  const path = new URL(file, output);
  const html = readFileSync(path, 'utf8')
    .replace('<link rel="stylesheet" href="./core/lamplight.css">', `<link rel="stylesheet" href="./showcase-core.css?v=${version}">`)
    .replace('href="./showcase.css"', `href="./showcase.css?v=${version}"`)
    .replace('src="./showcase.js"', `src="./showcase.js?v=${version}"`)
    .replace("from './core/chapter-rail.js'", `from './core/chapter-rail.js?v=${version}'`);
  writeFileSync(path, html);
}
console.log('Built synthetic showcase with relocatable ./core/ assets and versioned preview styles.');
