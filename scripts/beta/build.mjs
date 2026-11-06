#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectedPackagePaths, validatePackageFileList } from '../gate4/package-policy.mjs';
import { readBeta, validateBeta } from './validate.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, {cwd: root, encoding: 'utf8', ...opts});
const fail = message => { throw new Error(message); };
const inputs = readBeta(root);
const errors = validateBeta(inputs);
if (errors.length) fail(errors.join('\n'));
const version = inputs.rootManifest.version;
const head = run('git', ['rev-parse', 'HEAD']).trim();
const status = run('git', ['status', '--porcelain=v1', '--untracked-files=all']);
if (status.trim()) fail('Beta archives require a clean committed checkout; commit the reviewed source first.');
const work = mkdtempSync(join(tmpdir(), 'lamplight-beta-'));
const out = join(root, '.beta');
const env = {...process.env, npm_config_cache: join(work, 'cache'), npm_config_ignore_scripts: 'true', npm_config_audit: 'false', npm_config_fund: 'false'};
try {
  run('npm', ['run', 'build'], {env, stdio: 'inherit'});
  run('node', ['examples/showcase/build.mjs'], {env, stdio: 'inherit'});
  run('npm', ['run', 'privacy'], {env, stdio: 'inherit'});
  const showcase = join(root, 'examples/showcase/dist');
  if (!existsSync(join(showcase, 'index.html'))) fail('standalone showcase is missing');
  if (JSON.stringify(readdirSync(showcase).sort()) !== JSON.stringify(['ai-starters.md', 'chapters.html', 'components.html', 'core', 'examples.html', 'index.html', 'principles.html', 'showcase.css', 'showcase.js'])) fail('showcase contains unexpected files');
  const staged = join(work, 'out'); mkdirSync(staged);
  const filenames = [];
  for (const name of ['core', 'react']) {
    const parsed = JSON.parse(run('npm', ['pack', '--json', '--workspace', `@lamplight/${name}`, '--pack-destination', staged], {env}));
    const result = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
    validatePackageFileList(name, result.files.map(f => f.path), expectedPackagePaths[name]);
    const filename = `lamplight-${name}-${version}.tgz`;
    if (result.filename !== filename) fail(`unexpected ${name} archive name`);
    run('python3', ['scripts/beta/archive.py', 'inspect', join(staged, filename), JSON.stringify(expectedPackagePaths[name])]);
    filenames.push(filename);
  }
  const browser = join(work, 'browser');
  cpSync(showcase, browser, {recursive: true, dereference: false});
  const expectedCore = expectedPackagePaths.core.filter(p => p.startsWith('dist/')).map(p => p.slice(5));
  const walk = dir => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(join(dir,e.name)) : [relative(join(browser,'core'),join(dir,e.name))]);
  validatePackageFileList('browser core', walk(join(browser,'core')), expectedCore);
  for (const path of expectedCore) {
    if (!readFileSync(join(browser,'core',path)).equals(readFileSync(join(root,'packages/core/dist',path)))) fail(`browser core differs: ${path}`);
  }
  for (const file of ['LICENSE','NOTICE']) copyFileSync(join(root,file),join(browser,file));
  copyFileSync(join(root, 'docs/principles.md'), join(browser, 'principles.md'));
  writeFileSync(join(browser,'README.md'), `# Lamplight browser beta ${version}\n\nServe this directory with a static web server and open index.html for the Field notes landing and examples.html for the Reading, Report and Dashboard compositions and print view. Open chapters.html for the chapter rail and narrative example. Open components.html for the component reference and principles.html for the principles guide; principles.md contains the full source principles and ai-starters.md provides guidance for AI-assisted work with the beta files. To use the styles in another page, copy the core directory intact and link core/lamplight.css. The four CSS layers and token JSON remain available separately; fonts and living-light.js are opt-in. See LICENSE, NOTICE and core/fonts/OFL.txt.\n`);
  const zip = `lamplight-browser-${version}.zip`;
  run('python3', ['scripts/beta/archive.py', 'zip', browser, join(staged, zip)]);
  filenames.push(zip);
  const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
  const finalHead = run('git', ['rev-parse', 'HEAD']).trim();
  const finalStatus = run('git', ['status', '--porcelain=v1', '--untracked-files=all']);
  if (head !== finalHead || status !== finalStatus) fail('source state changed during beta build; retry');
  const manifest = {version, source: {head, dirty: Boolean(status)}, packagesPrivate: true, registryPublication: false, files: Object.fromEntries(filenames.map(name => [name, sha(join(staged,name))]))};
  writeFileSync(join(staged,'manifest.json'), `${JSON.stringify(manifest,null,2)}\n`);
  writeFileSync(join(staged,'SHA256SUMS'), [...filenames, 'manifest.json'].sort().map(name => `${sha(join(staged,name))}  ${name}\n`).join(''));
  mkdirSync(out, {recursive:true});
  for (const name of [...filenames,'manifest.json','SHA256SUMS']) copyFileSync(join(staged,name), join(out,name));
  console.log(`Local beta built in .beta/ from ${head} (${status ? 'dirty' : 'clean'}).`);
} finally { rmSync(work, {recursive:true,force:true}); }
