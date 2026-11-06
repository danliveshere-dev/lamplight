#!/usr/bin/env node
// Stage only the checked beta files after the beta builder has finished.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const source = join(root, '.beta');
const destination = join(root, 'examples/showcase/dist/downloads');
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {cwd: root, encoding: 'utf8'});
if (status.trim()) throw new Error('Staging requires the same clean committed checkout as the beta build.');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const names = [`lamplight-core-${version}.tgz`, `lamplight-react-${version}.tgz`, `lamplight-browser-${version}.zip`];
const digest = file => createHash('sha256').update(readFileSync(join(source, file))).digest('hex');
if (manifest.version !== version || manifest.packagesPrivate !== true || manifest.registryPublication !== false ||
    manifest.source?.dirty !== false || manifest.source?.head !== head || JSON.stringify(Object.keys(manifest.files).sort()) !== JSON.stringify([...names].sort())) {
  throw new Error('Beta manifest does not describe this private-package candidate.');
}
for (const name of names) if (digest(name) !== manifest.files[name]) throw new Error(`Beta checksum mismatch: ${name}`);
const expectedSums = [...names, 'manifest.json'].sort().map(name => `${digest(name)}  ${name}\n`).join('');
if (readFileSync(join(source, 'SHA256SUMS'), 'utf8') !== expectedSums) throw new Error('SHA256SUMS does not match the candidate.');
const landing = join(root, 'examples/showcase/dist/index.html');
if (!existsSync(landing)) throw new Error('Build the showcase before staging downloads.');
const html = readFileSync(landing, 'utf8');
for (const name of [...names, 'SHA256SUMS', 'manifest.json']) {
  if (!html.includes(`href="./downloads/${name}"`)) throw new Error(`Showcase download link missing: ${name}`);
}
rmSync(destination, {recursive: true, force: true});
mkdirSync(destination, {recursive: true});
for (const name of [...names, 'manifest.json', 'SHA256SUMS']) copyFileSync(join(source, name), join(destination, name));
console.log(`Staged beta ${version} downloads for the showcase.`);
