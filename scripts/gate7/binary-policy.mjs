#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync, constants, fstatSync, lstatSync, openSync, readFileSync,
} from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCompleteGitHistory, gitHistoryEnvironment } from '../gate5/git-history.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const riskyBinaryExtensions = new Set([
  '.7z', '.avif', '.bin', '.dmg', '.docx', '.gif', '.gz', '.ico', '.icns', '.jpeg', '.jpg',
  '.mov', '.mp3', '.mp4', '.otf', '.pdf', '.png', '.pptx', '.tar', '.tgz', '.ttf', '.wasm',
  '.webm', '.webp', '.woff', '.woff2', '.xlsx', '.zip',
]);
const knownMagic = [
  Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('774f4632', 'hex'),
  Buffer.from('774f4646', 'hex'), Buffer.from('25504446', 'hex'),
  Buffer.from('504b0304', 'hex'), Buffer.from('504b0506', 'hex'),
  Buffer.from('47494638', 'hex'), Buffer.from('7f454c46', 'hex'),
  Buffer.from('0061736d', 'hex'), Buffer.from('ffd8ff', 'hex'),
  Buffer.from('52494646', 'hex'), Buffer.from('424d', 'hex'),
  Buffer.from('49492a00', 'hex'), Buffer.from('4d4d002a', 'hex'),
  Buffer.from('1f8b08', 'hex'), Buffer.from('425a68', 'hex'),
  Buffer.from('fd377a585a00', 'hex'), Buffer.from('28b52ffd', 'hex'),
  Buffer.from('377abcaf271c', 'hex'), Buffer.from('526172211a07', 'hex'),
  Buffer.from('d0cf11e0a1b11ae1', 'hex'), Buffer.from('53514c69746520666f726d6174203300', 'hex'),
  Buffer.from('feedface', 'hex'), Buffer.from('feedfacf', 'hex'),
  Buffer.from('cefaedfe', 'hex'), Buffer.from('cffaedfe', 'hex'),
  Buffer.from('cafebabe', 'hex'), Buffer.from('bebafeca', 'hex'),
];

export function isBinaryLike(path, body) {
  if (riskyBinaryExtensions.has(extname(path).toLowerCase())) return true;
  if (knownMagic.some((magic) => body.subarray(0, magic.length).equals(magic))) return true;
  if (body.includes(0)) return true;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(body);
  } catch {
    return true;
  }
  return body.some((byte) => byte < 0x09 || (byte > 0x0d && byte < 0x20) || byte === 0x7f);
}

function validVersion(version) {
  return version && /^[a-f0-9]{64}$/.test(version.sha256)
    && Number.isSafeInteger(version.bytes) && version.bytes >= 0;
}

export function buildPolicyIndex(policy) {
  const errors = [];
  const allowed = new Map();
  if (policy.schemaVersion !== 2) errors.push('binary policy schemaVersion must be 2');

  function add(path, entry, kind, currentRequired) {
    if (typeof path !== 'string' || !path || allowed.has(path)) {
      errors.push(`binary policy has an invalid or duplicate path ${path}`);
      return;
    }
    const current = { sha256: entry.sha256, bytes: entry.bytes };
    const approvedHistory = entry.approvedHistory ?? [];
    if (!validVersion(current) || !Array.isArray(approvedHistory)
      || approvedHistory.some((version) => !validVersion(version))) {
      errors.push(`binary policy has invalid version metadata for ${path}`);
      return;
    }
    const versions = [current, ...approvedHistory];
    if (new Set(versions.map((version) => `${version.sha256}:${version.bytes}`)).size !== versions.length) {
      errors.push(`binary policy repeats an approved version for ${path}`);
    }
    allowed.set(path, { current, approvedHistory, versions, kind, currentRequired });
  }

  for (const font of policy.fonts ?? []) {
    if (!Array.isArray(font.paths) || font.paths.length === 0) {
      errors.push('binary policy font entry must declare paths');
      continue;
    }
    if (font.historicalPaths !== undefined && !Array.isArray(font.historicalPaths)) {
      errors.push('binary policy historicalPaths must be an array');
      continue;
    }
    for (const path of font.paths) add(path, font, 'font', true);
    for (const path of font.historicalPaths ?? []) add(path, font, 'font', false);
  }
  for (const screenshot of policy.screenshots ?? []) add(screenshot.path, screenshot, 'screenshot', true);
  return { allowed, errors };
}

export function presenceProblems(allowed, observedCurrentPaths, observedHistoricalPaths) {
  const problems = [];
  for (const [path, expected] of allowed) {
    if (expected.currentRequired && !observedCurrentPaths.has(path)) {
      problems.push(`binary allowlist current-required path is missing from candidate: ${path}`);
    }
    if (!expected.currentRequired && !observedHistoricalPaths.has(path)) {
      problems.push(`binary allowlist historical-only path is not reachable: ${path}`);
    }
    if (!expected.currentRequired && observedCurrentPaths.has(path)) {
      problems.push(`binary allowlist historical-only path must not reappear in candidate: ${path}`);
    }
  }
  return problems;
}

export function readCandidateRegularFile(path) {
  const before = lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink()) {
    throw new Error('candidate binary path is a symlink or non-regular entry');
  }
  const descriptor = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = fstatSync(descriptor);
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new Error('candidate binary path changed identity before it could be read');
    }
    return readFileSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

export function pngProblems(path, body) {
  const problems = [];
  const signature = '89504e470d0a1a0a';
  if (body.length < 33 || body.subarray(0, 8).toString('hex') !== signature) {
    return ['screenshot signature or header is not a complete PNG'];
  }
  const width = body.readUInt32BE(16);
  const height = body.readUInt32BE(20);
  const chunks = [];
  let offset = 8;
  let endedAt = -1;
  let exif;
  while (offset + 12 <= body.length) {
    const length = body.readUInt32BE(offset);
    const type = body.toString('ascii', offset + 4, offset + 8);
    const next = offset + 12 + length;
    if (next > body.length) return ['PNG contains a malformed chunk'];
    chunks.push(type);
    if (type === 'eXIf') exif = body.subarray(offset + 8, offset + 8 + length);
    offset = next;
    if (type === 'IEND') {
      endedAt = offset;
      break;
    }
  }
  if (endedAt !== body.length) problems.push('PNG has missing IEND or trailing data');
  if (chunks.some((type) => ['iTXt', 'tEXt', 'zTXt'].includes(type))) problems.push('PNG contains textual metadata');
  const engine = path.match(/-(chromium|firefox|webkit)\.png$/)?.[1];
  const unique = [...new Set(chunks)].join(',');
  const expectedChunks = engine === 'webkit' ? 'IHDR,sRGB,eXIf,IDAT,IEND' : 'IHDR,IDAT,IEND';
  if (unique !== expectedChunks) problems.push('PNG chunk policy changed');
  if (engine === 'webkit' && !isDimensionOnlyExif(exif, width, height)) {
    problems.push('WebKit PNG EXIF is not limited to colour-space and pixel dimensions');
  }
  return problems;
}

export function isDimensionOnlyExif(exif, width, height) {
  if (!exif || exif.length !== 68 || exif.toString('ascii', 0, 2) !== 'MM'
    || exif.readUInt16BE(2) !== 42 || exif.readUInt32BE(4) !== 8
    || exif.readUInt16BE(8) !== 1 || exif.readUInt16BE(10) !== 0x8769
    || exif.readUInt16BE(12) !== 4 || exif.readUInt32BE(14) !== 1
    || exif.readUInt32BE(18) !== 26 || exif.readUInt32BE(22) !== 0
    || exif.readUInt16BE(26) !== 3) return false;
  const entries = [
    [28, 0xa001, 3, 1, 0x00010000],
    [40, 0xa002, 4, 1, width],
    [52, 0xa003, 4, 1, height],
  ];
  return entries.every(([offset, tag, type, count, value]) => (
    exif.readUInt16BE(offset) === tag
    && exif.readUInt16BE(offset + 2) === type
    && exif.readUInt32BE(offset + 4) === count
    && exif.readUInt32BE(offset + 8) === value
  )) && exif.readUInt32BE(64) === 0;
}

function digest(body) {
  return createHash('sha256').update(body).digest('hex');
}

function run() {
  const policy = JSON.parse(readFileSync(join(root, 'docs/release/binary-allowlist.json'), 'utf8'));
  const { allowed, errors } = buildPolicyIndex(policy);
  const findings = [...errors];
  const observedCurrentPaths = new Set();
  const observedHistoricalPaths = new Set();
  const observedHistoricalVersions = new Set();
  const historyEnvironment = gitHistoryEnvironment();

  function recordBinary(path, body, source, current) {
    const expected = allowed.get(path);
    const version = { sha256: digest(body), bytes: body.length };
    if (current) observedCurrentPaths.add(path);
    else observedHistoricalPaths.add(path);
    if (!expected) {
      findings.push(`${source}: unreviewed binary path ${path}`);
      return;
    }
    const matches = (candidate) => candidate.sha256 === version.sha256 && candidate.bytes === version.bytes;
    if (current ? !matches(expected.current) : !expected.versions.some(matches)) {
      findings.push(`${source}: binary content is not an approved ${current ? 'current' : 'historical'} version for ${path}`);
      return;
    }
    if (!current) observedHistoricalVersions.add(`${path}:${version.sha256}:${version.bytes}`);
    if (expected.kind === 'font' && body.toString('ascii', 0, 4) !== 'wOF2') {
      findings.push(`${source}: font signature is not WOFF2 for ${path}`);
    }
    if (expected.kind === 'screenshot') {
      for (const problem of pngProblems(path, body)) findings.push(`${source}: ${problem} for ${path}`);
    }
  }

  assertCompleteGitHistory(root);
  const commits = execFileSync('git', ['rev-list', '--all'], {
    cwd: root, encoding: 'utf8', env: historyEnvironment,
  }).trim().split(/\r?\n/).filter(Boolean);
  const bodyCache = new Map();
  const reviewedPathObjects = new Set();
  for (const commit of commits) {
    const rows = execFileSync('git', ['ls-tree', '-r', '-z', commit], {
      cwd: root, encoding: 'utf8', env: historyEnvironment,
    }).split('\0').filter(Boolean);
    for (const row of rows) {
      const match = row.match(/^\d+\s+blob\s+([a-f0-9]+)\t([\s\S]+)$/);
      if (!match) continue;
      const [, oid, path] = match;
      const key = `${path}:${oid}`;
      if (reviewedPathObjects.has(key)) continue;
      reviewedPathObjects.add(key);
      if (!bodyCache.has(oid)) {
        bodyCache.set(oid, execFileSync('git', ['cat-file', 'blob', oid], {
          cwd: root, env: historyEnvironment,
        }));
      }
      const body = bodyCache.get(oid);
      if (isBinaryLike(path, body)) recordBinary(path, body, commit, false);
    }
  }

  const candidatePaths = execFileSync('git', [
    'ls-files', '--cached', '--others', '--exclude-standard', '-z',
  ], { cwd: root }).toString('utf8').split('\0').filter(Boolean);
  for (const path of candidatePaths) {
    const absolute = join(root, path);
    let body;
    try {
      body = readCandidateRegularFile(absolute);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      findings.push(`candidate: refusing to read ${path}: ${error.message}`);
      continue;
    }
    if (isBinaryLike(path, body)) recordBinary(path, body, 'candidate', true);
  }

  findings.push(...presenceProblems(allowed, observedCurrentPaths, observedHistoricalPaths));
  for (const [path, expected] of allowed) {
    for (const version of expected.approvedHistory) {
      if (!observedHistoricalVersions.has(`${path}:${version.sha256}:${version.bytes}`)) {
        findings.push(`binary allowlist contains an unobserved historical version for ${path}`);
      }
    }
  }
  if (findings.length) {
    console.error('Lamplight binary policy failed:');
    for (const finding of findings) console.error(` - ${finding}`);
    process.exit(1);
  }
  console.log(`Lamplight binary policy passed (${allowed.size} allowlisted paths, ${reviewedPathObjects.size} unique historical path/blob pairs and ${commits.length} commits checked).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run();
