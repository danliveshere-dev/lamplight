#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { EXPECTED_TOKEN_COUNT, formatModesCss, formatTokenCss, loadTokenDocument } from './token-tools.mjs';

const document = loadTokenDocument();
const outputs = new Map([
  ['packages/core/generated/tokens.css', formatTokenCss(document)],
  ['packages/core/generated/modes.css', formatModesCss(document)],
]);

if (process.argv.includes('--check')) {
  for (const [path, css] of outputs) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== css) {
      console.error(`${path} has drifted; run npm run tokens:build`);
      process.exit(1);
    }
  }
  console.log(`Generated CSS is current (${EXPECTED_TOKEN_COUNT} tokens).`);
} else {
  mkdirSync('packages/core/generated', { recursive: true });
  for (const [path, css] of outputs) writeFileSync(path, css);
  console.log(`Generated tokens and modes (${EXPECTED_TOKEN_COUNT} tokens).`);
}
