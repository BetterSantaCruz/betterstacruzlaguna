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
      }),
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
        '2026-09-04',
      ),
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
        '2026-09-04',
      ).facts,
    ).toHaveLength(1);
  });

  it('rejects duplicate source IDs before civic data is validated', () => {
    expect(() => validateSourceRegistry({ sources: [source, source] })).toThrow(
      /Duplicate sourceId/,
    );
  });
});
