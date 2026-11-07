#!/usr/bin/env node
// Stage only the checked beta files after the beta builder has finished.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const source = join(root, '.beta');
const destination = join(root, 'examples/showcase/dist/downloads');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const names = [`lamplight-core-${version}.tgz`, `lamplight-react-${version}.tgz`, `lamplight-browser-${version}.zip`];
const allNames = [...names, 'manifest.json', 'SHA256SUMS'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
// Reviewed publication evidence pins the original release manifest, not just its claims.
const releasedManifestHashes = new Map([
  ['0.1.0-beta.5', '4cafbcb5f550b69d2c8ac275e925de986cf3308150e50930d1f1ae8e5212e93c'],
]);

// Validate bytes before touching the existing staged downloads.
export function validateAssets(assets, version, expectedHead, expectedManifestHash) {
  const names = [`lamplight-core-${version}.tgz`, `lamplight-react-${version}.tgz`, `lamplight-browser-${version}.zip`];
  const expected = [...names, 'manifest.json', 'SHA256SUMS'];
  if (JSON.stringify(Object.keys(assets).sort()) !== JSON.stringify(expected.sort())) throw new Error('Unexpected beta asset names.');
  if (expectedManifestHash && digest(assets['manifest.json']) !== expectedManifestHash) throw new Error('Released manifest differs from the reviewed publication.');
  const manifest = JSON.parse(assets['manifest.json'].toString('utf8'));
  if (manifest.version !== version || manifest.packagesPrivate !== true || manifest.registryPublication !== false ||
      manifest.source?.dirty !== false || manifest.source?.head !== expectedHead ||
      !manifest.files || JSON.stringify(Object.keys(manifest.files).sort()) !== JSON.stringify([...names].sort())) {
    throw new Error('Beta manifest does not describe this private-package candidate.');
  }
  for (const name of names) if (digest(assets[name]) !== manifest.files[name]) throw new Error(`Beta checksum mismatch: ${name}`);
  const sums = [...names, 'manifest.json'].sort().map(name => `${digest(assets[name])}  ${name}\n`).join('');
  if (assets.SHA256SUMS.toString('utf8') !== sums) throw new Error('SHA256SUMS does not match the candidate.');
}

async function stage() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--released')) throw new Error('Usage: stage-site.mjs [--released]');
  const released = args[0] === '--released';
  const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {cwd: root, encoding: 'utf8'});
  if (status.trim()) throw new Error('Staging requires a clean committed checkout.');
  let head;
  let assets;
  if (released) {
    if (!releasedManifestHashes.has(version)) throw new Error('Record a reviewed release manifest digest before publishing this version.');
    const tag = `v${version}`;
    if (execFileSync('git', ['cat-file', '-t', `refs/tags/${tag}`], {cwd: root, encoding: 'utf8'}).trim() !== 'tag') throw new Error('Release tag must be annotated.');
    head = execFileSync('git', ['rev-parse', `refs/tags/${tag}^{commit}`], {cwd: root, encoding: 'utf8'}).trim();
    assets = Object.fromEntries(await Promise.all(allNames.map(async name => {
      const response = await fetch(`https://github.com/danliveshere-dev/lamplight/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`, {credentials: 'omit', signal: AbortSignal.timeout(30_000)});
      if (!response.ok) throw new Error(`Release download failed: ${name} (${response.status})`);
      return [name, Buffer.from(await response.arrayBuffer())];
    })));
  } else {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
    assets = Object.fromEntries(allNames.map(name => [name, readFileSync(join(source, name))]));
  }
  validateAssets(assets, version, head, released ? releasedManifestHashes.get(version) : undefined);
  const landing = join(root, 'examples/showcase/dist/index.html');
  if (!existsSync(landing)) throw new Error('Build the showcase before staging downloads.');
  const html = readFileSync(landing, 'utf8');
  for (const name of [...names, 'SHA256SUMS', 'manifest.json']) {
    if (!html.includes(`href="./downloads/${name}"`)) throw new Error(`Showcase download link missing: ${name}`);
}
rmSync(destination, {recursive: true, force: true});
mkdirSync(destination, {recursive: true});
for (const name of allNames) writeFileSync(join(destination, name), assets[name]);
console.log(`Staged ${released ? 'released' : 'local'} beta ${version} downloads for the showcase.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await stage();
