import { describe, expect, it } from 'vitest'
import { isResultStale, toRequest, validateForm, type MonteCarloForm } from './monteCarloForm'

const base: MonteCarloForm = {
  initialAmount: 10_000,
  monthlyContribution: 1_000,
  expectedAnnualReturnPct: 10,
  annualVolatilityPct: 15,
  years: 20,
  iterations: 5000,
  targetAmount: null,
  annualInflationPct: null,
  contributionGrowthPct: null,
  seed: null,
}

describe('validateForm', () => {
  it('accepts a typical form', () => {
    expect(validateForm(base)).toEqual({})
  })

  it('requires the mandatory fields', () => {
    const e = validateForm({ ...base, initialAmount: null, expectedAnnualReturnPct: null, years: null })
    expect(Object.keys(e).sort()).toEqual(['expectedAnnualReturnPct', 'initialAmount', 'years'])
  })

  it('rejects a run with nothing invested', () => {
    expect(validateForm({ ...base, initialAmount: 0, monthlyContribution: 0 }).monthlyContribution).toBeDefined()
  })

  it('enforces bounds', () => {
    const e = validateForm({
      ...base,
      expectedAnnualReturnPct: -60,
      annualVolatilityPct: 151,
      years: 61,
      targetAmount: 0,
      annualInflationPct: -11,
      contributionGrowthPct: 101,
      seed: -1,
    })
    expect(Object.keys(e)).toHaveLength(7)
    expect(validateForm({ ...base, years: 2.5 }).years).toBeDefined()
  })

  it('caps iterations × months like the backend', () => {
    // 20000 × 41 × 12 = 9.84M ok; × 42 = 10.08M too much → max 41 years
    expect(validateForm({ ...base, iterations: 20_000, years: 41 })).toEqual({})
    expect(validateForm({ ...base, iterations: 20_000, years: 42 }).years).toContain('41 anos')
  })
})

describe('toRequest', () => {
  it('converts percents to decimals and keeps optionals null', () => {
    expect(
      toRequest({ ...base, annualInflationPct: 4.5, contributionGrowthPct: 3, targetAmount: 1e6, seed: 42 }),
    ).toEqual({
      initialAmount: 10_000,
      monthlyContribution: 1_000,
      expectedAnnualReturn: 0.1,
      annualVolatility: 0.15,
      years: 20,
      iterations: 5000,
      targetAmount: 1e6,
      annualInflation: 0.045,
      contributionGrowthRate: 0.03,
      seed: 42,
    })
    const r = toRequest(base)
    expect(r.annualInflation).toBeNull()
    expect(r.contributionGrowthRate).toBeNull()
  })
})

describe('isResultStale', () => {
  const sent = toRequest(base)

  it('is fresh while the form matches the request', () => {
    expect(isResultStale({ ...base }, sent, 42)).toBe(false)
  })

  it('is fresh after pinning the seed the run used', () => {
    expect(isResultStale({ ...base, seed: 42 }, sent, 42)).toBe(false)
  })

  it('is stale after any parameter or a different seed changes', () => {
    expect(isResultStale({ ...base, years: 21 }, sent, 42)).toBe(true)
    expect(isResultStale({ ...base, annualVolatilityPct: 16 }, sent, 42)).toBe(true)
    expect(isResultStale({ ...base, targetAmount: 1 }, sent, 42)).toBe(true)
    expect(isResultStale({ ...base, seed: 7 }, sent, 42)).toBe(true)
  })

  it('is stale when a pinned-seed run gets its seed cleared', () => {
    expect(isResultStale(base, toRequest({ ...base, seed: 42 }), 42)).toBe(true)
  })
})
