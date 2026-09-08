#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { assertCompleteGitHistory, gitHistoryEnvironment } from './gate5/git-history.mjs';

const binaryExtensions = new Set(['.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.webp']);
const provenanceFiles = new Set([
  'docs/ORIGIN.md',
  'docs/migration-internal-package.md',
  'docs/release/source-allowlist.md',
  'docs/release/reference-classification.md',
  'docs/release/gate-1-evidence.md',
  'docs/release/gate-5-evidence.md',
  'docs/release/action-pin-provenance.md',
  'docs/release/public-safe-identities.txt',
]);
const localQaAddressFiles = new Set([
  'playwright.config.mjs',
  'scripts/gate4/static-server.mjs',
  'scripts/gate4/website-canary.mjs',
  'test/browser/compatibility.spec.mjs',
]);

const productWords = ['Da' + 'ius', 'Gl' + 'im', 'Sker' + 'rick', 'Or' + 'rery',
  'd' + 'anliveshere', 'D' + 'an', 'Second' + ' Brain'];
const caseSensitiveProductWords = ['Re' + 'ach'];
const checks = [
  {
    name: 'private filesystem path',
    pattern: new RegExp('(?:/' + 'Users/|/' + 'home/|[A-Z]:\\\\Users\\\\)', 'i'),
  },
  {
    name: 'local service address',
    pattern: new RegExp('\\b(?:local' + 'host|127\\.0\\.0\\.1|0\\.0\\.0\\.0)(?::\\d+)?\\b', 'i'),
  },
  {
    name: 'private key material',
    pattern: new RegExp('-----BEGIN [A-Z ]*PRIVATE' + ' KEY-----'),
  },
  {
    name: 'likely secret assignment',
    pattern: new RegExp('(?:api[_-]?' + 'key|access[_-]?' + 'token|pass' + 'word|client[_-]?' + 'secret)\\s*[:=]\\s*["\\\'][^"\\\']+', 'i'),
  },
  {
    name: 'private email domain',
    pattern: new RegExp('@i' + 'cloud\\.com\\b', 'i'),
  },
  {
    name: 'credential token signature',
    pattern: new RegExp([
      'g' + 'hp_[A-Za-z0-9]{20,}',
      'github_' + 'pat_[A-Za-z0-9_]{20,}',
      'A' + 'KIA[A-Z0-9]{16}',
      's' + 'k-[A-Za-z0-9_-]{20,}',
      'n' + 'pm_[A-Za-z0-9]{20,}',
      'xox[baprs]-[A-Za-z0-9-]{10,}',
    ].join('|')),
  },
];

const allowedIdentityEmails = new Set(readFileSync(
  'docs/release/public-safe-identities.txt', 'utf8',
).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')));

const trackedOrCandidateFiles = execFileSync('git', [
  'ls-files', '--cached', '--others', '--exclude-standard', '-z',
], { encoding: 'utf8' }).split('\0').filter((file) => file && existsSync(file));

function filesWithin(root) {
  if (!existsSync(root)) return [];
  const found = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...filesWithin(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

const generatedPackageFiles = [
  ...filesWithin('packages/core/dist'),
  ...filesWithin('packages/react/dist'),
  ...filesWithin('packages/react/docs'),
];
const publicControlFiles = [
  'LICENSE',
  'NOTICE',
  'REUSE.toml',
  'SECURITY.md',
  ...filesWithin('LICENSES'),
  ...filesWithin('.github'),
  ...filesWithin('docs/release'),
];
const files = [...new Set([...trackedOrCandidateFiles, ...generatedPackageFiles, ...publicControlFiles])];

const findings = [];

assertCompleteGitHistory(process.cwd());

const configuredEmail = execFileSync('git', ['config', '--local', '--get', 'user.email'], {
  encoding: 'utf8',
}).trim();
if (!allowedIdentityEmails.has(configuredEmail)) {
  findings.push(`Git config: email is not on the public-safe identity allowlist`);
}
if (/@icloud\.com$/i.test(configuredEmail)) {
  findings.push(`Git config: private email domain is forbidden`);
}

const historyRecords = execFileSync('git', [
  'log', '--all', '--format=%H%x09%ae%x09%ce',
], { encoding: 'utf8', env: gitHistoryEnvironment() }).trim().split(/\r?\n/).filter(Boolean).map((line) => {
  const [commit, authorEmail, committerEmail] = line.split('\t');
  return { commit, authorEmail, committerEmail };
});
for (const { commit, authorEmail, committerEmail } of historyRecords) {
  for (const [role, email] of [['author', authorEmail], ['committer', committerEmail]]) {
    if (/@icloud\.com$/i.test(email)) {
      findings.push(`${commit}: ${role} uses a forbidden private email domain`);
    } else if (!allowedIdentityEmails.has(email)) {
      findings.push(`${commit}: ${role} email is not on the public-safe identity allowlist`);
    }
  }
}

for (const file of files) {
  if (binaryExtensions.has(extname(file).toLowerCase())) continue;
  const text = readFileSync(file, 'utf8');
  for (const check of checks) {
    if (check.name === 'local service address' && localQaAddressFiles.has(file)) continue;
    if (check.pattern.test(text)) findings.push(`${file}: ${check.name}`);
  }
  if (!provenanceFiles.has(file)) {
    for (const word of productWords) {
      if (new RegExp(`\\b${word.replace(' ', '\\s+')}\\b`, 'i').test(text)) {
        findings.push(`${file}: unclassified consumer reference ${word}`);
      }
    }
    for (const word of caseSensitiveProductWords) {
      if (new RegExp(`\\b${word}\\b`).test(text)) {
        findings.push(`${file}: unclassified consumer reference ${word}`);
      }
    }
  }
}

if (findings.length) {
  console.error('Lamplight privacy scan failed:');
  for (const finding of findings) console.error(` - ${finding}`);
  process.exit(1);
}

console.log(`Lamplight privacy scan passed (${files.length} source, generated and public-control files plus ${historyRecords.length} commits checked).`);
