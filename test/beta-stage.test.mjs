import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateAssets } from '../scripts/beta/stage-site.mjs';

const version = '0.1.0-beta.5';
const head = 'a'.repeat(40);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture() {
  const files = Object.fromEntries(['core', 'react', 'browser'].map(name => [`lamplight-${name}-${version}.${name === 'browser' ? 'zip' : 'tgz'}`, Buffer.from(name)]));
  const manifest = Buffer.from(JSON.stringify({version, source: {head, dirty: false}, packagesPrivate: true, registryPublication: false, files: Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, digest(bytes)]))}));
  const assets = {...files, 'manifest.json': manifest};
  assets.SHA256SUMS = Buffer.from(Object.keys(assets).sort().map(name => `${digest(assets[name])}  ${name}\n`).join(''));
  return assets;
}
test('released assets must match checksums and the annotated tag commit', () => {
  const assets = fixture();
  assert.doesNotThrow(() => validateAssets(assets, version, head));
  assert.throws(() => validateAssets({...assets, [`lamplight-core-${version}.tgz`]: Buffer.from('tampered')}, version, head), /checksum mismatch/);
  assert.throws(() => validateAssets({...assets, SHA256SUMS: Buffer.from('tampered')}, version, head), /SHA256SUMS/);
  assert.throws(() => validateAssets(assets, version, 'b'.repeat(40)), /manifest/);
  assert.throws(() => validateAssets({...assets, 'extra.zip': Buffer.alloc(0)}, version, head), /asset names/);
});

test('a consistently replaced release cannot pass the reviewed manifest pin', () => {
  const assets = fixture();
  const reviewedHash = digest(assets['manifest.json']);
  assert.doesNotThrow(() => validateAssets(assets, version, head, reviewedHash));
  const archive = `lamplight-core-${version}.tgz`;
  assets[archive] = Buffer.from('replacement');
  const manifest = JSON.parse(assets['manifest.json']);
  manifest.files[archive] = digest(assets[archive]);
  assets['manifest.json'] = Buffer.from(JSON.stringify(manifest));
  assets.SHA256SUMS = Buffer.from(Object.keys(assets).filter(name => name !== 'SHA256SUMS').sort().map(name => `${digest(assets[name])}  ${name}\n`).join(''));
  assert.doesNotThrow(() => validateAssets(assets, version, head));
  assert.throws(() => validateAssets(assets, version, head, reviewedHash), /reviewed publication/);
});
