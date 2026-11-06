import assert from 'node:assert/strict';
import {
  mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import yaml from 'js-yaml';

import {
  buildPolicyIndex,
  isBinaryLike,
  isDimensionOnlyExif,
  presenceProblems,
  pngProblems,
  readCandidateRegularFile,
} from '../scripts/gate7/binary-policy.mjs';
import { validateReleaseManifests } from '../scripts/gate7/release-manifest-policy.mjs';

const repositoryRoot = resolve(new URL('..', import.meta.url).pathname);

test('binary classification cannot be bypassed by renaming content', () => {
  assert.equal(isBinaryLike('renamed.txt', Buffer.from('89504e470d0a1a0a', 'hex')), true);
  assert.equal(isBinaryLike('renamed.txt', Buffer.from([0x61, 0, 0x62])), true);
  assert.equal(isBinaryLike('renamed.txt', Buffer.from([0xc3, 0x28])), true);
  assert.equal(isBinaryLike('declared.png', Buffer.from('plain text')), true);
  assert.equal(isBinaryLike('ordinary.md', Buffer.from('# Plain UTF-8 text\n')), false);
});

test('binary policy distinguishes exact current and approved historical versions', () => {
  const current = { sha256: 'a'.repeat(64), bytes: 10 };
  const historical = { sha256: 'b'.repeat(64), bytes: 9 };
  const { allowed, errors } = buildPolicyIndex({
    schemaVersion: 2,
    fonts: [{ paths: ['font.woff2'], ...current, approvedHistory: [historical] }],
    screenshots: [],
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(allowed.get('font.woff2').current, current);
  assert.deepEqual(allowed.get('font.woff2').approvedHistory, [historical]);

  const duplicate = buildPolicyIndex({
    schemaVersion: 2,
    fonts: [{ paths: ['same.bin'], ...current }],
    screenshots: [{ path: 'same.bin', ...current }],
  });
  assert.match(duplicate.errors.join('\n'), /duplicate path/);
});

test('current-required binaries cannot be satisfied by historical reachability', () => {
  const current = { sha256: 'a'.repeat(64), bytes: 10 };
  const { allowed, errors } = buildPolicyIndex({
    schemaVersion: 2,
    fonts: [{
      paths: ['packages/core/fonts/font.woff2'],
      historicalPaths: ['assets/fonts/font.woff2'],
      ...current,
    }],
    screenshots: [],
  });
  assert.deepEqual(errors, []);
  const problems = presenceProblems(allowed, new Set(), new Set([
    'packages/core/fonts/font.woff2', 'assets/fonts/font.woff2',
  ]));
  assert.deepEqual(problems, [
    'binary allowlist current-required path is missing from candidate: packages/core/fonts/font.woff2',
  ]);
  assert.deepEqual(presenceProblems(allowed, new Set(['assets/fonts/font.woff2']), new Set([
    'packages/core/fonts/font.woff2', 'assets/fonts/font.woff2',
  ])), [
    'binary allowlist current-required path is missing from candidate: packages/core/fonts/font.woff2',
    'binary allowlist historical-only path must not reappear in candidate: assets/fonts/font.woff2',
  ]);
});

test('candidate reads reject symlinks and non-regular entries without following them', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lamplight-gate7-'));
  try {
    const target = join(directory, 'target');
    writeFileSync(target, 'safe fixture');
    for (const name of ['renamed.png', 'renamed.txt']) {
      const link = join(directory, name);
      symlinkSync(target, link);
      assert.throws(() => readCandidateRegularFile(link), /symlink or non-regular/);
    }
    const nestedDirectory = join(directory, 'directory.bin');
    mkdirSync(nestedDirectory);
    assert.throws(() => readCandidateRegularFile(nestedDirectory), /symlink or non-regular/);
    assert.equal(readCandidateRegularFile(target).toString(), 'safe fixture');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('truncated PNG input produces a bounded policy error', () => {
  assert.deepEqual(pngProblems('surface-chromium.png', Buffer.from('89504e47', 'hex')),
    ['screenshot signature or header is not a complete PNG']);
});

test('WebKit EXIF accepts only the exact dimension-only structure', () => {
  const exif = Buffer.alloc(68);
  exif.write('MM', 0, 'ascii');
  exif.writeUInt16BE(42, 2);
  exif.writeUInt32BE(8, 4);
  exif.writeUInt16BE(1, 8);
  exif.writeUInt16BE(0x8769, 10);
  exif.writeUInt16BE(4, 12);
  exif.writeUInt32BE(1, 14);
  exif.writeUInt32BE(26, 18);
  exif.writeUInt32BE(0, 22);
  exif.writeUInt16BE(3, 26);
  for (const [offset, tag, type, count, value] of [
    [28, 0xa001, 3, 1, 0x00010000],
    [40, 0xa002, 4, 1, 390],
    [52, 0xa003, 4, 1, 844],
  ]) {
    exif.writeUInt16BE(tag, offset);
    exif.writeUInt16BE(type, offset + 2);
    exif.writeUInt32BE(count, offset + 4);
    exif.writeUInt32BE(value, offset + 8);
  }
  exif.writeUInt32BE(0, 64);
  assert.equal(isDimensionOnlyExif(exif, 390, 844), true);
  const hiddenRootPointer = Buffer.from(exif);
  hiddenRootPointer.writeUInt32BE(1, 22);
  assert.equal(isDimensionOnlyExif(hiddenRootPointer, 390, 844), false);
});

test('release manifests require final public metadata and keep the root private', () => {
  const repository = 'https://github.com/maintainer/lamplight';
  const coreManifest = {
    name: '@maintainer/lamplight',
    version: '1.0.0',
    repository: { type: 'git', url: `${repository}.git` },
    homepage: `${repository}#readme`,
    bugs: { url: `${repository}/issues` },
    publishConfig: { access: 'public' },
  };
  const valid = validateReleaseManifests({
    rootManifest: { private: true, repository: `${repository}.git` },
    packages: [
      { path: 'packages/core', manifest: coreManifest, readme: 'x'.repeat(200) },
      {
        path: 'packages/react',
        manifest: { ...coreManifest, name: '@maintainer/lamplight-react' },
        readme: 'x'.repeat(200),
      },
    ],
  });
  assert.deepEqual(valid, []);

  const invalid = validateReleaseManifests({
    rootManifest: { private: false },
    packages: [{
      path: 'packages/core',
      manifest: { name: '@lamplight-internal/core', version: '0.0.0-private.0', private: true },
    }],
  });
  assert.match(invalid.join('\n'), /root package must remain private/);
  assert.match(invalid.join('\n'), /final public scoped package name/);
  assert.match(invalid.join('\n'), /remove the private field/);
  assert.match(invalid.join('\n'), /stable semantic version/);
  assert.match(invalid.join('\n'), /verified root repository URL/);
  assert.match(invalid.join('\n'), /repository README as its homepage/);
  assert.match(invalid.join('\n'), /repository issue tracker/);
  assert.match(invalid.join('\n'), /publishConfig\.access/);
  assert.match(invalid.join('\n'), /package-specific public usage guidance/);

  const duplicateNames = validateReleaseManifests({
    rootManifest: { private: true, repository: `${repository}.git` },
    packages: [
      { path: 'packages/core', manifest: coreManifest, readme: 'x'.repeat(200) },
      { path: 'packages/react', manifest: coreManifest, readme: 'x'.repeat(200) },
    ],
  });
  assert.match(duplicateNames.join('\n'), /distinct package names/);
});

test('public issue routing is structured and does not expose an unrestricted form', () => {
  const config = yaml.load(readFileSync(
    `${repositoryRoot}/.github/ISSUE_TEMPLATE/config.yml`, 'utf8'));
  const bug = yaml.load(readFileSync(
    `${repositoryRoot}/.github/ISSUE_TEMPLATE/bug-report.yml`, 'utf8'));
  const proposal = yaml.load(readFileSync(
    `${repositoryRoot}/.github/ISSUE_TEMPLATE/proposal.yml`, 'utf8'));
  assert.equal(config.blank_issues_enabled, false);
  assert.equal(bug.name, 'Bug report');
  assert.equal(proposal.name, 'Design-system proposal');
  assert.ok(proposal.body.some((item) => item.id === 'consumers'));
});


test('Linux WebKit baseline permits only its reviewed colour metadata', () => {
  const path = 'test/browser/__screenshots__/linux/surface-390x844-webkit.png';
  const body = readFileSync(new URL('../' + path, import.meta.url));
  assert.deepEqual(pngProblems(path, body), []);
  for (const type of ['sBIT', 'sRGB']) {
    const changed = Buffer.from(body);
    changed[changed.indexOf(Buffer.from(type)) + 4] ^= 1;
    assert.ok(pngProblems(path, changed).some(problem => problem.includes('colour metadata')));
  }
});
