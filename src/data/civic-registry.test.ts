import { describe, expect, it } from 'vitest';

import civicRegistry from './civic-registry.json';
import sourceRegistry from './sources/source-registry.json';
import {
  validateCivicRegistry,
  validateSourceRegistry,
} from '@/lib/provenance';

describe('Santa Cruz civic registry', () => {
  it('promotes only the verified PSA and DBM baseline facts', () => {
    const sources = validateSourceRegistry(sourceRegistry);
    const registry = validateCivicRegistry(
      civicRegistry,
      sources,
      '2026-09-05'
    );
    const facts = new Map(registry.facts.map(fact => [fact.id, fact]));

    expect(facts.get('sc-psa-psgc-code')).toMatchObject({
      value: '0403426000',
      sourceId: 'sc-psa-psgc',
      verificationStatus: 'verified',
    });
    expect(facts.get('sc-psa-correspondence-code')).toMatchObject({
      value: '043426000',
      sourceId: 'sc-psa-psgc',
      verificationStatus: 'verified',
    });
    expect(facts.get('sc-psa-population-2024')).toMatchObject({
      value: 126844,
      sourceId: 'sc-psa-psgc',
      verificationStatus: 'verified',
    });
    expect(facts.get('sc-psa-barangay-count')).toMatchObject({
      value: 26,
      sourceId: 'sc-psa-psgc',
      verificationStatus: 'verified',
    });
    expect(facts.get('sc-mayor-2025')).toMatchObject({
      value: 'Joseph Kris Benjamin B. Agarao',
      sourceId: 'sc-dbm',
      verificationStatus: 'verified',
    });
    expect(facts.get('sc-vice-mayor-2025')).toMatchObject({
      value: 'Laarni A. Malibiran',
      sourceId: 'sc-dbm',
      verificationStatus: 'verified',
    });
  });
});
