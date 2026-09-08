#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(path) {
  return createHash('sha256').update(readFileSync(join(root, path))).digest('hex');
}

const apache = read('LICENSE');
const reuseApache = read('LICENSES/Apache-2.0.txt');
const ofl = read('LICENSES/OFL-1.1.txt');
const notice = read('NOTICE');
const reuse = read('REUSE.toml');

expect(apache === reuseApache, 'root LICENSE and LICENSES/Apache-2.0.txt differ');
expect(apache.includes('Apache License') && apache.includes('Version 2.0, January 2004'), 'Apache-2.0 licence text is incomplete');
expect(ofl.includes('SIL OPEN FONT LICENSE Version 1.1'), 'OFL-1.1 licence text is incomplete');
expect(ofl.includes('Reserved Font Name "Plex"'), 'IBM Plex reserved font name is missing');
expect(notice.includes('Lamplight source code and documentation') && notice.includes('Apache-2.0'), 'NOTICE does not classify Lamplight code and documentation');
expect(notice.includes('IBM Plex') && notice.includes('OFL-1.1') && notice.includes('not licensed under Apache-2.0'), 'NOTICE does not preserve the IBM Plex licence boundary');

expect(/^version = 1$/m.test(reuse), 'REUSE.toml must use schema version 1');
const annotations = [...reuse.matchAll(/\[\[annotations\]\]([\s\S]*?)(?=\n\[\[annotations\]\]|$)/g)].map((match) => match[1]);
expect(annotations.length === 2, `expected two REUSE annotations, found ${annotations.length}`);
expect(annotations[0].includes('path = "**"') && annotations[0].includes('SPDX-License-Identifier = "Apache-2.0"'), 'first REUSE annotation must set the Apache-2.0 default');
for (const path of ['packages/core/fonts/*.woff2', 'packages/core/fonts/OFL.txt', 'packages/core/dist/fonts/*.woff2', 'packages/core/dist/fonts/OFL.txt']) {
  expect(annotations[1].includes(`"${path}"`), `last REUSE annotation does not cover ${path}`);
}
expect(annotations[1].includes('SPDX-License-Identifier = "OFL-1.1"'), 'last REUSE annotation must override fonts to OFL-1.1');
expect(!annotations[1].includes('fonts/**'), 'font override is too broad and would mislicense Lamplight CSS');

for (const packagePath of ['package.json', 'packages/core/package.json', 'packages/react/package.json']) {
  const manifest = JSON.parse(read(packagePath));
  expect(manifest.license === 'Apache-2.0', `${packagePath} does not declare Apache-2.0`);
}

expect(digest('packages/core/fonts/OFL.txt') === digest('LICENSES/OFL-1.1.txt'), 'packaged font licence and REUSE OFL-1.1 text differ');
for (const packageDirectory of ['packages/core', 'packages/react']) {
  expect(digest(`${packageDirectory}/LICENSE`) === digest('LICENSE'), `${packageDirectory}/LICENSE drifted from the canonical root licence`);
  expect(digest(`${packageDirectory}/NOTICE`) === digest('NOTICE'), `${packageDirectory}/NOTICE drifted from the canonical root notice`);
}
const sourceFonts = readdirSync(join(root, 'packages/core/fonts')).filter((name) => /\.woff2?$/.test(name));
expect(sourceFonts.length > 0, 'no IBM Plex font assets were found');
for (const name of sourceFonts) {
  expect(existsSync(join(root, 'packages/core/dist/fonts', name)), `generated font copy is missing: ${name}`);
  expect(digest(`packages/core/fonts/${name}`) === digest(`packages/core/dist/fonts/${name}`), `generated font copy changed bytes: ${name}`);
}

console.log(`Lamplight licence check passed (${sourceFonts.length} IBM Plex assets remain OFL-1.1; code and documentation are Apache-2.0).`);
