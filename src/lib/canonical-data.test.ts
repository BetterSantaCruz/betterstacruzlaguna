import { describe, expect, it } from 'vitest';

import barangaysData from '@/data/directory/barangays.json';
import executiveData from '@/data/directory/executive.json';
import populationData from '@/data/statistics/population.json';
import sourceRegistry from '@/data/sources/source-registry.json';

import { validateSourceRegistry } from './provenance';
import {
  validateBarangayDirectory,
  validateExecutiveDirectory,
  validatePopulationData,
} from './canonical-data';

const sources = validateSourceRegistry(sourceRegistry, '2026-09-05');
const barangayIds = barangaysData.map(barangay => barangay.psgc10);

describe('canonical Santa Cruz data validation', () => {
  it('accepts the published PSA barangay baseline', () => {
    expect(
      validateBarangayDirectory(barangaysData, sources, '2026-09-05')
    ).toHaveLength(26);
  });

  it('rejects a barangay code outside the Santa Cruz PSGC family', () => {
    const candidate = barangaysData.map(record => ({ ...record }));
    candidate[0].psgc10 = '0403429001';

    expect(() =>
      validateBarangayDirectory(candidate, sources, '2026-09-05')
    ).toThrow('Santa Cruz PSGC');
  });

  it('rejects a canonical record whose provenance differs from its source', () => {
    const candidate = barangaysData.map(record => ({ ...record }));
    candidate[0].sourceUrl = 'https://example.com/not-psa';

    expect(() =>
      validateBarangayDirectory(candidate, sources, '2026-09-05')
    ).toThrow('Provenance mismatch');
  });

  it('accepts the reviewed primary executive baseline', () => {
    expect(
      validateExecutiveDirectory(executiveData, sources, '2026-09-05')
    ).toHaveLength(2);
  });

  it('rejects executive records when the linked source is no longer reviewed', () => {
    const candidateSources = sources.map(source =>
      source.sourceId === 'sc-dbm'
        ? { ...source, reviewState: 'needs-review' as const }
        : source
    );

    expect(() =>
      validateExecutiveDirectory(
        executiveData,
        candidateSources,
        '2026-09-05'
      )
    ).toThrow(/reviewed primary-official source/i);
  });

  it('rejects an executive term without field-level term provenance', () => {
    const candidate = executiveData.map(record => ({ ...record }));
    candidate[0] = { ...candidate[0], term: '2025–2028' };

    expect(() =>
      validateExecutiveDirectory(candidate, sources, '2026-09-05')
    ).toThrow(/term requires field-level provenance/i);
  });

  it('accepts population data whose barangay series reconcile to the municipality', () => {
    const validated = validatePopulationData(
      populationData,
      sources,
      barangayIds,
      '2026-09-05'
    );

    expect(validated.municipality.history.at(-1)?.population).toBe(126844);
  });

  it('rejects population data with a mismatched barangay total', () => {
    const candidate = {
      ...populationData,
      municipality: {
        ...populationData.municipality,
        history: populationData.municipality.history.map(point => ({
          ...point,
          population: point.population - 1,
        })),
      },
    };

    expect(() =>
      validatePopulationData(candidate, sources, barangayIds, '2026-09-05')
    ).toThrow('population total');
  });

  it('rejects population data whose barangay IDs drift from the directory', () => {
    const candidate = {
      ...populationData,
      barangays: populationData.barangays.map((barangay, index) =>
        index === 0 ? { ...barangay, id: '0403429001' } : barangay
      ),
    };

    expect(() =>
      validatePopulationData(candidate, sources, barangayIds, '2026-09-05')
    ).toThrow('barangay IDs');
  });
});
