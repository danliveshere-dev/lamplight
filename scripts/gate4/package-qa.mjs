#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { expectedPackagePaths, validatePackageFileList } from './package-policy.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const skipConsumers = process.argv.includes('--skip-consumers');
const work = mkdtempSync(join(tmpdir(), 'lamplight-package-qa-'));
const cache = join(work, 'npm-cache');
const npmEnvironment = {
  ...process.env,
  npm_config_cache: cache,
  npm_config_ignore_scripts: 'true',
  npm_config_audit: 'false',
  npm_config_fund: 'false',
};

const budgets = {
  tokens: { raw: 8 * 1024, gzip: 2.5 * 1024 },
  surfaces: { raw: 8 * 1024, gzip: 2 * 1024 },
  modes: { raw: 16 * 1024, gzip: 3 * 1024 },
  components: { raw: 36 * 1024, gzip: 7 * 1024 },
  combined: { raw: 55 * 1024, gzip: 10 * 1024 },
  livingLight: { raw: 25 * 1024, gzip: 6 * 1024 },
  react: { raw: 25 * 1024, gzip: 7 * 1024 },
  coreTarball: { packed: 600 * 1024, unpacked: 700 * 1024 },
  reactTarball: { packed: 20 * 1024, unpacked: 60 * 1024 },
};

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    env: options.env ?? process.env,
    stdio: options.capture === false ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
}

function filesWithin(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesWithin(path));
    else files.push(path);
  }
  return files.sort();
}

function directoryDigest(directory) {
  const hash = createHash('sha256');
  for (const file of filesWithin(directory)) {
    hash.update(relative(directory, file));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function size(label, content, limit) {
  const raw = content.byteLength;
  const gzip = gzipSync(content, { level: 9 }).byteLength;
  expect(raw <= limit.raw, `${label} raw size ${raw} exceeds ${limit.raw}`);
  expect(gzip <= limit.gzip, `${label} gzip size ${gzip} exceeds ${limit.gzip}`);
  return { raw, gzip, rawBudget: limit.raw, gzipBudget: limit.gzip };
}

function packageRecord(output) {
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
}

function pack(workspace, destination, label, expectedPaths) {
  mkdirSync(destination, { recursive: true });
  const record = packageRecord(run('npm', [
    'pack', '--json', '--workspace', workspace, '--pack-destination', destination,
  ], { env: npmEnvironment }));
  validatePackageFileList(label, record.files.map((file) => file.path), expectedPaths);
  const tarball = join(destination, record.filename);
  expect(existsSync(tarball), `${label} tarball was not created`);
  const extracted = join(destination, 'extracted');
  mkdirSync(extracted);
  run('tar', ['-xzf', tarball, '-C', extracted]);
  return { record, tarball, contentDigest: directoryDigest(join(extracted, 'package')) };
}

function assertManifest(path, label) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  expect(!manifest.dependencies || Object.keys(manifest.dependencies).length === 0, `${label} has runtime dependencies`);
  expect(!manifest.optionalDependencies || Object.keys(manifest.optionalDependencies).length === 0, `${label} has optional dependencies`);
  for (const lifecycle of ['preinstall', 'install', 'postinstall', 'prepare', 'prepack', 'postpack']) {
    expect(!manifest.scripts?.[lifecycle], `${label} defines ${lifecycle}`);
  }
}

function assertNoNetworkSideEffects() {
  const surfaces = [
    join(root, 'packages/core/dist/living-light.js'),
    join(root, 'packages/react/dist/index.js'),
  ];
  const network = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(|https?:\/\//;
  for (const path of surfaces) expect(!network.test(readFileSync(path, 'utf8')), `${relative(root, path)} contains a network-capable call`);
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function installConsumer(directory) {
  run('npm', ['install'], { cwd: directory, env: npmEnvironment, capture: false });
}

function vanillaConsumer(coreTarball) {
  const directory = join(work, 'consumer-vanilla');
  writeJson(join(directory, 'package.json'), {
    name: 'lamplight-packed-vanilla-check', private: true, type: 'module',
    dependencies: { '@lamplight-internal/core': `file:${coreTarball}` },
  });
  writeFileSync(join(directory, 'smoke.mjs'), `
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const css = readFileSync(fileURLToPath(import.meta.resolve('@lamplight-internal/core/styles.css')), 'utf8');
if (!css.includes('./tokens.css') || !css.includes('./components.css')) throw new Error('core stylesheet exports are incomplete');
`);
  installConsumer(directory);
  run('node', ['smoke.mjs'], { cwd: directory });
}

function astroConsumer(coreTarball) {
  const directory = join(work, 'consumer-astro');
  writeJson(join(directory, 'package.json'), {
    name: 'lamplight-packed-astro-check', private: true, type: 'module',
    scripts: { build: 'astro build' },
    dependencies: { '@lamplight-internal/core': `file:${coreTarball}`, astro: '7.3.1' },
  });
  writeFileSync(join(directory, 'astro.config.mjs'), `import { defineConfig } from 'astro/config';\nexport default defineConfig({ output: 'static' });\n`);
  mkdirSync(join(directory, 'src/pages'), { recursive: true });
  writeFileSync(join(directory, 'src/pages/index.astro'), `---\nimport '@lamplight-internal/core/styles.css';\n---\n<html><body><main class="l-room"><article class="l-panel"><h1>Packed Astro room</h1></article></main></body></html>\n`);
  installConsumer(directory);
  run('npm', ['run', 'build'], { cwd: directory, env: npmEnvironment, capture: false });
  expect(readFileSync(join(directory, 'dist/index.html'), 'utf8').includes('Packed Astro room'), 'Astro packed consumer output is missing');
}

function reactConsumer(coreTarball, reactTarball, version) {
  const directory = join(work, `consumer-react-${version}`);
  writeJson(join(directory, 'package.json'), {
    name: `lamplight-packed-react-${version.replaceAll('.', '-')}-check`, private: true, type: 'module',
    dependencies: {
      '@lamplight-internal/core': `file:${coreTarball}`,
      '@lamplight-internal/react': `file:${reactTarball}`,
      react: version,
      'react-dom': version,
    },
  });
  writeFileSync(join(directory, 'smoke.mjs'), `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Panel, Room } from '@lamplight-internal/react';
const html = renderToStaticMarkup(React.createElement(Room, null,
  React.createElement(Panel, { depth: 'focal' }, React.createElement(Button, { kind: 'primary' }, 'Keep note'))));
if (!html.includes('l-room') || !html.includes('l-panel') || !html.includes('l-btn')) throw new Error('React adapter markup is incomplete');
if (!import.meta.resolve('@lamplight-internal/core/styles.css').endsWith('/dist/lamplight.css')) throw new Error('core CSS export cannot be resolved');
`);
  installConsumer(directory);
  run('node', ['smoke.mjs'], { cwd: directory });
}

try {
  assertManifest(join(root, 'packages/core/package.json'), 'core');
  assertManifest(join(root, 'packages/react/package.json'), 'React');

  run('npm', ['run', 'build'], { capture: false });
  const firstBuild = {
    core: directoryDigest(join(root, 'packages/core/dist')),
    react: directoryDigest(join(root, 'packages/react/dist')),
  };
  const firstCore = pack('@lamplight-internal/core', join(work, 'pack-first-core'), 'core', expectedPackagePaths.core);
  const firstReact = pack('@lamplight-internal/react', join(work, 'pack-first-react'), 'React', expectedPackagePaths.react);

  run('npm', ['run', 'build'], { capture: false });
  const secondBuild = {
    core: directoryDigest(join(root, 'packages/core/dist')),
    react: directoryDigest(join(root, 'packages/react/dist')),
  };
  const secondCore = pack('@lamplight-internal/core', join(work, 'pack-second-core'), 'core', expectedPackagePaths.core);
  const secondReact = pack('@lamplight-internal/react', join(work, 'pack-second-react'), 'React', expectedPackagePaths.react);

  expect(JSON.stringify(firstBuild) === JSON.stringify(secondBuild), 'two clean builds produced different package content');
  expect(firstCore.contentDigest === secondCore.contentDigest, 'two core packs produced different extracted content');
  expect(firstReact.contentDigest === secondReact.contentDigest, 'two React packs produced different extracted content');

  const tokens = readFileSync(join(root, 'packages/core/dist/tokens.css'));
  const components = readFileSync(join(root, 'packages/core/dist/components.css'));
  const modes = readFileSync(join(root, 'packages/core/dist/modes.css'));
  const surfaces = readFileSync(join(root, 'packages/core/dist/surfaces.css'));
  const livingLight = readFileSync(join(root, 'packages/core/dist/living-light.js'));
  const react = readFileSync(join(root, 'packages/react/dist/index.js'));
  const sizes = {
    tokens: size('tokens.css', tokens, budgets.tokens),
    components: size('components.css', components, budgets.components),
    modes: size('modes.css', modes, budgets.modes),
    surfaces: size('surfaces.css', surfaces, budgets.surfaces),
    combined: size('combined core CSS', Buffer.concat([tokens, Buffer.from('\n'), components, Buffer.from('\n'), modes, Buffer.from('\n'), surfaces]), budgets.combined),
    livingLight: size('living-light.js', livingLight, budgets.livingLight),
    react: size('React adapter', react, budgets.react),
    coreTarball: { ...budgets.coreTarball, packed: firstCore.record.size, unpacked: firstCore.record.unpackedSize },
    reactTarball: { ...budgets.reactTarball, packed: firstReact.record.size, unpacked: firstReact.record.unpackedSize },
  };
  expect(sizes.coreTarball.packed <= budgets.coreTarball.packed, 'core packed tarball exceeds budget');
  expect(sizes.coreTarball.unpacked <= budgets.coreTarball.unpacked, 'core unpacked tarball exceeds budget');
  expect(sizes.reactTarball.packed <= budgets.reactTarball.packed, 'React packed tarball exceeds budget');
  expect(sizes.reactTarball.unpacked <= budgets.reactTarball.unpacked, 'React unpacked tarball exceeds budget');
  assertNoNetworkSideEffects();

  if (!skipConsumers) {
    vanillaConsumer(firstCore.tarball);
    astroConsumer(firstCore.tarball);
    reactConsumer(firstCore.tarball, firstReact.tarball, '18.3.1');
    reactConsumer(firstCore.tarball, firstReact.tarball, '19.2.8');
  }

  console.log(JSON.stringify({
    node: process.version,
    npmCache: 'isolated temporary directory',
    installScripts: 'disabled',
    buildDigests: firstBuild,
    packContentDigests: { core: firstCore.contentDigest, react: firstReact.contentDigest },
    packagePathCounts: { core: expectedPackagePaths.core.length, react: expectedPackagePaths.react.length },
    sizes,
    consumers: skipConsumers ? 'skipped' : ['vanilla', 'astro@7.3.1', 'react@18.3.1', 'react@19.2.8'],
  }, null, 2));
} finally {
  rmSync(work, { recursive: true, force: true });
}
