#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { approvedActions, validateWorkflow } from './workflow-policy.mjs';
import { assertCompleteGitHistory, gitHistoryEnvironment } from './git-history.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const findings = [];

assertCompleteGitHistory(root);

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function record(condition, message) {
  if (!condition) findings.push(message);
}

const workflowDirectory = join(root, '.github/workflows');
const workflows = readdirSync(workflowDirectory).filter((name) => /\.ya?ml$/.test(name)).sort();
record(JSON.stringify(workflows) === JSON.stringify(['ci.yml', 'codeql.yml', 'dependency-review.yml', 'pages.yml']), `workflow set is not exact: ${workflows.join(', ')}`);
for (const name of workflows) findings.push(...validateWorkflow(name, read(`.github/workflows/${name}`)));
const ciWorkflow = read('.github/workflows/ci.yml');
record(/matrix:\s*\n\s+node: \["22\.23\.4", "24"\]/.test(ciWorkflow), 'full source test matrix must remain Node 22.23.4 and 24');
record(/node20-smoke:[\s\S]*node-version: "20"[\s\S]*node20-consumer-smoke\.mjs/.test(ciWorkflow), 'Node 20 must remain a packed-consumer-only smoke');
record(!/node20-smoke:[\s\S]*?npm test/.test(ciWorkflow), 'Node 20 smoke must not run the Astro-dependent full source suite');

const provenance = read('docs/release/action-pin-provenance.md');
for (const [action, revision] of approvedActions) {
  record(provenance.includes(action) && provenance.includes(revision), `action provenance is missing ${action}@${revision}`);
}

const dependabot = read('.github/dependabot.yml');
record(/^version: 2$/m.test(dependabot), 'Dependabot schema version must be 2');
record(/package-ecosystem: npm/.test(dependabot), 'Dependabot npm updates are missing');
record(/package-ecosystem: github-actions/.test(dependabot), 'Dependabot GitHub Actions updates are missing');

const rootManifest = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
record(lock.lockfileVersion === 3, `package-lock.json must use lockfileVersion 3, found ${lock.lockfileVersion}`);
record(lock.packages?.['']?.name === rootManifest.name, 'lockfile root does not match package.json');
for (const [name, version] of Object.entries(rootManifest.devDependencies ?? {})) {
  record(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version), `root devDependency ${name} is not pinned exactly: ${version}`);
}

const allowedInstallScripts = new Map([
  ['node_modules/esbuild', '0.28.2'],
  ['node_modules/fsevents', '2.3.2'],
  ['node_modules/vite/node_modules/fsevents', '2.3.3'],
]);
for (const [path, metadata] of Object.entries(lock.packages ?? {})) {
  if (!path || path === 'packages/core' || path === 'packages/react' || metadata.link) continue;
  if (metadata.resolved) record(metadata.resolved.startsWith('https://registry.npmjs.org/'), `${path} resolves outside the npm registry`);
  if (metadata.resolved) record(/^sha512-/.test(metadata.integrity ?? ''), `${path} lacks sha512 integrity`);
  if (metadata.hasInstallScript) {
    record(allowedInstallScripts.get(path) === metadata.version, `${path}@${metadata.version} has an unreviewed install script`);
  }
}
for (const [path, version] of allowedInstallScripts) {
  record(lock.packages?.[path]?.hasInstallScript === true && lock.packages[path].version === version, `reviewed install-script dependency changed: ${path}@${version}`);
}

for (const path of ['package.json', 'packages/core/package.json', 'packages/react/package.json']) {
  const manifest = JSON.parse(read(path));
  record(!manifest.dependencies || Object.keys(manifest.dependencies).length === 0, `${path} has runtime dependencies`);
  record(!manifest.optionalDependencies || Object.keys(manifest.optionalDependencies).length === 0, `${path} has optional dependencies`);
  for (const lifecycle of ['preinstall', 'install', 'postinstall', 'prepare', 'prepack', 'postpack']) {
    record(!manifest.scripts?.[lifecycle], `${path} defines lifecycle script ${lifecycle}`);
  }
}

const runtimeSurfaces = [
  'packages/core/dist/living-light.js',
  'packages/react/dist/index.js',
];
const runtimeNetwork = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(|https?:\/\//;
for (const path of runtimeSurfaces) record(!runtimeNetwork.test(read(path)), `${path} contains a network-capable operation`);

const forbiddenNames = /(^|\/)(?:\.env(?:\..*)?|credentials(?:\..*)?|[^/]+\.(?:pem|key|p12))$/i;
const secretPatterns = [
  '-----BEGIN [A-Z ]*PRIVATE' + ' KEY-----',
  'g' + 'hp_[A-Za-z0-9]{20,}',
  'github_' + 'pat_[A-Za-z0-9_]{20,}',
  'A' + 'KIA[A-Z0-9]{16}',
  's' + 'k-[A-Za-z0-9_-]{20,}',
  'n' + 'pm_[A-Za-z0-9]{20,}',
  'xox[baprs]-[A-Za-z0-9-]{10,}',
].join('|');
const historyEnvironment = gitHistoryEnvironment();
const commits = execFileSync('git', ['rev-list', '--all'], {
  cwd: root, encoding: 'utf8', env: historyEnvironment,
}).trim().split(/\r?\n/).filter(Boolean);
for (const commit of commits) {
  const names = execFileSync('git', ['ls-tree', '-r', '--name-only', commit], {
    cwd: root, encoding: 'utf8', env: historyEnvironment,
  }).trim().split(/\r?\n/).filter(Boolean);
  for (const path of names) if (forbiddenNames.test(path)) findings.push(`${commit}: forbidden credential-like path ${path}`);
  const result = spawnSync('git', ['grep', '-I', '-l', '-E', '-e', secretPatterns, commit, '--'], {
    cwd: root, encoding: 'utf8', env: historyEnvironment,
  });
  if (result.status === 0) {
    for (const match of result.stdout.trim().split(/\r?\n/).filter(Boolean)) findings.push(`${commit}: secret-like content in ${match.split(':').slice(1).join(':')}`);
  } else if (result.status !== 1) {
    findings.push(`${commit}: Git history secret scan failed without exposing content`);
  }
}

const security = read('SECURITY.md');
for (const heading of ['Scope', 'System and trust boundaries', 'Security invariants', 'What to report', 'Reporting route', 'Exclusions', 'Current limitations']) {
  record(security.includes(`## ${heading}`), `SECURITY.md is missing ${heading}`);
}
record(security.includes('private vulnerability reporting'), 'SECURITY.md does not reserve the future private reporting route');
record(security.includes('Do not infer or invent a security email address or URL'), 'SECURITY.md invents or fails to forbid a pre-release endpoint');

if (findings.length) {
  console.error('Lamplight public-repository security check failed:');
  for (const finding of findings) console.error(` - ${finding}`);
  process.exit(1);
}

console.log(`Lamplight public-repository security check passed (${workflows.length} workflows, ${approvedActions.size} action pins and ${commits.length} commits checked).`);
