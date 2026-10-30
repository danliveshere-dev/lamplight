import test from 'node:test';
import assert from 'node:assert/strict';
import { readBeta, validateBeta } from '../scripts/beta/validate.mjs';
import { fileURLToPath } from 'node:url';
const source = readBeta(fileURLToPath(new URL('..', import.meta.url)));
test('beta profile accepts the actual manifests and rejects unsafe drift', () => {
  assert.deepEqual(validateBeta(source), []);
  for (const mutate of [
    x => { x.packages[0].manifest.private = false; },
    x => { x.packages[0].manifest.version = '0.1.0-beta.2'; },
    x => { x.packages[1].readme = ''; },
    x => { x.packages[0].manifest.dependencies = {bad: '1'}; },
    x => { x.packages[0].manifest.scripts.prepack = 'bad'; },
    x => { x.packages[0].manifest.publishConfig = {access:'public'}; },
    x => { x.packages.pop(); },
    x => { x.rootManifest.version = '0.1.0'; },
  ]) { const candidate = structuredClone(source); mutate(candidate); assert.notDeepEqual(validateBeta(candidate), []); }
});
