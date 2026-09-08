import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { approvedActions, validateWorkflow } from '../scripts/gate5/workflow-policy.mjs';

const repository = resolve(new URL('..', import.meta.url).pathname);

function fixture({ trigger = 'pull_request', permissions = '  contents: read', revision = approvedActions.get('actions/checkout'), extra = '' } = {}) {
  return `name: Fixture
on:
  ${trigger}:
permissions:
${permissions}
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${revision}
${extra}`;
}

test('workflow policy rejects mutable action references', () => {
  assert.ok(validateWorkflow('ci.yml', fixture({ revision: 'v6' })).some((error) => error.includes('full lowercase commit SHA')));
});

test('workflow policy rejects overbroad permissions and risky triggers', () => {
  assert.ok(validateWorkflow('ci.yml', fixture({ permissions: '  contents: write' })).some((error) => error.includes('permission contents: write')));
  assert.ok(validateWorkflow('ci.yml', fixture({ trigger: 'pull_request_target' })).some((error) => error.includes('risky trigger pull_request_target')));
});

test('workflow policy rejects secret and release capabilities', () => {
  const secretExpression = '$' + '{{ secrets.RELEASE_CREDENTIAL }}';
  const source = fixture({ extra: `      - run: npm publish
        env:
          RELEASE_CREDENTIAL: ${secretExpression}
` });
  const errors = validateWorkflow('ci.yml', source);
  assert.ok(errors.some((error) => error.includes('references a secret')));
  assert.ok(errors.some((error) => error.includes('release or publish capability')));
});

test('checked-in workflows satisfy the exact action and permission policy', () => {
  for (const name of ['ci.yml', 'codeql.yml', 'dependency-review.yml']) {
    const source = readFileSync(join(repository, '.github/workflows', name), 'utf8');
    assert.deepEqual(validateWorkflow(name, source), []);
  }
});

test('Node 20 is limited to the packed-consumer contract', () => {
  const ci = readFileSync(join(repository, '.github/workflows/ci.yml'), 'utf8');
  assert.match(ci, /matrix:\s*\n\s+node: \["22\.12", "24"\]/);
  assert.match(ci, /node20-smoke:[\s\S]*node-version: "20"[\s\S]*node20-consumer-smoke\.mjs/);
  assert.doesNotMatch(ci.match(/node20-smoke:[\s\S]*?(?=\n  \S|$)/)?.[0] ?? '', /npm test/);
});

test('licence boundary remains explicit in machine-readable and human-readable files', () => {
  const reuse = readFileSync(join(repository, 'REUSE.toml'), 'utf8');
  const notice = readFileSync(join(repository, 'NOTICE'), 'utf8');
  assert.ok(reuse.lastIndexOf('SPDX-License-Identifier = "OFL-1.1"') > reuse.indexOf('SPDX-License-Identifier = "Apache-2.0"'));
  assert.doesNotMatch(reuse, /fonts\/\*\*/);
  assert.match(reuse, /fonts\/\*\.woff2/);
  assert.match(notice, /IBM Plex[\s\S]*not licensed under Apache-2\.0/);
});
