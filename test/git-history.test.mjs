import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { assertCompleteGitHistory } from '../scripts/gate5/git-history.mjs';

function makeRepository(root) {
  const repository = join(root, 'source');
  execFileSync('git', ['init', '--quiet', repository]);
  execFileSync('git', ['config', 'user.name', 'Lamplight Test'], { cwd: repository });
  execFileSync('git', ['config', 'user.email', 'test@users.noreply.github.com'], { cwd: repository });
  writeFileSync(join(repository, 'fixture.txt'), 'one\n');
  execFileSync('git', ['add', 'fixture.txt'], { cwd: repository });
  execFileSync('git', ['commit', '--quiet', '-m', 'first'], { cwd: repository });
  writeFileSync(join(repository, 'fixture.txt'), 'two\n');
  execFileSync('git', ['commit', '--quiet', '-am', 'second'], { cwd: repository });
  return repository;
}

test('complete-history guard accepts a full repository', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'lamplight-history-'));
  try {
    assert.doesNotThrow(() => assertCompleteGitHistory(makeRepository(temporary)));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('complete-history guard rejects a real shallow clone', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'lamplight-history-'));
  const shallow = join(temporary, 'shallow');
  try {
    const repository = makeRepository(temporary);
    execFileSync('git', ['clone', '--quiet', '--depth', '1', `file://${repository}`, shallow]);
    assert.throws(() => assertCompleteGitHistory(shallow), /non-shallow clone/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('complete-history guard rejects a partial object inventory without lazy fetching', () => {
  const outputs = ['false', '', '/tmp/nonexistent-grafts', 'abc123\n?missing-object'];
  const execute = () => outputs.shift();
  assert.throws(() => assertCompleteGitHistory('/tmp/full-repository', { execute }), /every object reachable/);
});

test('complete-history guard rejects replacement refs', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'lamplight-history-'));
  try {
    const repository = makeRepository(temporary);
    const commits = execFileSync('git', ['rev-list', '--max-count=2', 'HEAD'], {
      cwd: repository, encoding: 'utf8',
    }).trim().split('\n');
    execFileSync('git', ['replace', commits[0], commits[1]], { cwd: repository });
    assert.throws(() => assertCompleteGitHistory(repository), /replacement refs/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('complete-history guard resolves and rejects repository-relative legacy grafts', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'lamplight-history-'));
  try {
    const repository = makeRepository(temporary);
    const grafts = resolve(repository, execFileSync('git', ['rev-parse', '--git-path', 'info/grafts'], {
      cwd: repository, encoding: 'utf8',
    }).trim());
    writeFileSync(grafts, 'legacy-graft\n');
    assert.throws(() => assertCompleteGitHistory(repository), /legacy grafts/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
