import { z } from 'zod';

import { SANTA_CRUZ_IDENTITY } from './municipality-identity';
import type { SourceRecord } from './provenance';

const SANTA_CRUZ_BARANGAY_COUNT = 26;
const SANTA_CRUZ_POPULATION = 126844;
const SANTA_CRUZ_REFERENCE_YEAR = 2024;
const SANTA_CRUZ_AS_OF = '2025-07-31';
const SANTA_CRUZ_PSGC_PREFIX = SANTA_CRUZ_IDENTITY.psgc10.slice(0, -3);
const SANTA_CRUZ_CORRESPONDENCE_PREFIX =
  SANTA_CRUZ_IDENTITY.correspondenceCode.slice(0, -3);

const dateSchema = z.string().date();
const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const canonicalProvenanceSchema = z.object({
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceOrganization: z.string().min(1),
  retrievedAt: dateSchema,
  lastVerifiedAt: dateSchema,
  verificationStatus: z.literal('verified'),
});

const barangayRecordSchema = canonicalProvenanceSchema.extend({
  slug: slugSchema,
  barangay_name: z.string().min(1),
  psgc10: z.string().regex(/^\d{10}$/),
  correspondenceCode: z.string().regex(/^\d{9}$/),
  classification: z.enum(['Urban', 'Rural']),
  population: z.number().int().nonnegative(),
  referenceYear: z.number().int().positive(),
  asOf: dateSchema,
  officials: z.array(z.unknown()).refine(officials => officials.length === 0, {
    message: 'Barangay official records remain gated',
  }),
});

const executiveRecordSchema = canonicalProvenanceSchema.extend({
  slug: slugSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  office: z.string().min(1).nullable(),
  isElected: z.boolean(),
  term: z.string().min(1).nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  website: z.string().url().nullable(),
});

const populationPointSchema = z.object({
  year: z.number().int().positive(),
  population: z.number().int().nonnegative(),
});

const populationGrowthRateSchema = z.object({
  period: z.string().min(1),
  rate: z.number().finite(),
});

const populationDataSchema = z.object({
  meta: z.object({
    location: z.object({
      region: z.string().min(1),
      province: z.literal('Laguna'),
      municipality: z.literal('Santa Cruz'),
    }),
    source: z.string().min(1),
    sourceId: z.string().min(1),
    sourceUrl: z.string().url(),
    retrievedAt: dateSchema,
    lastVerifiedAt: dateSchema,
    asOf: dateSchema,
    referenceYear: z.number().int().positive(),
    notes: z.string().min(1),
    censusDates: z.record(z.string(), z.unknown()),
  }),
  municipality: z.object({
    name: z.literal('Santa Cruz'),
    history: z.array(populationPointSchema).min(1),
    growthRates: z.array(populationGrowthRateSchema),
  }),
  barangays: z.array(
    z.object({
      id: z.string().regex(/^\d{10}$/),
      name: z.string().min(1),
      history: z.array(populationPointSchema).min(1),
    })
  ),
});

export type CanonicalBarangay = z.infer<typeof barangayRecordSchema>;
export type CanonicalExecutive = z.infer<typeof executiveRecordSchema>;
export type CanonicalPopulationData = z.infer<typeof populationDataSchema>;

const sourceComparableFields = [
  'sourceTitle',
  'sourceUrl',
  'sourceOrganization',
  'retrievedAt',
  'lastVerifiedAt',
] as const;

type SourceLinkedRecord = {
  sourceId: string;
  sourceUrl: string;
  retrievedAt: string;
  lastVerifiedAt: string;
};

function assertSourceLink(
  record: SourceLinkedRecord,
  sources: readonly SourceRecord[],
  today: string,
  context: string
): SourceRecord {
  const source = sources.find(
    candidate => candidate.sourceId === record.sourceId
  );
  if (!source) {
    throw new Error(`unknown sourceId for ${context}: ${record.sourceId}`);
  }
  if (source.municipality !== 'Santa Cruz') {
    throw new Error(`Municipality mismatch for ${context}`);
  }
  if (source.verificationStatus !== 'verified') {
    throw new Error(`${context} requires a verified source`);
  }

  if (record.sourceUrl !== source.sourceUrl) {
    throw new Error(`Provenance mismatch for ${context}: sourceUrl`);
  }
  if (record.retrievedAt !== source.retrievedAt) {
    throw new Error(`Provenance mismatch for ${context}: retrievedAt`);
  }
  if (record.lastVerifiedAt !== source.lastVerifiedAt) {
    throw new Error(`Provenance mismatch for ${context}: lastVerifiedAt`);
  }
  if (record.retrievedAt > today || record.lastVerifiedAt > today) {
    throw new Error(`Future canonical data date for ${context}`);
  }

  return source;
}

function assertCanonicalProvenance(
  record: z.infer<typeof canonicalProvenanceSchema>,
  sources: readonly SourceRecord[],
  today: string,
  context: string
): void {
  const source = assertSourceLink(record, sources, today, context);

  for (const field of sourceComparableFields) {
    if (record[field] !== source[field]) {
      throw new Error(`Provenance mismatch for ${context}: ${field}`);
    }
  }
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function assertAscendingHistory(
  history: readonly z.infer<typeof populationPointSchema>[],
  context: string
): void {
  for (let index = 1; index < history.length; index += 1) {
    if (history[index].year <= history[index - 1].year) {
      throw new Error(`Population years must be ascending for ${context}`);
    }
  }
}

export function validateBarangayDirectory(
  value: unknown,
  sources: readonly SourceRecord[],
  today = new Date().toISOString().slice(0, 10)
): CanonicalBarangay[] {
  const records = z.array(barangayRecordSchema).parse(value);
  if (records.length !== SANTA_CRUZ_BARANGAY_COUNT) {
    throw new Error(
      `Santa Cruz barangay directory must contain ${SANTA_CRUZ_BARANGAY_COUNT} records; received ${records.length}`
    );
  }

  assertUnique(
    records.map(record => record.slug),
    'barangay slug'
  );
  assertUnique(
    records.map(record => record.psgc10),
    'barangay PSGC'
  );
  assertUnique(
    records.map(record => record.correspondenceCode),
    'barangay correspondence code'
  );

  let populationTotal = 0;
  for (const record of records) {
    const sequence = record.psgc10.slice(-3);
    if (
      record.psgc10 !== `${SANTA_CRUZ_PSGC_PREFIX}${sequence}` ||
      record.correspondenceCode !==
        `${SANTA_CRUZ_CORRESPONDENCE_PREFIX}${sequence}`
    ) {
      throw new Error(
        `Invalid Santa Cruz PSGC relationship for ${record.slug}`
      );
    }
    if (
      record.referenceYear !== SANTA_CRUZ_REFERENCE_YEAR ||
      record.asOf !== SANTA_CRUZ_AS_OF ||
      record.sourceId !== 'sc-psa-psgc'
    ) {
      throw new Error(
        `Invalid Santa Cruz PSA baseline metadata for ${record.slug}`
      );
    }

    assertCanonicalProvenance(
      record,
      sources,
      today,
      `barangay ${record.slug}`
    );
    populationTotal += record.population;
  }

  if (populationTotal !== SANTA_CRUZ_POPULATION) {
    throw new Error(
      `Santa Cruz barangay population total must equal ${SANTA_CRUZ_POPULATION}; received ${populationTotal}`
    );
  }

  return records;
}

export function validateExecutiveDirectory(
  value: unknown,
  sources: readonly SourceRecord[],
  today = new Date().toISOString().slice(0, 10)
): CanonicalExecutive[] {
  const records = z.array(executiveRecordSchema).parse(value);
  assertUnique(
    records.map(record => record.slug),
    'executive slug'
  );

  for (const record of records) {
    assertCanonicalProvenance(
      record,
      sources,
      today,
      `executive ${record.slug}`
    );
  }

  return records;
}

export function validatePopulationData(
  value: unknown,
  sources: readonly SourceRecord[],
  expectedBarangayIds: readonly string[],
  today = new Date().toISOString().slice(0, 10)
): CanonicalPopulationData {
  const data = populationDataSchema.parse(value);
  assertSourceLink(data.meta, sources, today, 'population metadata');

  assertUnique(
    data.municipality.history.map(point => String(point.year)),
    'municipality population year'
  );
  assertAscendingHistory(data.municipality.history, 'municipality');
  assertUnique(
    data.municipality.growthRates.map(rate => rate.period),
    'population growth period'
  );

  const actualBarangayIds = data.barangays.map(barangay => barangay.id);
  assertUnique(actualBarangayIds, 'population barangay ID');
  const expected = [...expectedBarangayIds].sort();
  const actual = [...actualBarangayIds].sort();
  if (
    expected.length !== actual.length ||
    expected.some((id, index) => id !== actual[index])
  ) {
    throw new Error(
      'Population barangay IDs do not match the canonical directory'
    );
  }

  const latestMunicipality = data.municipality.history.at(-1);
  if (!latestMunicipality) {
    throw new Error('Population municipality history is empty');
  }
  if (data.meta.referenceYear !== latestMunicipality.year) {
    throw new Error(
      'Population reference year does not match municipality history'
    );
  }

  let latestBarangayTotal = 0;
  for (const barangay of data.barangays) {
    assertAscendingHistory(barangay.history, `barangay ${barangay.id}`);
    const latest = barangay.history.at(-1);
    if (!latest || latest.year !== latestMunicipality.year) {
      throw new Error(
        `Population barangay history is not aligned to ${latestMunicipality.year}: ${barangay.id}`
      );
    }
    latestBarangayTotal += latest.population;
  }

  if (latestBarangayTotal !== latestMunicipality.population) {
    throw new Error(
      `Population total ${latestMunicipality.population} does not match barangay population total ${latestBarangayTotal}`
    );
  }
  return data;
}
