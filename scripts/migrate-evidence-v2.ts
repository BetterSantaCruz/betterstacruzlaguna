#!/usr/bin/env tsx

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  migrateLegacyCivicRegistry,
  migrateLegacySourceRegistry,
} from '../src/lib/evidence/migration';
import {
  civicRegistrySchema,
  sourceRegistrySchema,
} from '../src/lib/evidence/schemas';

interface Args {
  sources: string;
  facts: string;
  out: string;
  check: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    sources: 'src/data/sources/source-registry.json',
    facts: 'src/data/civic-registry.json',
    out: 'pipeline/evidence-v2-preview',
    check: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--sources' && next) {
      args.sources = next;
      index += 1;
    } else if (arg === '--facts' && next) {
      args.facts = next;
      index += 1;
    } else if (arg === '--out' && next) {
      args.out = next;
      index += 1;
    } else if (arg === '--check') {
      args.check = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return args;
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(path.resolve(filePath), 'utf8')) as unknown;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main(): void {
  const args = parseArgs(process.argv);
  const sourceInput = readJson(args.sources);
  const factInput = readJson(args.facts);

  const { registry: sources, separatedResearch } =
    migrateLegacySourceRegistry(sourceInput);
  const facts = migrateLegacyCivicRegistry(factInput);

  sourceRegistrySchema.parse(sources);
  civicRegistrySchema.parse(facts);

  const report = {
    schemaVersion: 1,
    santaCruzSources: sources.sources.length,
    civicFacts: facts.facts.length,
    separatedResearchSources: separatedResearch.length,
    civicValuesChanged: false,
  };

  if (args.check) {
    console.log(stableJson(report).trimEnd());
    return;
  }

  const out = path.resolve(args.out);
  mkdirSync(out, { recursive: true });
  writeFileSync(path.join(out, 'source-registry.json'), stableJson(sources));
  writeFileSync(path.join(out, 'civic-registry.json'), stableJson(facts));
  writeFileSync(
    path.join(out, 'pagsanjan-research-source-registry.json'),
    stableJson({
      purpose:
        'Research-only handoff context; not imported by BetterSantaCruz production data.',
      sources: separatedResearch,
    })
  );
  writeFileSync(path.join(out, 'migration-report.json'), stableJson(report));

  console.log(`Wrote evidence-v2 migration preview to ${out}`);
  console.log(stableJson(report).trimEnd());
}

main();
