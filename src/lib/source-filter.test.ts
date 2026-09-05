import { describe, expect, it } from 'vitest';

import type { SourceRecord } from './provenance';
import { filterSourceRecords } from './source-filter';

function makeSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    sourceId: 'source-1',
    sourceTitle: 'PSA source record',
    sourceUrl: 'https://example.com/source',
    sourceOrganization: 'Philippine Statistics Authority',
    sourceType: 'official-statistics-portal',
    location: 'Santa Cruz, Laguna',
    publishedAt: null,
    retrievedAt: '2026-09-05',
    lastVerifiedAt: '2026-09-05',
    municipality: 'Santa Cruz',
    categories: ['identity', 'statistics'],
    confidence: 'high',
    verificationStatus: 'verified',
    localArchiveFilename: null,
    notes: 'Verified municipality baseline.',
    ...overrides,
  };
}

describe('filterSourceRecords', () => {
  const sources = [
    makeSource(),
    makeSource({
      sourceId: 'source-2',
      sourceTitle: 'Observed local portal lead',
      sourceOrganization: 'Sangguniang Bayan of Santa Cruz, Laguna',
      sourceType: 'official-municipal-portal',
      categories: ['government'],
      verificationStatus: 'observed',
      notes: 'Needs corroboration before publication.',
    }),
    makeSource({
      sourceId: 'source-3',
      sourceTitle: 'Pagsanjan source record',
      sourceOrganization: 'Municipality of Pagsanjan',
      location: 'Pagsanjan, Laguna',
      municipality: 'Pagsanjan',
      categories: ['collaboration'],
    }),
  ];

  it('filters by municipality and evidence status together', () => {
    expect(
      filterSourceRecords(sources, {
        scope: 'Santa Cruz',
        status: 'observed',
      }).map(source => source.sourceId)
    ).toEqual(['source-2']);
  });

  it('searches source title, organization, categories, and notes', () => {
    expect(
      filterSourceRecords(sources, {
        query: 'corroboration',
      }).map(source => source.sourceId)
    ).toEqual(['source-2']);
  });
});
