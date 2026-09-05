import { z } from 'zod';

import { assertSantaCruzIdentity } from './municipality-identity';

export const verificationStatuses = [
  'verified',
  'observed',
  'pending',
  'access-restricted',
  'unreachable',
  'discovery-only',
  'secondary',
  'collaboration',
] as const;

export const confidenceLevels = ['high', 'medium', 'low', 'unknown'] as const;

export const sourceRecordSchema = z.object({
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  sourceUrl: z
    .string()
    .url()
    .refine(url => /^https?:\/\//i.test(url), 'sourceUrl must use HTTP(S)'),
  sourceOrganization: z.string().min(1),
  sourceType: z.string().min(1),
  location: z.string().min(1),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  retrievedAt: z.string().date(),
  lastVerifiedAt: z.string().date(),
  municipality: z.enum(['Santa Cruz', 'Pagsanjan']),
  categories: z.array(z.string().min(1)).min(1),
  confidence: z.enum(confidenceLevels),
  verificationStatus: z.enum(verificationStatuses),
  localArchiveFilename: z.string().min(1).nullable(),
  notes: z.string().min(1),
});

export type SourceRecord = z.infer<typeof sourceRecordSchema>;

const civicFactSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.string().min(1), z.number().finite(), z.boolean()]),
  municipality: z.enum(['Santa Cruz', 'Pagsanjan']),
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceOrganization: z.string().min(1),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  retrievedAt: z.string().date(),
  lastVerifiedAt: z.string().date(),
  verificationStatus: z.enum(verificationStatuses),
});

const civicRegistrySchema = z.object({
  municipality: z.literal('Santa Cruz'),
  province: z.literal('Laguna'),
  region: z.string().min(1),
  facts: z.array(civicFactSchema),
});

export type CivicFact = z.infer<typeof civicFactSchema>;
export type CivicRegistry = z.infer<typeof civicRegistrySchema>;

export function validateSourceRecord(value: unknown): SourceRecord {
  return sourceRecordSchema.parse(value);
}

export function validateSourceRegistry(
  value: unknown,
  today = new Date().toISOString().slice(0, 10)
): SourceRecord[] {
  const registry = z
    .object({ sources: z.array(sourceRecordSchema) })
    .parse(value);
  const ids = new Set<string>();

  for (const source of registry.sources) {
    if (ids.has(source.sourceId)) {
      throw new Error(`Duplicate sourceId: ${source.sourceId}`);
    }
    ids.add(source.sourceId);

    if (source.retrievedAt > today || source.lastVerifiedAt > today) {
      throw new Error(`Future source date: ${source.sourceId}`);
    }
    if (source.publishedAt && source.publishedAt.slice(0, 10) > today) {
      throw new Error(`Future source date: ${source.sourceId}`);
    }
    if (source.lastVerifiedAt < source.retrievedAt) {
      throw new Error(
        `Source verification date precedes retrieval: ${source.sourceId}`
      );
    }
    if (
      source.publishedAt &&
      source.publishedAt.slice(0, 10) > source.retrievedAt
    ) {
      throw new Error(
        `Source publication date follows retrieval: ${source.sourceId}`
      );
    }

    if (source.municipality === 'Santa Cruz') {
      assertSantaCruzIdentity({
        municipality: source.municipality,
        province: 'Laguna',
        sourceTitle: source.sourceTitle,
        sourceOrganization: source.sourceOrganization,
        location: source.location,
        notes: source.notes,
      });
    } else if (
      !source.location.toLowerCase().includes('pagsanjan') ||
      !source.location.toLowerCase().includes('laguna')
    ) {
      throw new Error(
        `Source location does not match ${source.municipality}: ${source.sourceId}`
      );
    }
  }

  return registry.sources;
}

export function validateCivicRegistry(
  value: unknown,
  sources: SourceRecord[],
  today = new Date().toISOString().slice(0, 10)
): CivicRegistry {
  const registry = civicRegistrySchema.parse(value);
  assertSantaCruzIdentity(registry);
  const sourceById = new Map(sources.map(source => [source.sourceId, source]));
  const factIds = new Set<string>();

  for (const fact of registry.facts) {
    if (factIds.has(fact.id)) {
      throw new Error(`Duplicate civic fact id: ${fact.id}`);
    }
    factIds.add(fact.id);

    const source = sourceById.get(fact.sourceId);
    if (!source) {
      throw new Error(`unknown sourceId: ${fact.sourceId}`);
    }
    if (source.municipality !== fact.municipality) {
      throw new Error(
        `Municipality mismatch for ${fact.id}: ${fact.municipality} versus ${source.municipality}`
      );
    }
    for (const field of [
      'sourceTitle',
      'sourceUrl',
      'sourceOrganization',
      'publishedAt',
      'retrievedAt',
      'lastVerifiedAt',
      'verificationStatus',
    ] as const) {
      if (fact[field] !== source[field]) {
        throw new Error(`Provenance mismatch for ${fact.id}: ${field}`);
      }
    }

    if (fact.retrievedAt > today || fact.lastVerifiedAt > today) {
      throw new Error(`Future civic fact date for ${fact.id}`);
    }
    if (fact.publishedAt && fact.publishedAt.slice(0, 10) > today) {
      throw new Error(`Future civic fact publication date for ${fact.id}`);
    }
  }

  return registry;
}
