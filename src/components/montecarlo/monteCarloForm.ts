import type { MonteCarloRequest } from '@/types/monteCarlo'

/** Percent fields are typed as % by the user (10 = 10% a.a.). */
export interface MonteCarloForm {
  initialAmount: number | null
  monthlyContribution: number | null
  expectedAnnualReturnPct: number | null
  annualVolatilityPct: number | null
  years: number | null
  iterations: number
  targetAmount: number | null
  annualInflationPct: number | null
  contributionGrowthPct: number | null
  seed: number | null
}

/** Mirrors the backend cap on iterations × months. */
export const MAX_MONTH_STEPS = 10_000_000

export type MonteCarloFormErrors = Partial<Record<keyof MonteCarloForm, string>>

function outside(v: number | null, min: number, max: number) {
  return v != null && (v < min || v > max)
}

export function validateForm(f: MonteCarloForm): MonteCarloFormErrors {
  const e: MonteCarloFormErrors = {}
  if (f.initialAmount == null || f.initialAmount < 0) e.initialAmount = 'Informe um valor ≥ 0'
  if (f.monthlyContribution == null || f.monthlyContribution < 0) e.monthlyContribution = 'Informe um valor ≥ 0'
  if (!e.initialAmount && !e.monthlyContribution && f.initialAmount === 0 && f.monthlyContribution === 0) {
    e.monthlyContribution = 'Valor inicial ou aporte mensal deve ser maior que zero'
  }
  if (f.expectedAnnualReturnPct == null || outside(f.expectedAnnualReturnPct, -50, 100)) {
    e.expectedAnnualReturnPct = 'Entre -50% e 100%'
  }
  if (f.annualVolatilityPct == null || outside(f.annualVolatilityPct, 0, 150)) {
    e.annualVolatilityPct = 'Entre 0% e 150%'
  }
  if (f.years == null || !Number.isInteger(f.years) || outside(f.years, 1, 60)) {
    e.years = 'Inteiro entre 1 e 60'
  } else if (f.iterations * f.years * 12 > MAX_MONTH_STEPS) {
    e.years = `Com ${f.iterations.toLocaleString('pt-BR')} simulações, o horizonte máximo é de ${Math.floor(MAX_MONTH_STEPS / (f.iterations * 12))} anos`
  }
  if (f.targetAmount != null && f.targetAmount <= 0) e.targetAmount = 'Meta deve ser maior que zero'
  if (outside(f.annualInflationPct, -10, 100)) e.annualInflationPct = 'Entre -10% e 100%'
  if (outside(f.contributionGrowthPct, -50, 100)) e.contributionGrowthPct = 'Entre -50% e 100%'
  if (f.seed != null && (!Number.isSafeInteger(f.seed) || f.seed < 0)) e.seed = 'Inteiro ≥ 0'
  return e
}

const pct = (v: number | null) => (v == null ? null : v / 100)

/** Assumes {@link validateForm} returned no errors. */
export function toRequest(f: MonteCarloForm): MonteCarloRequest {
  return {
    initialAmount: f.initialAmount!,
    monthlyContribution: f.monthlyContribution!,
    expectedAnnualReturn: f.expectedAnnualReturnPct! / 100,
    annualVolatility: f.annualVolatilityPct! / 100,
    years: f.years!,
    iterations: f.iterations,
    targetAmount: f.targetAmount,
    annualInflation: pct(f.annualInflationPct),
    contributionGrowthRate: pct(f.contributionGrowthPct),
    seed: f.seed,
  }
}

/**
 * True when the form no longer matches the request that produced the shown result. Pinning the
 * seed the backend reported for that run (via "fixar semente") does not count as a change.
 */
export function isResultStale(f: MonteCarloForm, sent: MonteCarloRequest, usedSeed: number): boolean {
  const current = toRequest(f)
  if (current.seed === usedSeed) current.seed = sent.seed
  return JSON.stringify(current) !== JSON.stringify(sent)
}
