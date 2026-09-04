#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_OUT = path.join(ROOT, 'pipeline/openlgu/terms.json');

function parseArgs(argv) {
  const args = {
    input: process.env.BETTERSANTACRUZ_TERMS_INPUT || null,
    output: process.env.BETTERSANTACRUZ_TERMS_OUTPUT || DEFAULT_OUT,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--input' && next) {
      args.input = next;
      index += 1;
    } else if (arg === '--output' && next) {
      args.output = next;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/openlgu/generate-term-snapshot.cjs --input <path> [--output <path>]

Copies a reviewed term JSON artifact into the pipeline snapshot shape.
No municipal term dates are embedded in this repository.
`);
      return null;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function loadTerms(inputPath) {
  if (!inputPath) {
    throw new Error(
      'Term snapshot generation is disabled until a reviewed JSON input is provided with --input or BETTERSANTACRUZ_TERMS_INPUT.'
    );
  }
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) throw new Error(`Terms input not found: ${resolved}`);
  const payload = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const terms = Array.isArray(payload) ? payload : payload.terms;
  if (!Array.isArray(terms)) throw new Error('Terms input must be an array or contain a terms array.');
  for (const [index, term] of terms.entries()) {
    for (const field of ['term_id', 'label', 'start_date', 'end_date']) {
      if (!String(term?.[field] || '').trim()) {
        throw new Error(`Term ${index + 1} is missing ${field}.`);
      }
    }
  }
  return terms;
}

const args = parseArgs(process.argv);
if (args) {
  const terms = loadTerms(args.input);
  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(terms, null, 2) + '\n');
  console.log(`Wrote ${terms.length} reviewed terms to ${path.relative(ROOT, output)}`);
}
