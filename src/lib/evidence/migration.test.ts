import { describe, expect, it } from 'vitest';

import {
  migrateLegacyCivicRegistry,
  migrateLegacySourceRegistry,
} from './migration';

const legacyPsa = {
  sourceId: 'sc-psa-psgc',
  sourceTitle: 'Santa Cruz PSGC',
  sourceUrl: 'https://psa.gov.ph/classification/psgc/barangays/0403426000',
  sourceOrganization: 'Philippine Statistics Authority',
  sourceType: 'official-statistics-portal',
  location: 'Santa Cruz, Laguna',
  publishedAt: null,
  retrievedAt: '2026-09-05',
  lastVerifiedAt: '2026-09-05',
  municipality: 'Santa Cruz',
  categories: ['identity'],
  confidence: 'high',
  verificationStatus: 'verified',
  localArchiveFilename: null,
  notes: 'Verified identity source.',
};

const legacyPagsanjan = {
  ...legacyPsa,
  sourceId: 'pg-psa-psgc',
  sourceTitle: 'Pagsanjan PSGC',
  sourceUrl: 'https://psa.gov.ph/classification/psgc/barangays/0403419000',
  location: 'Pagsanjan, Laguna',
  municipality: 'Pagsanjan',
};

const legacyFacts = {
  municipality: 'Santa Cruz',
  province: 'Laguna',
  region: 'Region IV-A (CALABARZON)',
  facts: [
    {
      id: 'population',
      label: 'Population',
      value: 126844,
      municipality: 'Santa Cruz',
      sourceId: 'sc-psa-psgc',
      sourceTitle: legacyPsa.sourceTitle,
      sourceUrl: legacyPsa.sourceUrl,
      sourceOrganization: legacyPsa.sourceOrganization,
      publishedAt: null,
      retrievedAt: '2026-09-05',
      lastVerifiedAt: '2026-09-05',
      verificationStatus: 'verified',
    },
  ],
};

describe('evidence v2 migration', () => {
  it('separates Pagsanjan research from the production source registry', () => {
    const result = migrateLegacySourceRegistry({
      sources: [legacyPsa, legacyPagsanjan],
    });
    expect(result.registry.sources.map(source => source.sourceId)).toEqual([
      'sc-psa-psgc',
    ]);
    expect(result.separatedResearch.map(source => source.sourceId)).toEqual([
      'pg-psa-psgc',
    ]);
  });

  it('adds explicit Santa Cruz identity and independent evidence dimensions', () => {
    const { registry } = migrateLegacySourceRegistry({ sources: [legacyPsa] });
    const source = registry.sources[0];
    expect(source.identity).toMatchObject({
      municipality: 'Santa Cruz',
      province: 'Laguna',
      municipalityPsgc: '0403426000',
    });
    expect(source.authority).toBe('primary-official');
    expect(source.access.state).toBe('reachable');
    expect(source.reviewState).toBe('reviewed');
  });

  it('preserves civic values while replacing duplicated source metadata', () => {
    const migrated = migrateLegacyCivicRegistry(legacyFacts);
    expect(migrated.facts[0].value).toBe(126844);
    expect(migrated.facts[0].evidence).toMatchObject({
      sourceIds: ['sc-psa-psgc'],
      verification: 'single-source',
      assertionType: 'direct',
    });
    expect(migrated.facts[0]).not.toHaveProperty('sourceUrl');
    expect(migrated.facts[0].publication.state).toBe('published');
  });

  it('is idempotent for already-migrated v2 registries', () => {
    const firstSources = migrateLegacySourceRegistry({ sources: [legacyPsa] });
    const secondSources = migrateLegacySourceRegistry(firstSources.registry);
    expect(secondSources.registry).toEqual(firstSources.registry);
    expect(secondSources.separatedResearch).toEqual([]);

    const firstFacts = migrateLegacyCivicRegistry(legacyFacts);
    const secondFacts = migrateLegacyCivicRegistry(firstFacts);
    expect(secondFacts).toEqual(firstFacts);
  });

  it('fails loudly for unknown legacy status values', () => {
    expect(() =>
      migrateLegacySourceRegistry({
        sources: [{ ...legacyPsa, verificationStatus: 'mystery-state' }],
      })
    ).toThrow(/Unknown legacy verificationStatus/);
  });
});
