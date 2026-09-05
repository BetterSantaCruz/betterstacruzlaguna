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
    categories: ['identity', 'statistics'],
    authority: 'primary-official',
    access: {
      state: 'reachable',
      checkedAt: '2026-09-05',
      httpStatus: 200,
      note: null,
    },
    reviewState: 'reviewed',
    ledgerState: 'listed',
    publishedAt: null,
    retrievedAt: '2026-09-05',
    lastVerifiedAt: '2026-09-05',
    archive: { filename: null, sha256: null },
    notes: 'Verified municipality baseline.',
    ...overrides,
  };
}

describe('filterSourceRecords', () => {
  const sources = [
    makeSource(),
    makeSource({
      sourceId: 'source-2',
      sourceTitle: 'SB legislation portal lead',
      sourceOrganization: 'Sangguniang Bayan of Santa Cruz, Laguna',
      sourceType: 'official-legislative-website',
      categories: ['legislation'],
      access: {
        state: 'partially-rendered',
        checkedAt: '2026-09-05',
        httpStatus: null,
        note: null,
      },
      reviewState: 'needs-review',
      notes: 'Needs characterization before collection.',
    }),
    makeSource({
      sourceId: 'source-3',
      sourceTitle: 'BetterGov index',
      sourceOrganization: 'BetterGov.ph',
      authority: 'civic-index',
      categories: ['transparency'],
    }),
  ];

  it('filters by review state', () => {
    expect(
      filterSourceRecords(sources, { status: 'needs-review' }).map(
        source => source.sourceId
      )
    ).toEqual(['source-2']);
  });

  it('filters independent authority and access dimensions', () => {
    expect(
      filterSourceRecords(sources, { authority: 'civic-index' }).map(
        source => source.sourceId
      )
    ).toEqual(['source-3']);
    expect(
      filterSourceRecords(sources, { access: 'partially-rendered' }).map(
        source => source.sourceId
      )
    ).toEqual(['source-2']);
  });

  it('searches source title, organization, categories, state, and notes', () => {
    expect(
      filterSourceRecords(sources, { query: 'characterization' }).map(
        source => source.sourceId
      )
    ).toEqual(['source-2']);
  });
});
