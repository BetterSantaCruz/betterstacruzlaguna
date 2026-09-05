export interface PopulationPoint {
  year: number;
  population: number;
}

export interface PopulationGrowthRate {
  period: string;
  rate: number;
}

export function getLatestPopulation(
  history: readonly PopulationPoint[]
): PopulationPoint | null {
  return history.length > 0 ? history[history.length - 1] : null;
}

export function getGrowthRate(
  growthRates: readonly PopulationGrowthRate[],
  period: string
): number | null {
  return growthRates.find(rate => rate.period === period)?.rate ?? null;
}
