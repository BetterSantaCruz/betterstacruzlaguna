import { describe, expect, it } from 'vitest';

import sourceRegistry from '@/data/sources/source-registry.json';

import { validateSourceRegistry } from './provenance';

const sources = validateSourceRegistry(sourceRegistry);

function sourceById(sourceId: string) {
  const source = sources.find(candidate => candidate.sourceId === sourceId);
  if (!source) throw new Error(`Missing test source: ${sourceId}`);
  return source;
}

describe('Santa Cruz source registry', () => {
  it('records the directly inspectable PSA municipality page as verified', () => {
    expect(sourceById('sc-psa-psgc')).toMatchObject({
      sourceUrl: 'https://psa.gov.ph/classification/psgc/barangays/0403426000',
      verificationStatus: 'verified',
      retrievedAt: '2026-09-05',
      lastVerifiedAt: '2026-09-05',
    });
  });

  it('records the 2026 DBM directory as the current top-office source', () => {
    expect(sourceById('sc-dbm')).toMatchObject({
      sourceUrl:
        'https://www.dbm.gov.ph/wp-content/uploads/AboutDBM/2026-Philippine-Government-Directory-of-Agencies-and-Officials.pdf',
      verificationStatus: 'verified',
      retrievedAt: '2026-09-05',
    });
  });

  it('labels the DPWH municipal-hall document as planning evidence', () => {
    const source = sourceById('sc-dpwh');
    expect(source).toMatchObject({
      sourceUrl:
        'https://www.dpwh.gov.ph/dpwh/sites/default/files/GAA/APP/market_scoping_-_rehabilitation_of_municipal_hall_of_santa_cruz_laguna.pdf',
      verificationStatus: 'verified',
      retrievedAt: '2026-09-05',
    });
    expect(source.notes).toMatch(/planning|proposed|not.*completed/i);
  });

  it('keeps unofficial election returns explicitly secondary', () => {
    expect(sourceById('sc-rappler-2025')).toMatchObject({
      verificationStatus: 'secondary',
      confidence: 'medium',
    });
  });
});
