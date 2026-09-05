import { describe, expect, it } from 'vitest';

import { getGrowthRate, getLatestPopulation } from './population';

describe('population helpers', () => {
  it('returns the latest population point without inventing one', () => {
    expect(
      getLatestPopulation([
        { year: 2020, population: 120000 },
        { year: 2024, population: 126844 },
      ])
    ).toEqual({ year: 2024, population: 126844 });
    expect(getLatestPopulation([])).toBeNull();
  });

  it('returns null when a requested growth period is not present', () => {
    expect(getGrowthRate([], '2020-2024')).toBeNull();
    expect(
      getGrowthRate([{ period: '2020-2024', rate: 1.25 }], '2020-2024')
    ).toBe(1.25);
  });
});
