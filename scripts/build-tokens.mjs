#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { formatTokenCss, loadTokenDocument } from './token-tools.mjs';

const output = 'packages/core/generated/tokens.css';
const css = formatTokenCss(loadTokenDocument());

if (process.argv.includes('--check')) {
  if (!existsSync(output) || readFileSync(output, 'utf8') !== css) {
    console.error(`${output} has drifted; run npm run tokens:build`);
    process.exit(1);
  }
  console.log(`${output} is current (161 tokens).`);
} else {
  mkdirSync('packages/core/generated', { recursive: true });
  writeFileSync(output, css);
  console.log(`Generated ${output} (161 tokens).`);
}
