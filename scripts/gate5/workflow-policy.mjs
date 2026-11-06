import { load as parseYaml } from 'js-yaml';
import { isDeepStrictEqual } from 'node:util';

export const approvedActions = new Map([
  ['actions/checkout', 'd23441a48e516b6c34aea4fa41551a30e30af803'],
  ['actions/setup-node', '249970729cb0ef3589644e2896645e5dc5ba9c38'],
  ['github/codeql-action', 'fddeee1a7ece751b577e409a89057319e3172939'],
  ['actions/dependency-review-action', 'cdf488f595d80d6e07e03d4674febd5ab45fa938'],
  ['actions/configure-pages', '983d7736d9b0ae728b81ab479565c72886d7745b'],
  ['actions/upload-pages-artifact', '7b1f4a764d45c48632c6b24a0339c27f5614fb0b'],
  ['actions/deploy-pages', 'd6db90164ac5ed86f2b6aed7e0febac5b3c0c03e'],
  ['actions/upload-artifact', 'ea165f8d65b6e75b540449e92b4886f43607fa02'],
]);

const allowedPermissions = {
  'ci.yml': new Map([['contents', 'read']]),
  'codeql.yml': new Map([['contents', 'read'], ['security-events', 'write']]),
  'dependency-review.yml': new Map([['contents', 'read']]),
  'pages.yml': new Map([['contents', 'read']]),
};

// Pages is an intentionally closed contract: its only write-capable job can
// consume the validated build artifact under all four explicit conditions.
const pagesContract = {
  name: 'Pages candidate',
  on: {
    push: { branches: ['main'] }, pull_request: null,
    workflow_dispatch: { inputs: { publish: {
      description: 'Publish the staged candidate to GitHub Pages', type: 'boolean', required: true, default: false,
    } } },
  },
  permissions: { contents: 'read' },
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: `actions/checkout@${approvedActions.get('actions/checkout')}`, with: { ref: '${{ github.event.pull_request.head.sha || github.sha }}', 'fetch-depth': 0, 'persist-credentials': false } },
        { uses: `actions/setup-node@${approvedActions.get('actions/setup-node')}`, with: { 'node-version': '24', cache: 'npm' } },
        { run: 'npm ci --ignore-scripts --no-audit --no-fund' },
        { run: 'npm run beta:build' },
        { run: 'node scripts/beta/stage-site.mjs' },
        { uses: `actions/upload-pages-artifact@${approvedActions.get('actions/upload-pages-artifact')}`, with: { path: 'examples/showcase/dist' } },
      ],
    },
    deploy: {
      if: "github.event_name == 'workflow_dispatch' && inputs.publish == true && github.ref == 'refs/heads/main' && github.event.repository.private == false",
      needs: 'build', 'runs-on': 'ubuntu-latest', permissions: { pages: 'write', 'id-token': 'write' },
      environment: { name: 'github-pages' },
      steps: [{ uses: `actions/deploy-pages@${approvedActions.get('actions/deploy-pages')}` }],
    },
  },
};

function actionFamily(reference) {
  return [...approvedActions.keys()].find((name) => reference === name || reference.startsWith(`${name}/`));
}

function topLevelPermissions(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => /^permissions:\s*$/.test(line));
  if (start === -1) return null;
  const values = new Map();
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\S/.test(line) && line.trim()) break;
    const match = line.match(/^\s{2}([a-z-]+):\s*(read|write|none)\s*$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

export function validateWorkflow(name, source) {
  const errors = [];
  let workflow;
  try {
    workflow = parseYaml(source);
  } catch (error) {
    errors.push(`${name}: workflow YAML is invalid or ambiguous: ${error.message}`);
  }
  for (const trigger of ['pull_request_target', 'workflow_run', 'repository_dispatch', 'issue_comment']) {
    if (new RegExp(`^\\s*${trigger}:`, 'm').test(source)) errors.push(`${name}: risky trigger ${trigger}`);
  }
  if (/\b(?:read-all|write-all)\b/.test(source)) errors.push(`${name}: broad permission shorthand`);
  if (/\$\{\{\s*secrets\./.test(source)) errors.push(`${name}: workflow references a secret`);
  const prohibitedReleaseTerms = [
    /\bnpm\s+publish\b/i,
    /\bgh\s+release\b/i,
    /\bcreate-release\b/i,
    new RegExp('N' + 'ODE_AUTH_TOKEN'),
  ];
  if (prohibitedReleaseTerms.some((pattern) => pattern.test(source))) errors.push(`${name}: release or publish capability is prohibited before Gate 7`);
  if (name === 'pages.yml') {
    if (!isDeepStrictEqual(workflow, pagesContract)) errors.push(`${name}: Pages contract differs from the reviewed triggers, build or gated deploy`);
  } else if (/\bid-token:\s*write\b/i.test(source)) {
    errors.push(`${name}: id-token write permission is prohibited`);
  }
  for (const [file, job] of [['codeql.yml', 'analyse'], ['dependency-review.yml', 'review']]) {
    if (name === file && workflow?.jobs?.[job]?.if !== 'github.event.repository.private == false') {
      errors.push(`${name}: the unavailable private-repository check must be explicitly deferred`);
    }
  }

  const expected = allowedPermissions[name];
  const actual = topLevelPermissions(source);
  if (!expected) errors.push(`${name}: workflow is not registered in the least-permission policy`);
  if (!actual) errors.push(`${name}: missing top-level permissions block`);
  if (expected && actual) {
    for (const [key, value] of actual) {
      if (expected.get(key) !== value) errors.push(`${name}: permission ${key}: ${value} is not allowed`);
    }
    for (const [key, value] of expected) {
      if (actual.get(key) !== value) errors.push(`${name}: required permission ${key}: ${value} is missing`);
    }
  }
  if (expected && workflow?.permissions && !isDeepStrictEqual(workflow.permissions, Object.fromEntries(expected))) {
    errors.push(`${name}: parsed top-level permissions differ from the least-permission policy`);
  }

  const useLines = source.split(/\r?\n/).filter((line) => /^\s*(?:-\s*)?uses:/.test(line));
  for (const line of useLines) {
    const value = line.replace(/^\s*(?:-\s*)?uses:\s*/, '').replace(/\s+#.*$/, '').trim();
    const separator = value.lastIndexOf('@');
    if (separator <= 0 || separator === value.length - 1) {
      errors.push(`${name}: an action reference could not be parsed`);
      continue;
    }
    const reference = value.slice(0, separator);
    const revision = value.slice(separator + 1);
    if (reference.startsWith('./')) continue;
    if (!/^[a-f0-9]{40}$/.test(revision)) {
      errors.push(`${name}: ${reference} is not pinned to a full lowercase commit SHA`);
      continue;
    }
    const family = actionFamily(reference);
    if (!family) errors.push(`${name}: ${reference} is not on the reviewed action allowlist`);
    else if (approvedActions.get(family) !== revision) errors.push(`${name}: ${reference} does not use its reviewed commit`);
    if (family === 'actions/deploy-pages' && name !== 'pages.yml') errors.push(`${name}: Pages deployment is confined to pages.yml`);
  }

  for (const job of Object.values(workflow?.jobs ?? {})) {
    if (name !== 'pages.yml' && job?.permissions !== undefined) errors.push(`${name}: job-level permission overrides are prohibited`);
    const steps = Array.isArray(job?.steps) ? job.steps : [];
    const runsGate5 = steps.some((step) => step?.run === 'npm run gate5:check');
    for (const step of steps) {
      if (typeof step?.run === 'string' && /\$\{\{\s*github\.event\.[^}]+\}\}/.test(step.run)) {
        errors.push(`${name}: untrusted event expression interpolated into a shell command`);
      }
      if (typeof step?.uses !== 'string' || !step.uses.startsWith('actions/checkout@')) continue;
      if (step.with?.['persist-credentials'] !== false) {
        errors.push(`${name}: checkout must set persist-credentials: false`);
      }
      if (runsGate5 && step.with?.['fetch-depth'] !== 0) {
        errors.push(`${name}: checkout for Gate 5 must set fetch-depth: 0`);
      }
    }
  }

  return errors;
}
