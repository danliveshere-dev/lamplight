import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const repository = resolve(new URL('..', import.meta.url).pathname);
const safeEmail = 'fixture@example.invalid';
const gitEnv = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: safeEmail,
  GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: safeEmail,
};
const account = 'd' + 'anliveshere-dev';
const repositoryUrl = `https://github.com/${account}/lamplight`;
const siteUrl = `https://${account}.github.io/lamplight/`;
const forbidden = 'Dai' + 'us';

function runGit(cwd, ...args) {
  execFileSync('git', args, { cwd, env: gitEnv, stdio: 'pipe' });
}

function fixture(t) {
  const temp = mkdtempSync(join(tmpdir(), 'lamplight-privacy-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const origin = join(temp, 'origin');
  const clone = join(temp, 'clone');
  mkdirSync(join(origin, 'scripts/gate5'), { recursive: true });
  mkdirSync(join(origin, 'docs/release'), { recursive: true });
  copyFileSync(join(repository, 'scripts/privacy-scan.mjs'), join(origin, 'scripts/privacy-scan.mjs'));
  copyFileSync(join(repository, 'scripts/gate5/git-history.mjs'), join(origin, 'scripts/gate5/git-history.mjs'));
  writeFileSync(join(origin, 'docs/release/public-safe-identities.txt'), `${safeEmail}\n`);
  for (const file of ['LICENSE', 'NOTICE', 'REUSE.toml', 'SECURITY.md']) {
    writeFileSync(join(origin, file), 'Synthetic fixture\n');
  }
  runGit(origin, 'init', '-q');
  runGit(origin, 'add', '.');
  runGit(origin, 'commit', '-qm', 'Synthetic fixture');
  runGit(temp, 'clone', '-q', '--no-local', origin, clone);
  return clone;
}

function scan(cwd) {
  return spawnSync(process.execPath, ['scripts/privacy-scan.mjs'], {
    cwd, env: gitEnv, encoding: 'utf8',
  });
}

test('a clean clone needs no local email, but an unapproved configured identity fails', (t) => {
  const cwd = fixture(t);
  let result = scan(cwd);
  assert.equal(result.status, 0, result.stderr);
  runGit(cwd, 'config', '--local', 'user.email', 'unapproved@example.invalid');
  result = scan(cwd);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Git config: email is not on the public-safe identity allowlist/);
  assert.doesNotMatch(result.stderr, /unapproved@example\.invalid/);
  runGit(cwd, 'config', '--local', 'user.email', safeEmail);
  result = scan(cwd);
  assert.equal(result.status, 0, result.stderr);
});

test('only the project URLs are exempt, while other consumer references remain detectable', (t) => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'README.md'), `[Release](${repositoryUrl}/releases/tag/v1)\n[Site](${siteUrl})\n`);
  let result = scan(cwd);
  assert.equal(result.status, 0, result.stderr);
  for (const content of [
    `${repositoryUrl}/releases/${forbidden}`,
    `${repositoryUrl} ${forbidden}`,
    `https://${account}.example.invalid/lamplight/`,
    `${siteUrl}extra`,
    `${repositoryUrl}-other`,
  ]) {
    writeFileSync(join(cwd, 'README.md'), content);
    result = scan(cwd);
    assert.equal(result.status, 1, `Expected a finding for synthetic input`);
    assert.match(result.stderr, /README\.md: unclassified consumer reference/);
  }
});

test('an unapproved historical identity still fails without exposing it', (t) => {
  const cwd = fixture(t);
  writeFileSync(join(cwd, 'extra.txt'), 'Synthetic history\n');
  runGit(cwd, 'add', 'extra.txt');
  execFileSync('git', ['commit', '-qm', 'Another synthetic commit'], {
    cwd, stdio: 'pipe', env: { ...gitEnv, GIT_AUTHOR_EMAIL: 'unapproved@example.invalid' },
  });
  const result = scan(cwd);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /author email is not on the public-safe identity allowlist/);
  assert.doesNotMatch(result.stderr, /unapproved@example\.invalid/);
});
