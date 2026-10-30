#!/usr/bin/env node

import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const core = dirname(dirname(fileURLToPath(import.meta.url)));
const root = join(core, '..', '..');
const dist = join(core, 'dist');
const source = join(core, 'src');
const generated = join(core, 'generated');

const livingLight = readFileSync(join(source, 'living-light.js'), 'utf8');
const iifeOpen = /^\(function \(\) \{\s*\n\s*"use strict";\n/;
const iifeClose = /\}\)\(\);\s*$/;
if (!iifeOpen.test(livingLight) || !iifeClose.test(livingLight)) {
  throw new Error('living-light.js must remain the reviewed bare IIFE source');
}
const body = livingLight.replace(iifeOpen, '').replace(iifeClose, '');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
copyFileSync(join(generated, 'tokens.css'), join(dist, 'tokens.css'));
copyFileSync(join(generated, 'modes.css'), join(dist, 'modes.css'));
copyFileSync(join(root, 'tokens', 'lamplight.tokens.json'), join(dist, 'lamplight.tokens.json'));
copyFileSync(join(source, 'components.css'), join(dist, 'components.css'));
writeFileSync(join(dist, 'lamplight.css'),
  '/* Lamplight core: tokens, scoped components, then modes. Fonts and living light are opt-in. */\n'
  + '@import "./tokens.css";\n@import "./components.css";\n@import "./modes.css";\n');
writeFileSync(join(dist, 'living-light.js'),
  '// Generated from packages/core/src/living-light.js.\n'
  + 'export function initLivingLight() {\n'
  + '  if (typeof window === \'undefined\' || typeof document === \'undefined\') return;\n'
  + body.replace(/^/gm, '  ').replace(/^\s+$/gm, '')
  + '}\n');
copyFileSync(join(source, 'living-light.d.ts'), join(dist, 'living-light.d.ts'));
cpSync(join(core, 'fonts'), join(dist, 'fonts'), { recursive: true });

console.log('Built Lamplight core: CSS, opt-in fonts and explicit living-light export.');
