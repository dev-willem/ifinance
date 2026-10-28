export type RiskInputType = 'RETURNS' | 'PRICES'
export type RiskPeriodicity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'

export interface RiskMetricsRequest {
  values: number[]
  inputType: RiskInputType
  benchmarkValues?: number[]
  periodicity: RiskPeriodicity
  /** Decimal (0.1 = 10% a.a.) */
  riskFreeAnnualRate?: number
  /** Decimal (0.95) */
  confidenceLevel?: number
}

/** All rates are decimals; null = not defined for the series (e.g. zero volatility). */
export interface RiskBenchmarkMetrics {
  cumulativeReturn: number | null
  annualizedReturn: number | null
  annualizedVolatility: number | null
  beta: number | null
  jensensAlphaAnnualized: number | null
  correlation: number | null
  rSquared: number | null
  trackingErrorAnnualized: number | null
  informationRatio: number | null
}

export interface RiskMetricsResponse {
  periods: number
  periodsPerYear: number
  cumulativeReturn: number | null
  annualizedReturn: number | null
  meanPeriodReturn: number | null
  periodVolatility: number | null
  annualizedVolatility: number | null
  riskFreePeriodRate: number | null
  sharpeRatio: number | null
  downsideDeviationAnnualized: number | null
  sortinoRatio: number | null
  maxDrawdown: number | null
  /** Indices on the wealth index: 0 = start, i = after the i-th return */
  drawdownPeakIndex: number | null
  drawdownTroughIndex: number | null
  drawdownRecoveryIndex: number | null
  calmarRatio: number | null
  confidenceLevel: number | null
  historicalVar: number | null
  historicalCvar: number | null
  benchmark: RiskBenchmarkMetrics | null
  wealthIndex: (number | null)[]
  drawdownSeries: (number | null)[]
  benchmarkWealthIndex: (number | null)[] | null
}
