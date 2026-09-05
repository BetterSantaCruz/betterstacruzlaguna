import { describe, expect, it } from 'vitest';

import barangaysData from './directory/barangays.json';
import executiveData from './directory/executive.json';
import populationData from './statistics/population.json';

const expectedBarangays = [
  ['Alipit', '0403426001', 'Rural', 382],
  ['Bagumbayan', '0403426002', 'Urban', 13615],
  ['Bubukal', '0403426003', 'Urban', 7244],
  ['Calios', '0403426004', 'Urban', 10472],
  ['Duhat', '0403426005', 'Urban', 7555],
  ['Gatid', '0403426006', 'Urban', 10656],
  ['Jasaan', '0403426007', 'Rural', 938],
  ['Labuin', '0403426008', 'Rural', 4748],
  ['Malinao', '0403426009', 'Rural', 679],
  ['Oogong', '0403426010', 'Urban', 4517],
  ['Pagsawitan', '0403426011', 'Urban', 10514],
  ['Palasan', '0403426012', 'Rural', 4132],
  ['Patimbao', '0403426013', 'Urban', 9542],
  ['Barangay I', '0403426014', 'Rural', 1503],
  ['Barangay II', '0403426015', 'Urban', 1209],
  ['Barangay III', '0403426016', 'Urban', 386],
  ['Barangay IV', '0403426017', 'Urban', 1299],
  ['Barangay V', '0403426018', 'Urban', 715],
  ['San Jose', '0403426019', 'Rural', 3012],
  ['San Juan', '0403426020', 'Rural', 4149],
  ['San Pablo Norte', '0403426021', 'Rural', 2710],
  ['San Pablo Sur', '0403426022', 'Rural', 3237],
  ['Santisima Cruz', '0403426023', 'Urban', 9751],
  ['Santo Angel Central', '0403426024', 'Rural', 4551],
  ['Santo Angel Norte', '0403426025', 'Urban', 5412],
  ['Santo Angel Sur', '0403426026', 'Urban', 3916],
] as const;

describe('Santa Cruz canonical civic data', () => {
  it('contains the complete PSA barangay set with stable identity fields', () => {
    expect(barangaysData).toHaveLength(expectedBarangays.length);

    const actual = new Map(
      (barangaysData as Array<Record<string, unknown>>).map(barangay => [
        barangay.barangay_name,
        barangay,
      ])
    );

    for (const [
      name,
      psgc10,
      classification,
      population,
    ] of expectedBarangays) {
      expect(actual.get(name)).toMatchObject({
        barangay_name: name,
        psgc10,
        classification,
        population,
        sourceId: 'sc-psa-psgc',
        asOf: '2025-07-31',
        referenceYear: 2024,
      });
    }
  });

  it('contains only the supported top executives and withholds an unsourced term', () => {
    expect(executiveData).toHaveLength(2);
    expect(executiveData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Joseph Kris Benjamin B. Agarao',
          role: 'Municipal Mayor',
          term: null,
          sourceId: 'sc-dbm',
          fieldProvenance: expect.objectContaining({
            name: expect.objectContaining({ sourceIds: ['sc-dbm'] }),
            role: expect.objectContaining({ sourceIds: ['sc-dbm'] }),
          }),
        }),
        expect.objectContaining({
          name: 'Laarni A. Malibiran',
          role: 'Municipal Vice Mayor',
          term: null,
          sourceId: 'sc-dbm',
          fieldProvenance: expect.objectContaining({
            name: expect.objectContaining({ sourceIds: ['sc-dbm'] }),
            role: expect.objectContaining({ sourceIds: ['sc-dbm'] }),
          }),
        }),
      ])
    );
  });

  it('records population as 2024 POPCEN and keeps the barangay series aligned', () => {
    expect(populationData.meta).toMatchObject({
      sourceId: 'sc-psa-psgc',
      referenceYear: 2024,
      asOf: '2025-07-31',
    });
    expect(populationData.municipality.history).toEqual([
      { year: 2024, population: 126844 },
    ]);
    expect(populationData.barangays).toHaveLength(expectedBarangays.length);
  });
});
