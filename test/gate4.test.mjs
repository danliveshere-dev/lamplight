import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { expectedPackagePaths, validatePackageFileList } from '../scripts/gate4/package-policy.mjs';

const repository = resolve(new URL('..', import.meta.url).pathname);
const manifest = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8'));

test('Gate 4 browser tools are pinned and all observed engines are configured', () => {
  assert.equal(manifest.devDependencies['@playwright/test'], '1.62.1');
  assert.equal(manifest.devDependencies['@axe-core/playwright'], '4.13.0');
  const config = readFileSync(join(repository, 'playwright.config.mjs'), 'utf8');
  for (const engine of ['chromium', 'firefox', 'webkit', 'local-chrome']) {
    assert.match(config, new RegExp(`name: '${engine}'`));
  }
});

test('Gate 4 fixture encodes every required viewport and evidence contract', () => {
  const suite = readFileSync(join(repository, 'test/browser/compatibility.spec.mjs'), 'utf8');
  for (const viewport of ['320, height: 568', '390, height: 844', '834, height: 1112', '1440, height: 900', '2200, height: 1200']) {
    assert.match(suite, new RegExp(viewport));
  }
  for (const contract of ['JavaScript-disabled', 'reduced motion', 'contrast', 'axe', 'visual baseline']) {
    assert.match(suite, new RegExp(contract, 'i'));
  }
});

test('package QA fixes install isolation and every published size budget', () => {
  const source = readFileSync(join(repository, 'scripts/gate4/package-qa.mjs'), 'utf8');
  for (const setting of ['npm_config_cache', 'npm_config_ignore_scripts', 'npm_config_audit', 'npm_config_fund']) {
    assert.match(source, new RegExp(setting));
  }
  for (const threshold of ['8 * 1024', '2.5 * 1024', '40 * 1024', '7 * 1024', '68 * 1024', '12 * 1024', '25 * 1024', '6 * 1024', '600 * 1024', '700 * 1024', '20 * 1024', '60 * 1024']) {
    assert.match(source, new RegExp(threshold.replaceAll('*', '\\*')));
  }
});

test('exact package path allowlists reject missing and rogue generated files', () => {
  assert.deepEqual(validatePackageFileList('core', expectedPackagePaths.core, expectedPackagePaths.core), {
    expected: 24,
    actual: 24,
  });
  assert.equal(expectedPackagePaths.react.length, 6);
  for (const paths of [expectedPackagePaths.core, expectedPackagePaths.react]) {
    assert.ok(paths.includes('LICENSE'));
    assert.ok(paths.includes('NOTICE'));
    assert.ok(paths.includes('README.md'));
  }
  assert.throws(
    () => validatePackageFileList('core', [...expectedPackagePaths.core, 'dist/rogue-generated.js'], expectedPackagePaths.core),
    /extra: dist\/rogue-generated\.js/,
  );
  assert.throws(
    () => validatePackageFileList('React', expectedPackagePaths.react.filter((path) => path !== 'dist/index.d.ts'), expectedPackagePaths.react),
    /missing: dist\/index\.d\.ts/,
  );
});

test('compatibility documentation cannot turn unrun cells into passes', () => {
  const matrix = readFileSync(join(repository, 'docs/release/gate-4-matrix.md'), 'utf8');
  assert.match(matrix, /Node 20\.x \| not run locally/);
  assert.match(matrix, /Node 22\.12\.x \| not run locally/);
  assert.match(matrix, /Node 24\.17\.0 \| passed/);
  assert.match(matrix, /Playwright WebKit is not Safari/);
  assert.match(matrix, /0 errors, 0 warnings and 20 non-blocking hints/);
});

test('website canary remains pinned to an immutable commit and a temporary archive', () => {
  const source = readFileSync(join(repository, 'scripts/gate4/website-canary.mjs'), 'utf8');
  assert.match(source, /37bef99e6d32c55aea395fdcdbe0a2331c88e4ee/);
  assert.match(source, /git', \['archive'/);
  assert.match(source, /mkdtempSync/);
  assert.match(source, /LAMPLIGHT_DIST/);
});
