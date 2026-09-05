import { describe, expect, it } from 'vitest';

import {
  validateCivicRegistry,
  validateSourceRecord,
  validateSourceRegistry,
} from './provenance';

describe('validateSourceRecord', () => {
  it('rejects a source record that omits its required provenance URL', () => {
    expect(() =>
      validateSourceRecord({
        sourceId: 'test-source',
        sourceTitle: 'Test source',
        sourceOrganization: 'Test organization',
        sourceType: 'official',
        location: 'Santa Cruz, Laguna',
        publishedAt: null,
        retrievedAt: '2026-09-04',
        lastVerifiedAt: '2026-09-04',
        municipality: 'Santa Cruz',
        categories: ['identity'],
        confidence: 'high',
        verificationStatus: 'verified',
        localArchiveFilename: null,
        notes: 'Test record',
      })
    ).toThrow(/sourceUrl/);
  });
});

describe('validateCivicRegistry', () => {
  const source = {
    sourceId: 'test-source',
    sourceTitle: 'Test source',
    sourceUrl: 'https://example.com/source',
    sourceOrganization: 'Test organization',
    sourceType: 'official',
    location: 'Santa Cruz, Laguna',
    publishedAt: null,
    retrievedAt: '2026-09-04',
    lastVerifiedAt: '2026-09-04',
    municipality: 'Santa Cruz' as const,
    categories: ['identity'],
    confidence: 'high' as const,
    verificationStatus: 'verified' as const,
    localArchiveFilename: null,
    notes: 'Test record',
  };

  it('rejects a fact whose source ID is not in the source registry', () => {
    expect(() =>
      validateCivicRegistry(
        {
          municipality: 'Santa Cruz',
          province: 'Laguna',
          region: 'Region IV-A (CALABARZON)',
          facts: [
            {
              id: 'missing-source-fact',
              label: 'Test fact',
              value: 'value',
              municipality: 'Santa Cruz',
              sourceId: 'does-not-exist',
              sourceTitle: 'Test source',
              sourceUrl: 'https://example.com/source',
              sourceOrganization: 'Test organization',
              publishedAt: null,
              retrievedAt: '2026-09-04',
              lastVerifiedAt: '2026-09-04',
              verificationStatus: 'verified',
            },
          ],
        },
        [source],
        '2026-09-04'
      )
    ).toThrow(/unknown sourceId/);
  });

  it('accepts a fact whose provenance matches its source record', () => {
    expect(
      validateCivicRegistry(
        {
          municipality: 'Santa Cruz',
          province: 'Laguna',
          region: 'Region IV-A (CALABARZON)',
          facts: [
            {
              id: 'matched-fact',
              label: 'Test fact',
              value: 'value',
              municipality: 'Santa Cruz',
              sourceId: source.sourceId,
              sourceTitle: source.sourceTitle,
              sourceUrl: source.sourceUrl,
              sourceOrganization: source.sourceOrganization,
              publishedAt: source.publishedAt,
              retrievedAt: source.retrievedAt,
              lastVerifiedAt: source.lastVerifiedAt,
              verificationStatus: source.verificationStatus,
            },
          ],
        },
        [source],
        '2026-09-04'
      ).facts
    ).toHaveLength(1);
  });

  it('rejects duplicate source IDs before civic data is validated', () => {
    expect(() => validateSourceRegistry({ sources: [source, source] })).toThrow(
      /Duplicate sourceId/
    );
  });

  it('rejects a source whose retrieval date is after the validation cutoff', () => {
    expect(() =>
      validateSourceRegistry(
        {
          sources: [{ ...source, retrievedAt: '2026-09-06' }],
        },
        '2026-09-05'
      )
    ).toThrow(/Future source date/);
  });

  it('rejects a source whose verification predates retrieval', () => {
    expect(() =>
      validateSourceRegistry({
        sources: [
          {
            ...source,
            retrievedAt: '2026-09-05',
            lastVerifiedAt: '2026-09-04',
          },
        ],
      })
    ).toThrow(/verification.*retrieval/i);
  });

  it('rejects a source published after it was retrieved', () => {
    expect(() =>
      validateSourceRegistry({
        sources: [
          {
            ...source,
            publishedAt: '2026-09-05T00:00:00+08:00',
            retrievedAt: '2026-09-04',
          },
        ],
      })
    ).toThrow(/publication.*retrieval/i);
  });

  it('rejects a Santa Cruz source that contains a same-name municipality', () => {
    expect(() =>
      validateSourceRegistry({
        sources: [
          {
            ...source,
            sourceTitle: 'Santa Cruz Compliance Audit Report 2024 — Zambales',
          },
        ],
      })
    ).toThrow(/wrong municipality|Zambales/i);
  });

  it('rejects non-web source URLs', () => {
    expect(() =>
      validateSourceRegistry({
        sources: [{ ...source, sourceUrl: 'ftp://example.com/source' }],
      })
    ).toThrow(/sourceUrl/);
  });

  it('rejects a civic fact whose source text identifies another Santa Cruz', () => {
    const wrongMunicipalitySource = {
      ...source,
      sourceTitle: 'Santa Cruz Compliance Audit Report 2024 — Zambales',
    };

    expect(() =>
      validateCivicRegistry(
        {
          municipality: 'Santa Cruz',
          province: 'Laguna',
          region: 'Region IV-A (CALABARZON)',
          facts: [
            {
              id: 'wrong-municipality-source',
              label: 'Test fact',
              value: 'value',
              municipality: 'Santa Cruz',
              sourceId: wrongMunicipalitySource.sourceId,
              sourceTitle: wrongMunicipalitySource.sourceTitle,
              sourceUrl: wrongMunicipalitySource.sourceUrl,
              sourceOrganization: wrongMunicipalitySource.sourceOrganization,
              publishedAt: wrongMunicipalitySource.publishedAt,
              retrievedAt: wrongMunicipalitySource.retrievedAt,
              lastVerifiedAt: wrongMunicipalitySource.lastVerifiedAt,
              verificationStatus: wrongMunicipalitySource.verificationStatus,
            },
          ],
        },
        [wrongMunicipalitySource],
        '2026-09-04'
      )
    ).toThrow(/wrong municipality|Zambales/i);
  });
});
