import { describe, expect, it } from 'vitest';

import sourceRegistry from '@/data/sources/source-registry.json';

import { validateSourceRegistry } from './provenance';

const sources = validateSourceRegistry(sourceRegistry, '2026-09-05');

function sourceById(sourceId: string) {
  const source = sources.find(candidate => candidate.sourceId === sourceId);
  if (!source) throw new Error(`Missing test source: ${sourceId}`);
  return source;
}

describe('Santa Cruz source registry v2', () => {
  it('contains only explicit Santa Cruz, Laguna PSGC identities', () => {
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source.identity).toMatchObject({
        municipality: 'Santa Cruz',
        province: 'Laguna',
        municipalityPsgc: '0403426000',
      });
    }
  });

  it('records the directly inspectable PSA municipality page as reviewed primary evidence', () => {
    expect(sourceById('sc-psa-psgc')).toMatchObject({
      sourceUrl: 'https://psa.gov.ph/classification/psgc/barangays/0403426000',
      authority: 'primary-official',
      access: { state: 'reachable' },
      reviewState: 'reviewed',
      retrievedAt: '2026-09-05',
      lastVerifiedAt: '2026-09-05',
    });
  });

  it('records the DBM directory as reviewed primary top-office evidence', () => {
    expect(sourceById('sc-dbm')).toMatchObject({
      sourceUrl:
        'https://www.dbm.gov.ph/wp-content/uploads/AboutDBM/2026-Philippine-Government-Directory-of-Agencies-and-Officials.pdf',
      authority: 'primary-official',
      reviewState: 'reviewed',
      retrievedAt: '2026-09-05',
    });
  });

  it('labels the DPWH municipal-hall document as reviewed planning evidence', () => {
    const source = sourceById('sc-dpwh');
    expect(source).toMatchObject({
      authority: 'primary-official',
      reviewState: 'reviewed',
      access: { state: 'reachable' },
    });
    expect(source.notes).toMatch(/planning|proposed|not.*completed/i);
  });

  it('keeps unofficial election returns explicitly secondary', () => {
    expect(sourceById('sc-rappler-2025')).toMatchObject({
      authority: 'secondary-reputable',
      reviewState: 'reviewed',
    });
  });

  it('keeps SB legislation sources listed but under review', () => {
    expect(sourceById('sc-sb-ordinances')).toMatchObject({
      authority: 'primary-official',
      access: { state: 'partially-rendered' },
      reviewState: 'needs-review',
      ledgerState: 'listed',
    });
    expect(sourceById('sc-sb-resolutions')).toMatchObject({
      authority: 'primary-official',
      access: { state: 'partially-rendered' },
      reviewState: 'needs-review',
      ledgerState: 'listed',
    });
  });

  it('does not expose Pagsanjan records in the production registry', () => {
    expect(sources.some(source => source.sourceId.startsWith('pg-'))).toBe(false);
  });
});
