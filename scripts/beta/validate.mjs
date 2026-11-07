#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateBeta({ rootManifest, packages }) {
  const errors = [];
  const paths = ['packages/core', 'packages/react'];
  if (rootManifest.private !== true) errors.push('root must be private');
  if (JSON.stringify(rootManifest.workspaces) !== JSON.stringify(paths)) errors.push('exactly two expected workspaces required');
  if (JSON.stringify(packages.map(p => p.path).sort()) !== JSON.stringify(paths)) errors.push('exactly two expected packages required');
  const version = rootManifest.version;
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)-beta\.(?:0|[1-9]\d*)$/.test(version ?? '')) errors.push('root version must be a beta.N prerelease');
  for (const {path, manifest: m, readme} of packages) {
    const expectedName = path === paths[0] ? '@lamplight/core' : '@lamplight/react';
    if (m.name !== expectedName) errors.push(`${path}: unexpected package name`);
    if (m.private !== true) errors.push(`${path}: must remain private`);
    if (m.version !== version) errors.push(`${path}: version mismatch`);
    if (m.license !== 'Apache-2.0') errors.push(`${path}: licence mismatch`);
    if (!readme?.trim() || !readme.includes('registry')) errors.push(`${path}: beta README missing or incomplete`);
    if (m.publishConfig) errors.push(`${path}: publish configuration is forbidden in beta`);
    for (const field of ['dependencies', 'optionalDependencies', 'bundledDependencies', 'bundleDependencies']) if (m[field] && Object.keys(m[field]).length) errors.push(`${path}: ${field} forbidden`);
    for (const lifecycle of ['preinstall','install','postinstall','prepare','prepack','postpack']) if (m.scripts?.[lifecycle]) errors.push(`${path}: ${lifecycle} forbidden`);
    const peers = m.peerDependencies ?? {};
    if (JSON.stringify(peers) !== JSON.stringify(path === paths[1] ? {react: '>=18'} : {})) errors.push(`${path}: unexpected peer dependencies`);
  }
  return errors;
}

export function readBeta(root) {
  const read = p => readFileSync(resolve(root, p), 'utf8');
  return { rootManifest: JSON.parse(read('package.json')), packages: ['packages/core','packages/react'].map(path => ({path, manifest: JSON.parse(read(`${path}/package.json`)), readme: read(`${path}/README.md`)})) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateBeta(readBeta(resolve(fileURLToPath(new URL('../..', import.meta.url)))));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Private package manifests for the beta validated.');
}
