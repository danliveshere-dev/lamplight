import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import test from 'node:test';

const repository = resolve(new URL('..', import.meta.url).pathname);

function filesWithin(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...filesWithin(path));
    else found.push(path);
  }
  return found;
}

test('README links every required Gate 3 guide and runnable example', () => {
  const readme = readFileSync(join(repository, 'README.md'), 'utf8');
  const required = [
    'docs/tokens.md', 'docs/components.md', 'docs/accessibility.md',
    'docs/browser-support.md', 'docs/migration-internal-package.md', 'docs/adapters.md',
    'docs/adoption.md', 'docs/versioning.md', 'CONTRIBUTING.md',
    'examples/vanilla/index.html', 'examples/astro/src/pages/index.astro',
    'examples/react/src/page.mjs',
  ];
  for (const path of required) assert.match(readme, new RegExp(path.replaceAll('.', '\\.')), path);
});

test('React peer intent is distinct from observed compatibility evidence', () => {
  const readme = readFileSync(join(repository, 'README.md'), 'utf8');
  const adapters = readFileSync(join(repository, 'docs/adapters.md'), 'utf8');
  const evidence = readFileSync(join(repository, 'docs/release/gate-3-evidence.md'), 'utf8');

  assert.doesNotMatch(readme, /supports React 18 or newer/i);
  assert.match(readme, /declares a `react >=18` peer contract/);
  for (const source of [readme, adapters, evidence]) {
    assert.match(source, /observed\s+React\s+19\.2\.8\s+only/);
  }
  assert.match(adapters, /React 18 and 19/);
  assert.match(evidence, /React 18 validation remains an explicit Gate 4 matrix item/);
});

test('local Markdown links resolve to repository files', () => {
  const markdown = [join(repository, 'README.md'), join(repository, 'CONTRIBUTING.md'),
    ...filesWithin(join(repository, 'docs')).filter((path) => extname(path) === '.md')];
  const missing = [];
  for (const file of markdown) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
      const resolved = resolve(dirname(file), decodeURIComponent(target));
      if (!existsSync(resolved)) missing.push(`${file}: ${target}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('examples are private, synthetic and outside the publishable workspaces', () => {
  const root = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8'));
  assert.deepEqual(root.workspaces, ['packages/core', 'packages/react']);
  for (const kind of ['vanilla', 'astro', 'react']) {
    const pkg = JSON.parse(readFileSync(join(repository, 'examples', kind, 'package.json'), 'utf8'));
    assert.equal(pkg.private, true, kind);
  }

  const forbidden = [
    new RegExp(`\\b${'Da' + 'ius'}2?\\b`, 'i'),
    new RegExp(`\\b${'Gl' + 'im'}\\b`, 'i'),
    new RegExp(`\\b${'Re' + 'ach'}\\b`),
    new RegExp(`\\b${'Sker' + 'rick'}\\b`, 'i'),
    new RegExp(`\\b${'Or' + 'rery'}\\b`, 'i'),
    new RegExp(`${'Second' + ' Brain'}`, 'i'),
  ];
  for (const file of filesWithin(join(repository, 'examples'))) {
    const source = readFileSync(file, 'utf8');
    for (const pattern of forbidden) assert.doesNotMatch(source, pattern, file);
  }
});

test('vanilla, Astro and React builds produce readable Lamplight surfaces', () => {
  const outputs = [
    join(repository, 'examples/vanilla/dist/index.html'),
    join(repository, 'examples/astro/dist/index.html'),
    join(repository, 'examples/react/dist/index.html'),
  ];
  for (const output of outputs) {
    const html = readFileSync(output, 'utf8');
    assert.match(html, /l-room/);
    assert.match(html, /l-panel/);
    assert.match(html, /<h1[ >]/);
  }
});

test('examples demonstrate core-only and adapter-assisted adoption', () => {
  const vanilla = readFileSync(join(repository, 'examples/vanilla/index.html'), 'utf8');
  const astro = readFileSync(join(repository, 'examples/astro/src/pages/index.astro'), 'utf8');
  const react = readFileSync(join(repository, 'examples/react/src/page.mjs'), 'utf8');
  assert.match(vanilla, /packages\/core\/generated\/tokens\.css/);
  assert.match(astro, /packages\/core\/generated\/tokens\.css/);
  assert.match(react, /packages\/react\/dist\/index\.js/);
  assert.doesNotMatch(vanilla + astro, /packages\/react/);
});
