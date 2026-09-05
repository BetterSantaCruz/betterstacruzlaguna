import { describe, expect, it } from 'vitest';

import {
  validateCivicRegistry,
  validateSourceRecord,
  validateSourceRegistry,
  type SourceRecord,
} from './provenance';

function makeSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    sourceId: 'test-source',
    sourceTitle: 'Test Santa Cruz source',
    sourceUrl: 'https://example.com/source',
    sourceOrganization: 'Test government organization',
    sourceType: 'official-test-source',
    identity: {
      municipality: 'Santa Cruz',
      province: 'Laguna',
      region: 'Region IV-A',
      regionName: 'CALABARZON',
      municipalityPsgc: '0403426000',
      correspondenceCode: '043426000',
    },
    identityResolution: {
      observedLocation: 'Santa Cruz, Laguna',
      resolutionMethod: 'explicit-psgc',
      evidenceSourceIds: [],
      note: null,
    },
    categories: ['identity'],
    authority: 'primary-official',
    access: {
      state: 'reachable',
      checkedAt: '2026-09-04',
      httpStatus: 200,
      note: null,
    },
    reviewState: 'reviewed',
    ledgerState: 'listed',
    publishedAt: null,
    retrievedAt: '2026-09-04',
    lastVerifiedAt: '2026-09-04',
    archive: { filename: null, sha256: null },
    notes: 'Test record.',
    ...overrides,
  };
}

function makeRegistryFact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'matched-fact',
    label: 'Test fact',
    value: 'value',
    evidence: {
      sourceIds: ['test-source'],
      verification: 'single-source',
      assertionType: 'direct',
      note: null,
    },
    publication: { state: 'published' },
    freshness: {
      lastVerifiedAt: '2026-09-04',
      reviewCadenceDays: 365,
      validFrom: null,
      validUntil: null,
    },
    ...overrides,
  };
}

function makeCivicRegistry(facts: unknown[]) {
  return {
    schemaVersion: 2,
    municipality: {
      name: 'Santa Cruz',
      province: 'Laguna',
      psgc10: '0403426000',
    },
    facts,
  };
}

describe('validateSourceRecord', () => {
  it('accepts an explicit Santa Cruz PSGC source identity', () => {
    expect(validateSourceRecord(makeSource()).identity.municipalityPsgc).toBe(
      '0403426000'
    );
  });

  it('rejects a source record that omits its provenance URL', () => {
    const source = makeSource() as Record<string, unknown>;
    delete source.sourceUrl;
    expect(() => validateSourceRecord(source)).toThrow(/sourceUrl/i);
  });

  it('rejects wrong Santa Cruz PSGC', () => {
    expect(() =>
      validateSourceRecord(
        makeSource({
          identity: {
            ...makeSource().identity,
            municipalityPsgc: '0403419000' as '0403426000',
          },
        })
      )
    ).toThrow(/0403426000|municipalityPsgc/i);
  });

  it('rejects same-name municipality text', () => {
    expect(() =>
      validateSourceRecord(
        makeSource({
          sourceTitle: 'Santa Cruz audit report — Zambales',
        })
      )
    ).toThrow(/wrong municipality|zambales/i);
  });

  it('requires an access check date for reachable sources', () => {
    expect(() =>
      validateSourceRecord(
        makeSource({
          access: {
            state: 'reachable',
            checkedAt: null,
            httpStatus: null,
            note: null,
          },
        })
      )
    ).toThrow(/checkedAt/i);
  });

  it('allows not-checked access without a check date', () => {
    expect(
      validateSourceRecord(
        makeSource({
          access: {
            state: 'not-checked',
            checkedAt: null,
            httpStatus: null,
            note: null,
          },
        })
      ).access.state
    ).toBe('not-checked');
  });
});

describe('validateSourceRegistry', () => {
  it('rejects duplicate source IDs', () => {
    expect(() =>
      validateSourceRegistry({
        schemaVersion: 2,
        sources: [makeSource(), makeSource()],
      })
    ).toThrow(/Duplicate sourceId/);
  });

  it('rejects future retrieval dates', () => {
    expect(() =>
      validateSourceRegistry(
        {
          schemaVersion: 2,
          sources: [
            makeSource({
              retrievedAt: '2026-09-06',
              lastVerifiedAt: '2026-09-06',
            }),
          ],
        },
        '2026-09-05'
      )
    ).toThrow(/Future source date/);
  });

  it('rejects verification before retrieval', () => {
    expect(() =>
      validateSourceRegistry({
        schemaVersion: 2,
        sources: [
          makeSource({
            retrievedAt: '2026-09-05',
            lastVerifiedAt: '2026-09-04',
          }),
        ],
      })
    ).toThrow(/verification.*retrieval/i);
  });

  it('rejects unknown identity evidence source IDs', () => {
    expect(() =>
      validateSourceRegistry({
        schemaVersion: 2,
        sources: [
          makeSource({
            identityResolution: {
              ...makeSource().identityResolution,
              evidenceSourceIds: ['missing-source'],
            },
          }),
        ],
      })
    ).toThrow(/Unknown identity evidence sourceId/i);
  });
});

describe('validateCivicRegistry', () => {
  const source = makeSource();

  it('accepts a published fact backed by one reviewed primary source', () => {
    expect(
      validateCivicRegistry(
        makeCivicRegistry([makeRegistryFact()]),
        [source],
        '2026-09-04'
      ).facts
    ).toHaveLength(1);
  });

  it('rejects a fact whose source ID is unknown', () => {
    expect(() =>
      validateCivicRegistry(
        makeCivicRegistry([
          makeRegistryFact({
            evidence: {
              sourceIds: ['does-not-exist'],
              verification: 'single-source',
              assertionType: 'direct',
              note: null,
            },
          }),
        ]),
        [source],
        '2026-09-04'
      )
    ).toThrow(/unknown sourceId/i);
  });

  it('allows an unverified staged observation without publishing it', () => {
    const result = validateCivicRegistry(
      makeCivicRegistry([
        makeRegistryFact({
          evidence: {
            sourceIds: ['test-source'],
            verification: 'unverified',
            assertionType: 'direct',
            note: null,
          },
          publication: { state: 'staged' },
        }),
      ]),
      [source],
      '2026-09-04'
    );
    expect(result.facts[0].publication.state).toBe('staged');
  });

  it('rejects a disputed fact marked published', () => {
    expect(() =>
      validateCivicRegistry(
        makeCivicRegistry([
          makeRegistryFact({
            evidence: {
              sourceIds: ['test-source'],
              verification: 'disputed',
              assertionType: 'direct',
              note: null,
            },
          }),
        ]),
        [source],
        '2026-09-04'
      )
    ).toThrow(/not evidence-eligible/i);
  });

  it('rejects single-source publication from a non-primary source', () => {
    const secondary = makeSource({ authority: 'secondary-reputable' });
    expect(() =>
      validateCivicRegistry(
        makeCivicRegistry([makeRegistryFact()]),
        [secondary],
        '2026-09-04'
      )
    ).toThrow(/not evidence-eligible/i);
  });
});
