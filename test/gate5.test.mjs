import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { load as parseYaml } from 'js-yaml';
import { approvedActions, validateWorkflow } from '../scripts/gate5/workflow-policy.mjs';

const repository = resolve(new URL('..', import.meta.url).pathname);

function fixture({ trigger = 'pull_request', permissions = '  contents: read', revision = approvedActions.get('actions/checkout'), checkoutWith = '        with:\n          fetch-depth: 0\n          persist-credentials: false\n', extra = '' } = {}) {
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
${checkoutWith}
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

test('workflow policy rejects persisted credentials and incomplete Gate 5 history', () => {
  const missingCredentialControl = fixture({ checkoutWith: '        with:\n          fetch-depth: 0\n' });
  assert.ok(validateWorkflow('ci.yml', missingCredentialControl)
    .some((error) => error.includes('persist-credentials: false')));

  const persistedCredential = fixture({ checkoutWith: '        with:\n          fetch-depth: 0\n          persist-credentials: true\n' });
  assert.ok(validateWorkflow('ci.yml', persistedCredential)
    .some((error) => error.includes('persist-credentials: false')));

  const scalarSpoof = fixture({ checkoutWith: '        with:\n          fetch-depth: 0\n          persist-credentials: true\n          sparse-checkout: |\n            persist-credentials: false\n' });
  assert.ok(validateWorkflow('ci.yml', scalarSpoof)
    .some((error) => error.includes('persist-credentials: false')));

  const duplicateInput = fixture({ checkoutWith: '        with:\n          fetch-depth: 0\n          persist-credentials: true\n          persist-credentials: false\n' });
  assert.ok(validateWorkflow('ci.yml', duplicateInput)
    .some((error) => error.includes('invalid or ambiguous')));

  const shallowGate = fixture({
    checkoutWith: '        with:\n          persist-credentials: false\n',
    extra: '      - run: npm run gate5:check\n',
  });
  assert.ok(validateWorkflow('ci.yml', shallowGate)
    .some((error) => error.includes('fetch-depth: 0')));

  const nonHistoryJob = fixture({ checkoutWith: '        with:\n          persist-credentials: false\n' });
  assert.deepEqual(validateWorkflow('ci.yml', nonHistoryJob), []);
});

test('checked-in workflows satisfy the exact action and permission policy', () => {
  for (const name of ['ci.yml', 'codeql.yml', 'dependency-review.yml', 'pages.yml']) {
    const source = readFileSync(join(repository, '.github/workflows', name), 'utf8');
    assert.deepEqual(validateWorkflow(name, source), []);
  }
});

test('all checked-in checkouts disable credential persistence', () => {
  const sources = ['ci.yml', 'codeql.yml'].map((name) => readFileSync(
    join(repository, '.github/workflows', name), 'utf8',
  ));
  const checkouts = sources.flatMap((source) => Object.values(parseYaml(source).jobs)
    .flatMap((job) => job.steps ?? []).filter((step) => step.uses?.startsWith('actions/checkout@')));
  assert.equal(checkouts.length, 5);
  assert.equal(checkouts.every((step) => step.with?.['persist-credentials'] === false), true);
});

test('Node 20 is limited to the packed-consumer contract', () => {
  const ci = readFileSync(join(repository, '.github/workflows/ci.yml'), 'utf8');
  assert.match(ci, /matrix:\s*\n\s+node: \["22\.23\.4", "24"\]/);
  assert.match(ci, /node20-smoke:[\s\S]*node-version: "20"[\s\S]*node20-consumer-smoke\.mjs/);
  assert.doesNotMatch(ci.match(/node20-smoke:[\s\S]*?(?=\n  \S|$)/)?.[0] ?? '', /npm test/);
  const smoke = readFileSync(join(repository, 'scripts/gate5/node20-consumer-smoke.mjs'), 'utf8');
  assert.match(smoke, /process\.versions\.node[\s\S]*!== 20/);
});

test('licence boundary remains explicit in machine-readable and human-readable files', () => {
  const reuse = readFileSync(join(repository, 'REUSE.toml'), 'utf8');
  const notice = readFileSync(join(repository, 'NOTICE'), 'utf8');
  assert.ok(reuse.lastIndexOf('SPDX-License-Identifier = "OFL-1.1"') > reuse.indexOf('SPDX-License-Identifier = "Apache-2.0"'));
  assert.doesNotMatch(reuse, /fonts\/\*\*/);
  assert.match(reuse, /fonts\/\*\.woff2/);
  assert.match(notice, /IBM Plex[\s\S]*not licensed under Apache-2\.0/);
  for (const packageDirectory of ['core', 'react']) {
    assert.equal(readFileSync(join(repository, 'packages', packageDirectory, 'LICENSE'), 'utf8'), readFileSync(join(repository, 'LICENSE'), 'utf8'));
    assert.equal(readFileSync(join(repository, 'packages', packageDirectory, 'NOTICE'), 'utf8'), notice);
  }
});

test('Pages policy rejects weakened deployment gates, permissions and dependencies', () => {
  const source = readFileSync(join(repository, '.github/workflows/pages.yml'), 'utf8');
  const changes = [
    ["github.event_name == 'workflow_dispatch' && ", ''],
    ['inputs.publish == true && ', ''],
    ["github.ref == 'refs/heads/main' && ", ''],
    [' && github.event.repository.private == false', ''],
    ['needs: build', 'needs: other'],
    ['      pages: write', '      pages: write\n      contents: write'],
    ['  contents: read', '  contents: write'],
    ['  pull_request:', '  pull_request_target:'],
    ['default: false', 'default: true'],
    ['node scripts/beta/stage-site.mjs', 'echo unstaged'],
    ['fetch-depth: 0', 'fetch-depth: 1'],
    ['    runs-on: ubuntu-latest\n    steps:', '    runs-on: ubuntu-latest\n    permissions:\n      pages: write\n    steps:'],
  ];
  for (const [before, after] of changes) {
    assert.ok(source.includes(before), `Missing mutation anchor: ${before}`);
    assert.notDeepEqual(validateWorkflow('pages.yml', source.replace(before, after)), [], `Mutation accepted: ${before}`);
  }
});

test('other workflows cannot acquire job write overrides or deploy Pages', () => {
  const permissions = fixture({ extra: '    permissions:\n      pages: write\n' });
  assert.ok(validateWorkflow('ci.yml', permissions).some((error) => error.includes('job-level permission')));
  const deploy = fixture({ extra: `      - uses: actions/deploy-pages@${approvedActions.get('actions/deploy-pages')}\n` });
  assert.ok(validateWorkflow('ci.yml', deploy).some((error) => error.includes('confined to pages.yml')));
});

test('private-repository security scans remain explicitly deferred', () => {
  for (const [name, job] of [['codeql.yml', 'analyse'], ['dependency-review.yml', 'review']]) {
    const source = readFileSync(join(repository, '.github/workflows', name), 'utf8');
    assert.equal(parseYaml(source).jobs[job].if, 'github.event.repository.private == false');
    assert.ok(validateWorkflow(name, source.replace('    if: github.event.repository.private == false\n', ''))
      .some((error) => error.includes('explicitly deferred')));
  }
});


test('event expressions are checked in shell scripts, not structured action inputs', () => {
  const expression = '$' + '{{ github.event.pull_request.title }}';
  const unsafe = fixture({ extra: `      - run: |\n          echo ${expression}\n` });
  assert.ok(validateWorkflow('ci.yml', unsafe).some(error => error.includes('untrusted event expression')));
  const safe = fixture({ checkoutWith: `        with:\n          ref: ${'$' + '{{ github.event.pull_request.head.sha || github.sha }}'}\n          persist-credentials: false\n`, extra: `      - run: echo safe\n` });
  assert.deepEqual(validateWorkflow('ci.yml', safe), []);
});
