import { describe, expect, it } from 'vitest'
import type { RegimeResult } from '@/types/tax'
import { barWidths, buildTaxMatrix, rankEligible, salesTaxOf } from './taxHelpers'

function regime(partial: Partial<RegimeResult> & Pick<RegimeResult, 'regime'>): RegimeResult {
  return { eligible: true, breakdown: [], total: 0, effectiveRate: 0, netProfit: 0, notes: [], ...partial }
}

describe('barWidths', () => {
  it('scales values relative to the largest', () => {
    expect(barWidths([50, 100, 25])).toEqual([50, 100, 25])
  })

  it('treats null, negative and non-finite values as zero', () => {
    expect(barWidths([null, -10, Number.NaN, Infinity, 40])).toEqual([0, 0, 0, 0, 100])
  })

  it('returns zeros when every value is zero', () => {
    expect(barWidths([0, 0])).toEqual([0, 0])
    expect(barWidths([])).toEqual([])
  })
})

describe('buildTaxMatrix', () => {
  it('orders rows by tax and leaves absent taxes as null', () => {
    const rows = buildTaxMatrix([
      regime({ regime: 'SIMPLES_NACIONAL', breakdown: [{ tax: 'ISS', share: 1, amount: 10 }] }),
      regime({
        regime: 'LUCRO_PRESUMIDO',
        breakdown: [
          { tax: 'ISS', share: 0.5, amount: 5 },
          { tax: 'IRPJ', share: 0.5, amount: 5 },
        ],
      }),
      regime({ regime: 'LUCRO_REAL', eligible: false, total: null }),
    ])

    expect(rows).toEqual([
      { tax: 'IRPJ', amounts: [null, 5, null] },
      { tax: 'ISS', amounts: [10, 5, null] },
    ])
  })
})

describe('rankEligible', () => {
  it('drops ineligible regimes and sorts by total', () => {
    const ranked = rankEligible([
      regime({ regime: 'SIMPLES_NACIONAL', eligible: false, total: null }),
      regime({ regime: 'LUCRO_PRESUMIDO', total: 300 }),
      regime({ regime: 'LUCRO_REAL', total: 200 }),
    ])

    expect(ranked.map((r) => r.regime)).toEqual(['LUCRO_REAL', 'LUCRO_PRESUMIDO'])
  })
})

describe('salesTaxOf', () => {
  it('maps commerce and industry to ICMS, services to ISS', () => {
    expect(salesTaxOf('COMMERCE')).toBe('ICMS')
    expect(salesTaxOf('INDUSTRY')).toBe('ICMS')
    expect(salesTaxOf('SERVICES_ANNEX_V')).toBe('ISS')
  })
})
