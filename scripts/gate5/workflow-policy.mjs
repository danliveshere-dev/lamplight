export const approvedActions = new Map([
  ['actions/checkout', 'd23441a48e516b6c34aea4fa41551a30e30af803'],
  ['actions/setup-node', '249970729cb0ef3589644e2896645e5dc5ba9c38'],
  ['github/codeql-action', 'fddeee1a7ece751b577e409a89057319e3172939'],
  ['actions/dependency-review-action', 'cdf488f595d80d6e07e03d4674febd5ab45fa938'],
]);

const allowedPermissions = {
  'ci.yml': new Map([['contents', 'read']]),
  'codeql.yml': new Map([['contents', 'read'], ['security-events', 'write']]),
  'dependency-review.yml': new Map([['contents', 'read']]),
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
  for (const trigger of ['pull_request_target', 'workflow_run', 'repository_dispatch', 'issue_comment']) {
    if (new RegExp(`^\\s*${trigger}:`, 'm').test(source)) errors.push(`${name}: risky trigger ${trigger}`);
  }
  if (/\b(?:read-all|write-all)\b/.test(source)) errors.push(`${name}: broad permission shorthand`);
  if (/\$\{\{\s*secrets\./.test(source)) errors.push(`${name}: workflow references a secret`);
  if (/\$\{\{\s*github\.event\.[^}]+\}\}/.test(source) && /^\s*run:.*\$\{\{/m.test(source)) {
    errors.push(`${name}: untrusted event expression interpolated into a shell command`);
  }
  const prohibitedReleaseTerms = [
    /\bnpm\s+publish\b/i,
    /\bgh\s+release\b/i,
    /\bcreate-release\b/i,
    /\bid-token:\s*write\b/i,
    new RegExp('N' + 'ODE_AUTH_TOKEN'),
  ];
  if (prohibitedReleaseTerms.some((pattern) => pattern.test(source))) errors.push(`${name}: release or publish capability is prohibited before Gate 7`);

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
  }

  return errors;
}
