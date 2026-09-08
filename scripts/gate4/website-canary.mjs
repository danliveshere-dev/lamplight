#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const website = resolve(root, '..', 'website');
const expectedCommit = '37bef99e6d32c55aea395fdcdbe0a2331c88e4ee';
const commitIndex = process.argv.indexOf('--commit');
const commit = commitIndex >= 0 ? process.argv[commitIndex + 1] : expectedCommit;
if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('website commit must be a full 40-character Git SHA');

const resolvedCommit = execFileSync('git', ['rev-parse', `${commit}^{commit}`], { cwd: website, encoding: 'utf8' }).trim();
if (resolvedCommit !== commit) throw new Error(`website commit did not resolve exactly: ${resolvedCommit}`);

const work = mkdtempSync(join(tmpdir(), 'lamplight-website-canary-'));
const checkout = join(work, 'website');
const archive = join(work, 'website.tar');
const cache = join(work, 'npm-cache');
const environment = {
  ...process.env,
  npm_config_cache: cache,
  npm_config_ignore_scripts: 'true',
  npm_config_audit: 'false',
  npm_config_fund: 'false',
};

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? checkout,
    encoding: 'utf8',
    env: options.env ?? environment,
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

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function chromeSmoke(dist) {
  const types = new Map([['.css', 'text/css'], ['.html', 'text/html'], ['.js', 'text/javascript']]);
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    let candidate = resolve(dist, `.${pathname}`);
    if (pathname.endsWith('/')) candidate = join(candidate, 'index.html');
    if (!candidate.startsWith(`${dist}${sep}`) || !existsSync(candidate) || !statSync(candidate).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': types.get(extname(candidate)) ?? 'application/octet-stream' });
    createReadStream(candidate).pipe(response);
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', accept);
  });
  const address = server.address();
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`http://127.0.0.1:${address.port}/`);
    if (!response?.ok()) throw new Error(`website Chrome smoke returned ${response?.status()}`);
    if (!(await page.locator('main, body').first().isVisible())) throw new Error('website Chrome smoke found no visible surface');
    if (errors.length) throw new Error(`website Chrome smoke console errors: ${errors.join('; ')}`);
  } finally {
    await browser.close();
    await new Promise((accept) => server.close(accept));
  }
}

try {
  mkdirSync(checkout);
  run('git', ['archive', '--format=tar', '--output', archive, commit], { cwd: website, env: process.env });
  run('tar', ['-xf', archive, '-C', checkout], { cwd: work, env: process.env });
  run('npm', ['ci'], { capture: false });

  const source = join(root, 'packages/core/dist');
  run('npm', ['run', 'theme:sync'], { capture: false, env: { ...environment, LAMPLIGHT_DIST: source } });
  const destination = join(checkout, 'src/styles/lamplight');
  const copied = ['tokens.css', 'components.css', ...filesWithin(join(source, 'fonts')).map((path) => join('fonts', relative(join(source, 'fonts'), path)))];
  const hashes = {};
  for (const path of copied) {
    const sourceHash = digest(join(source, path));
    const destinationHash = digest(join(destination, path));
    if (sourceHash !== destinationHash) throw new Error(`vendored asset hash mismatch: ${path}`);
    hashes[path] = sourceHash;
  }

  run('npm', ['test'], { capture: false });
  const checkOutput = run('npm', ['run', 'check']);
  process.stdout.write(checkOutput);
  run('npm', ['run', 'build'], { capture: false });
  await chromeSmoke(join(checkout, 'dist'));

  console.log(JSON.stringify({
    commit,
    isolation: 'git archive in a temporary directory',
    npmCache: 'isolated temporary directory',
    installScripts: 'disabled',
    copiedAssetCount: copied.length,
    copiedAssetHashes: hashes,
    tests: 'passed',
    check: 'passed; retain reported hints as non-blocking diagnostics',
    build: 'passed',
    localChromeSmoke: 'passed',
  }, null, 2));
} finally {
  rmSync(work, { recursive: true, force: true });
}
