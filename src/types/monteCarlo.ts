// Rates are decimals (0.10 = 10% a.a.). With annualInflation, targetAmount is in today's money
// and the API returns it inflated to the horizon as nominalTarget; every other amount is nominal.
export interface MonteCarloRequest {
  initialAmount: number
  monthlyContribution: number
  expectedAnnualReturn: number
  annualVolatility: number
  years: number
  iterations?: number
  targetAmount?: number | null
  annualInflation?: number | null
  contributionGrowthRate?: number | null
  seed?: number | null
}

export interface MonteCarloPercentiles {
  p5: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  p95: number
}

export interface MonteCarloYearBand {
  year: number
  p5: number
  p25: number
  p50: number
  p75: number
  p95: number
  expected: number
  contributed: number
}

export interface MonteCarloHistogramBin {
  lower: number
  upper: number
  count: number
}

export interface MonteCarloResponse {
  totalContributed: number
  expectedFinalValue: number
  mean: number
  percentiles: MonteCarloPercentiles
  yearlyBands: MonteCarloYearBand[]
  nominalTarget?: number
  probabilityOfReachingTarget?: number
  probabilityBelowContributed: number
  histogram: MonteCarloHistogramBin[]
  /** Paths above P99, left out of the histogram bins. */
  histogramOverflowCount: number
  iterations: number
  seed: number
}
