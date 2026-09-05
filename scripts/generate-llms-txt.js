#!/usr/bin/env node

/**
 * Generate a concise crawler note from the current project boundary.
 * This file must never turn empty or unverified datasets into claims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCrawlerNote } from './llms-content.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(
  fs.readFileSync(path.join(root, 'config', 'lgu.config.json'), 'utf8')
);
const output = buildCrawlerNote(config);

fs.writeFileSync(path.join(root, 'public', 'llms.txt'), output);
console.log(
  'Generated ' + (config.portal?.name || 'BetterSantaCruz') + ' crawler note.'
);
