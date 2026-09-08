#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

function repositoryUrl(manifest) {
  const value = typeof manifest.repository === 'string'
    ? manifest.repository
    : manifest.repository?.url;
  return value?.replace(/^git\+/, '').replace(/\.git$/, '');
}

function isPublicGitHubUrl(value) {
  return /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value ?? '')
    && !/(?:example|placeholder|your[-_]?name)/i.test(value);
}

export function validateReleaseManifests({ rootManifest, packages }) {
  const errors = [];
  const canonicalRepository = repositoryUrl(rootManifest);
  const expectedPackagePaths = ['packages/core', 'packages/react'];
  const actualPackagePaths = packages.map(({ path }) => path).sort();
  if (actualPackagePaths.join('\n') !== expectedPackagePaths.join('\n')) {
    errors.push('release gate requires exactly the core and React workspaces');
  }
  const packageNames = packages.map(({ manifest }) => manifest.name).filter(Boolean);
  if (new Set(packageNames).size !== packageNames.length) {
    errors.push('publishable workspaces must use distinct package names');
  }
  if (rootManifest.private !== true) errors.push('root package must remain private');
  if (!isPublicGitHubUrl(canonicalRepository)) {
    errors.push('root package must declare the verified public GitHub repository URL');
  }

  for (const candidate of packages) {
    const { path, manifest, readme } = candidate;
    const label = `${path}/package.json`;
    if (Object.hasOwn(manifest, 'private')) errors.push(`${label} must remove the private field`);
    if (!/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/.test(manifest.name ?? '')
      || /internal|private|placeholder/.test(manifest.name ?? '')) {
      errors.push(`${label} must use a final public scoped package name`);
    }
    if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(manifest.version ?? '')) {
      errors.push(`${label} must use a stable semantic version`);
    }
    const candidateRepository = repositoryUrl(manifest);
    if (!isPublicGitHubUrl(candidateRepository) || candidateRepository !== canonicalRepository) {
      errors.push(`${label} must use the verified root repository URL`);
    }
    if (manifest.homepage !== `${canonicalRepository}#readme`) {
      errors.push(`${label} must declare the repository README as its homepage`);
    }
    if (manifest.bugs?.url !== `${canonicalRepository}/issues`) {
      errors.push(`${label} must declare the repository issue tracker`);
    }
    if (manifest.publishConfig?.access !== 'public') {
      errors.push(`${label} must set publishConfig.access to public`);
    }
    if (typeof readme !== 'string' || readme.trim().length < 200) {
      errors.push(`${path}/README.md must provide package-specific public usage guidance`);
    }
  }
  return errors;
}

function run() {
  const packagePaths = ['packages/core', 'packages/react'];
  const errors = validateReleaseManifests({
    rootManifest: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')),
    packages: packagePaths.map((path) => ({
      path,
      manifest: JSON.parse(readFileSync(join(root, path, 'package.json'), 'utf8')),
      readme: existsSync(join(root, path, 'README.md'))
        ? readFileSync(join(root, path, 'README.md'), 'utf8')
        : undefined,
    })),
  });
  if (errors.length) {
    console.error('Lamplight release manifest policy failed:');
    for (const error of errors) console.error(` - ${error}`);
    process.exit(1);
  }
  console.log('Lamplight release manifest policy passed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run();
