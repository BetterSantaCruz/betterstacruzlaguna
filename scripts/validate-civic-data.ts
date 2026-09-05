import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateCivicRegistry,
  validateSourceRegistry,
  type SourceRecord,
} from '../src/lib/provenance';
import {
  validateBarangayDirectory,
  validateExecutiveDirectory,
  validatePopulationData,
} from '../src/lib/canonical-data';
import { findInheritedClaimPaths } from '../src/lib/clean-room';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const today = new Date().toISOString().slice(0, 10);

function readJson(relativePath: string): unknown {
  const absolutePath = path.join(projectRoot, relativePath);
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON at ${relativePath}: ${reason}`);
  }
}

function walkFiles(relativeDirectory: string): string[] {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];

  const results: string[] = [];
  for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(relativePath));
    else results.push(relativePath);
  }
  return results;
}

function assertNoInheritedClaims(relativePaths: string[]): void {
  const hits = findInheritedClaimPaths(
    relativePaths.flatMap(relativePath => {
      const absolutePath = path.join(projectRoot, relativePath);
      if (!statSync(absolutePath).isFile()) return [];
      return [
        { path: relativePath, contents: readFileSync(absolutePath, 'utf8') },
      ];
    })
  );

  if (hits.length > 0) {
    throw new Error(
      `Inherited Los Baños/BetterLB content remains in publishable data or UI files:\n${hits.join('\n')}`
    );
  }
}

function assertUniqueRecords(value: unknown, relativePath: string): void {
  if (!Array.isArray(value)) return;
  const seen = new Set<string>();
  for (const record of value) {
    if (!record || typeof record !== 'object') continue;
    const candidate = record as Record<string, unknown>;
    const key =
      candidate.slug ??
      candidate.id ??
      candidate.documentNumber ??
      candidate.serviceNumber;
    if (typeof key !== 'string' || key.length === 0) continue;
    if (seen.has(key))
      throw new Error(`Duplicate record key ${key} in ${relativePath}`);
    seen.add(key);
  }
}

function assertNoNegativeAmounts(value: unknown, location = 'data'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoNegativeAmounts(item, `${location}[${index}]`)
    );
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === 'number' &&
      child < 0 &&
      /(amount|price|budget|cost|fee|revenue|expenditure|abc|income|expense)/i.test(
        key
      )
    ) {
      throw new Error(`Negative currency-like value at ${location}.${key}`);
    }
    assertNoNegativeAmounts(child, `${location}.${key}`);
  }
}

function main(): void {
  const sources = validateSourceRegistry(
    readJson('src/data/sources/source-registry.json')
  );
  const civicRegistry = validateCivicRegistry(
    readJson('src/data/civic-registry.json'),
    sources,
    today
  );
  const barangayDirectory = validateBarangayDirectory(
    readJson('src/data/directory/barangays.json'),
    sources,
    today
  );
  validateExecutiveDirectory(
    readJson('src/data/directory/executive.json'),
    sources,
    today
  );
  validatePopulationData(
    readJson('src/data/statistics/population.json'),
    sources,
    barangayDirectory.map(barangay => barangay.psgc10),
    today
  );

  const config = readJson('config/lgu.config.json') as {
    lgu?: { name?: string; province?: string; region?: string };
    transparency?: { procurement?: { organizationName?: string } };
  };
  if (
    config.lgu?.name !== 'Santa Cruz' ||
    config.lgu?.province !== 'Laguna' ||
    config.lgu?.region !== 'Region IV-A'
  ) {
    throw new Error(
      'LGU config identity must be Santa Cruz, Laguna, Region IV-A'
    );
  }
  if (
    config.transparency?.procurement?.organizationName !==
    'MUNICIPALITY OF SANTA CRUZ, LAGUNA'
  ) {
    throw new Error(
      'Procurement organization name is not the verified Santa Cruz identity'
    );
  }

  const requiredSourceIds = ['sc-philgeps-11459794', 'sc-sb-about'];
  for (const sourceId of requiredSourceIds) {
    if (!sources.some(source => source.sourceId === sourceId)) {
      throw new Error(`Required source is missing: ${sourceId}`);
    }
  }

  const jsonDataFiles = [
    'src/data/civic-registry.json',
    'src/data/directory/barangays.json',
    'src/data/directory/departments.json',
    'src/data/directory/executive.json',
    'src/data/directory/legislative.json',
    'src/data/services/services.json',
    'src/data/citizens-charter/citizens-charter.json',
    'src/data/citizens-charter/merged-services.json',
    'src/data/statistics/population.json',
    'src/data/statistics/cmci.json',
    'src/data/statistics/ari.json',
    'src/data/transparency/sre.json',
    'src/data/tourism/resorts.json',
  ];
  const allDataFiles = [
    ...jsonDataFiles,
    'config/lgu.config.json',
    'src/data/sources/source-registry.json',
    ...walkFiles('src/data/services/categories'),
    ...walkFiles('public/locales'),
  ];
  const publishableUiFiles = [
    'src/App.tsx',
    'src/main.tsx',
    ...walkFiles('src/pages'),
    ...walkFiles('src/components'),
  ];

  for (const relativePath of jsonDataFiles) {
    const value = readJson(relativePath);
    assertUniqueRecords(value, relativePath);
    assertNoNegativeAmounts(value, relativePath);
  }
  assertNoInheritedClaims([...allDataFiles, ...publishableUiFiles]);

  const rawFiles = walkFiles('raw_data').filter(
    relativePath => !relativePath.endsWith('README.md')
  );
  if (rawFiles.length > 0) {
    throw new Error(
      `raw_data contains unreviewed files: ${rawFiles.join(', ')}`
    );
  }

  const logoFiles = walkFiles('public/logos');
  const inheritedLogoFiles = logoFiles.filter(relativePath =>
    /betterlb|lb-seal/i.test(relativePath)
  );
  if (inheritedLogoFiles.length > 0) {
    throw new Error(
      `Inherited BetterLB logo assets remain: ${inheritedLogoFiles.join(', ')}`
    );
  }

  const santaCruzFacts = civicRegistry.facts.filter(
    fact => fact.municipality === 'Santa Cruz'
  );
  console.log(
    `Civic data validation passed: ${sources.length} sources, ${santaCruzFacts.length} Santa Cruz facts, ${today} cutoff.`
  );
}

main();

export type { SourceRecord };
