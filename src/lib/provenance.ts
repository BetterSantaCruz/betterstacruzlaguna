import {
  civicRegistrySchema,
  civicSourceSchema,
  sourceRegistrySchema,
  assertSourceIdentity,
  type CivicFact,
  type CivicRegistry,
  type CivicSource,
  type FieldProvenance,
  type FreshnessMetadata,
  type MunicipalityIdentity,
  type SourceRegistry,
} from './evidence/schemas';
import { canPublishFact } from './evidence/policy';

export * from './evidence/enums';
export * from './evidence/policy';
export * from './evidence/schemas';

/** Backward-compatible type name used throughout the application. */
export type SourceRecord = CivicSource;
export type {
  CivicFact,
  CivicRegistry,
  FieldProvenance,
  FreshnessMetadata,
  MunicipalityIdentity,
  SourceRegistry,
};

export function validateSourceRecord(value: unknown): SourceRecord {
  const source = civicSourceSchema.parse(value);
  assertSourceIdentity(source);
  return source;
}

export function validateSourceRegistry(
  value: unknown,
  today = new Date().toISOString().slice(0, 10)
): SourceRecord[] {
  const registry = sourceRegistrySchema.parse(value);
  const ids = new Set<string>();

  for (const source of registry.sources) {
    if (ids.has(source.sourceId)) {
      throw new Error(`Duplicate sourceId: ${source.sourceId}`);
    }
    ids.add(source.sourceId);
    assertSourceIdentity(source);

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
    if (source.access.checkedAt && source.access.checkedAt > today) {
      throw new Error(`Future source access date: ${source.sourceId}`);
    }

    for (const evidenceSourceId of source.identityResolution
      .evidenceSourceIds) {
      if (evidenceSourceId === source.sourceId) {
        throw new Error(
          `Source identity resolution cannot cite itself: ${source.sourceId}`
        );
      }
    }
  }

  for (const source of registry.sources) {
    for (const evidenceSourceId of source.identityResolution
      .evidenceSourceIds) {
      if (!ids.has(evidenceSourceId)) {
        throw new Error(
          `Unknown identity evidence sourceId for ${source.sourceId}: ${evidenceSourceId}`
        );
      }
    }
  }

  return registry.sources;
}

export function validateCivicRegistry(
  value: unknown,
  sources: readonly SourceRecord[],
  today = new Date().toISOString().slice(0, 10)
): CivicRegistry {
  const registry = civicRegistrySchema.parse(value);
  const sourceById = new Map(sources.map(source => [source.sourceId, source]));
  const factIds = new Set<string>();

  for (const fact of registry.facts) {
    if (factIds.has(fact.id)) {
      throw new Error(`Duplicate civic fact id: ${fact.id}`);
    }
    factIds.add(fact.id);

    for (const sourceId of fact.evidence.sourceIds) {
      if (!sourceById.has(sourceId)) {
        throw new Error(`unknown sourceId for ${fact.id}: ${sourceId}`);
      }
    }

    if (fact.freshness.lastVerifiedAt > today) {
      throw new Error(`Future civic fact date for ${fact.id}`);
    }
    if (fact.freshness.validFrom && fact.freshness.validFrom > today) {
      throw new Error(`Future civic fact validity date for ${fact.id}`);
    }

    if (
      fact.publication.state === 'published' &&
      !canPublishFact(fact, sources)
    ) {
      throw new Error(
        `Published civic fact is not evidence-eligible: ${fact.id}`
      );
    }
  }

  return registry;
}
