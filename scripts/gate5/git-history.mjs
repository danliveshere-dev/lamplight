import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export function gitHistoryEnvironment() {
  return { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_NO_REPLACE_OBJECTS: '1' };
}

export function assertCompleteGitHistory(root, { execute = execFileSync } = {}) {
  const run = (args, options = {}) => execute('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: gitHistoryEnvironment(),
    ...options,
  }).trim();

  const shallow = run(['rev-parse', '--is-shallow-repository']);
  if (shallow !== 'false') {
    throw new Error('Git history scan requires a non-shallow clone; fetch complete history before running Gate 5');
  }

  const replacements = run(['for-each-ref', '--format=%(refname)', 'refs/replace']);
  if (replacements) {
    throw new Error('Git history scan refuses replacement refs; remove refs/replace entries before running Gate 5');
  }

  const grafts = resolve(root, run(['rev-parse', '--git-path', 'info/grafts']));
  if (existsSync(grafts) && statSync(grafts).size > 0) {
    throw new Error('Git history scan refuses legacy grafts; remove the grafts file before running Gate 5');
  }

  const objects = run(['rev-list', '--objects', '--all', '--missing=print']);
  const missing = objects.split(/\r?\n/).find((line) => line.startsWith('?'));
  if (missing) {
    throw new Error('Git history scan requires every object reachable from local refs; materialise partial-clone objects before running Gate 5');
  }
}
