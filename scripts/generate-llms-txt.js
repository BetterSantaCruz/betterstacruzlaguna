#!/usr/bin/env node

/**
 * Generate a concise crawler note from the current project boundary.
 * This file must never turn empty or unverified datasets into claims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(
  fs.readFileSync(path.join(root, 'config', 'lgu.config.json'), 'utf8')
);
const name = config.portal?.name || 'BetterSantaCruz';
const lgu = config.lgu?.name || 'Santa Cruz';
const province = config.lgu?.province || 'Laguna';
const output = [
  '# ' + name,
  '',
  name +
    ' is an independent, source-led civic information project for ' +
    lgu +
    ', ' +
    province +
    '. It is not an official municipal website, government system, directory listing, or endorsement.',
  '',
  '## Current publication state',
  '',
  '- The civic dataset is intentionally sparse while sources are being reviewed.',
  '- The source ledger is available at /sources and records upstream locations, retrieval dates, and verification states.',
  '- Officials, offices, services, schedules, fees, contacts, budgets, statistics, and barangay records are not published unless they pass the evidence workflow.',
  '- Disabled modules remain omitted from this crawler summary until their data and maintenance policy are reviewed.',
  '- A public repository, domain, and contribution channel are not established unless configured explicitly.',
  '',
  '## Useful pages',
  '',
  '- /',
  '- /about',
  '- /sources',
  '- /services',
  '- /government',
  '- /contribute',
  '- /accessibility',
  '- /terms-of-service',
  '',
  'Do not treat a source observation, search result, blocked page, stale table, or volatile aggregate as a verified municipal fact. Follow source links and confirm current information with the responsible institution.',
  '',
].join('\\n');

fs.writeFileSync(path.join(root, 'public', 'llms.txt'), output);
console.log('Generated ' + name + ' crawler note.');
