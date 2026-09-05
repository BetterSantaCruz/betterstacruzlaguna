import { describe, expect, it } from 'vitest';

import civicRegistry from './civic-registry.json';
import sourceRegistry from './sources/source-registry.json';
import {
  validateCivicRegistry,
  validateSourceRegistry,
} from '@/lib/provenance';

describe('Santa Cruz civic registry', () => {
  it('keeps the verified PSA/DBM/PhilGEPS baseline published and source-linked', () => {
    const sources = validateSourceRegistry(sourceRegistry, '2026-09-05');
    const registry = validateCivicRegistry(
      civicRegistry,
      sources,
      '2026-09-05'
    );
    const facts = new Map(registry.facts.map(fact => [fact.id, fact]));

    expect(facts.get('sc-psa-psgc-code')).toMatchObject({
      value: '0403426000',
      evidence: {
        sourceIds: ['sc-psa-psgc'],
        verification: 'single-source',
        assertionType: 'direct',
      },
      publication: { state: 'published' },
    });
    expect(facts.get('sc-psa-correspondence-code')).toMatchObject({
      value: '043426000',
      evidence: { sourceIds: ['sc-psa-psgc'] },
      publication: { state: 'published' },
    });
    expect(facts.get('sc-psa-population-2024')).toMatchObject({
      value: 126844,
      evidence: { sourceIds: ['sc-psa-psgc'] },
      publication: { state: 'published' },
    });
    expect(facts.get('sc-psa-barangay-count')).toMatchObject({
      value: 26,
      evidence: { sourceIds: ['sc-psa-psgc'] },
      publication: { state: 'published' },
    });
    expect(facts.get('sc-mayor-2025')).toMatchObject({
      value: 'Joseph Kris Benjamin B. Agarao',
      evidence: { sourceIds: ['sc-dbm'] },
      publication: { state: 'published' },
    });
    expect(facts.get('sc-vice-mayor-2025')).toMatchObject({
      value: 'Laarni A. Malibiran',
      evidence: { sourceIds: ['sc-dbm'] },
      publication: { state: 'published' },
    });
    expect(facts.get('sc-procuring-entity-name')).toMatchObject({
      value: 'MUNICIPALITY OF SANTA CRUZ, LAGUNA',
      evidence: { sourceIds: ['sc-philgeps-11459794'] },
      publication: { state: 'published' },
    });
  });

  it('keeps the SB-reported barangay count staged rather than promoting the observation', () => {
    const sources = validateSourceRegistry(sourceRegistry, '2026-09-05');
    const registry = validateCivicRegistry(
      civicRegistry,
      sources,
      '2026-09-05'
    );
    const fact = registry.facts.find(
      candidate => candidate.id === 'sc-sb-reported-barangay-count'
    );

    expect(fact).toMatchObject({
      value: 26,
      evidence: {
        sourceIds: ['sc-sb-about'],
        verification: 'unverified',
      },
      publication: { state: 'staged' },
    });
  });
});
