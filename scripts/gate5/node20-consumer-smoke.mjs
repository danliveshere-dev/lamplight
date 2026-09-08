#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
if (Number.parseInt(process.versions.node, 10) !== 20) {
  throw new Error(`Node 20 packed consumer smoke must run on Node 20, received ${process.version}`);
}
const work = mkdtempSync(join(tmpdir(), 'lamplight-node20-smoke-'));
const cache = join(work, 'npm-cache');
const environment = {
  ...process.env,
  npm_config_cache: cache,
  npm_config_ignore_scripts: 'true',
  npm_config_audit: 'false',
  npm_config_fund: 'false',
};

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, env: environment, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function pack(workspace, destination) {
  mkdirSync(destination, { recursive: true });
  const [record] = JSON.parse(run('npm', ['pack', '--json', '--workspace', workspace, '--pack-destination', destination]));
  return join(destination, record.filename);
}

try {
  const core = pack('@lamplight-internal/core', join(work, 'core'));
  const reactAdapter = pack('@lamplight-internal/react', join(work, 'react'));
  const consumer = join(work, 'consumer');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), `${JSON.stringify({
    name: 'lamplight-node20-packed-smoke',
    private: true,
    type: 'module',
    dependencies: {
      '@lamplight-internal/core': `file:${core}`,
      '@lamplight-internal/react': `file:${reactAdapter}`,
      react: '18.3.1',
      'react-dom': '18.3.1',
    },
  }, null, 2)}\n`);
  writeFileSync(join(consumer, 'smoke.mjs'), `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Room } from '@lamplight-internal/react';
const markup = renderToStaticMarkup(React.createElement(Room, null, React.createElement(Button, null, 'Open')));
if (!markup.includes('l-room') || !markup.includes('l-btn')) throw new Error('React adapter import failed');
if (!import.meta.resolve('@lamplight-internal/core/styles.css').endsWith('/dist/lamplight.css')) throw new Error('core export import failed');
`);
  run('npm', ['install'], consumer);
  run('node', ['smoke.mjs'], consumer);
  console.log(`Node 20 packed consumer smoke passed on ${process.version}.`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
