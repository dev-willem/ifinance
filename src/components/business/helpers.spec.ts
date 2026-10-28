import { describe, expect, it } from 'vitest'
import {
  breakEvenChartData,
  compositionSegments,
  incomeStatementRows,
  linearScale,
  percentToRate,
  valueDomain,
  waterfallBars,
} from './helpers'
import type { IncomeStatementResponse } from '@/types/business'

// Same worked example as the backend test: 100000 gross -> 13200 net income.
const dre: IncomeStatementResponse = {
  grossRevenue: 100000,
  salesDeductions: 10000,
  netRevenue: 90000,
  costOfGoodsSold: 40000,
  grossProfit: 50000,
  sellingExpenses: 5000,
  administrativeExpenses: 15000,
  otherOperatingExpenses: 2000,
  operatingExpenses: 22000,
  ebitda: 28000,
  depreciationAmortization: 3000,
  ebit: 25000,
  financialRevenue: 1000,
  financialExpenses: 6000,
  financialResult: -5000,
  earningsBeforeTax: 20000,
  incomeTax: 6800,
  netIncome: 13200,
}

describe('percentToRate', () => {
  it('strips float noise so rates fit the backend 10-decimal limit', () => {
    expect(14.3 / 100).not.toBe(0.143)
    expect(percentToRate(14.3)).toBe(0.143)
    expect(percentToRate(0.7)).toBe(0.007)
    expect(percentToRate(0)).toBe(0)
    expect(percentToRate(null)).toBeUndefined()
  })
})

describe('linearScale', () => {
  it('maps domain to range, including inverted ranges', () => {
    const y = linearScale(0, 100, 200, 0)
    expect(y(0)).toBe(200)
    expect(y(50)).toBe(100)
    expect(y(100)).toBe(0)
  })

  it('does not divide by zero on a degenerate domain', () => {
    expect(linearScale(5, 5, 10, 20)(5)).toBe(10)
  })
})

describe('valueDomain', () => {
  it('always includes zero', () => {
    expect(valueDomain([10, 20])).toEqual([0, 20])
    expect(valueDomain([-5, 20])).toEqual([-5, 20])
  })

  it('never collapses', () => {
    expect(valueDomain([0, 0])).toEqual([0, 1])
  })
})

describe('incomeStatementRows', () => {
  it('signs deductions negative and computes vertical analysis over net revenue', () => {
    const rows = incomeStatementRows(dre)
    expect(rows).toHaveLength(16)
    expect(rows[1]).toMatchObject({ value: -10000, kind: 'line' })
    expect(rows[2]!.share).toBe(1)
    expect(rows[15]).toMatchObject({ value: 13200, kind: 'result' })
    expect(rows[15]!.share).toBeCloseTo(0.146667, 5)
  })

  it('has no share when net revenue is zero and no negative zeros', () => {
    const rows = incomeStatementRows({ ...dre, netRevenue: 0, incomeTax: 0 })
    expect(rows.every((r) => r.share === null)).toBe(true)
    expect(Object.is(rows[14]!.value, -0)).toBe(false)
  })
})

describe('waterfallBars', () => {
  it('walks from gross revenue to net income', () => {
    const bars = waterfallBars(dre)
    expect(bars.map((b) => b.label)).toEqual([
      'Receita', 'Deduções', 'CMV', 'Desp. oper.', 'D&A', 'Res. fin.', 'IR/CSLL', 'Lucro líq.',
    ])
    // 100000 -10000 -40000 -22000 -3000 -5000 -6800 = 13200
    expect(bars[6]).toEqual({ label: 'IR/CSLL', start: 20000, end: 13200, kind: 'decrease' })
    expect(bars[7]).toEqual({ label: 'Lucro líq.', start: 0, end: 13200, kind: 'total' })
  })

  it('skips zero steps and marks positive financial result as increase', () => {
    const bars = waterfallBars({ ...dre, depreciationAmortization: 0, financialResult: 500 })
    expect(bars.find((b) => b.label === 'D&A')).toBeUndefined()
    expect(bars.find((b) => b.label === 'Res. fin.')!.kind).toBe('increase')
  })
})

describe('breakEvenChartData', () => {
  it('spans twice the break-even and puts the point on the revenue line', () => {
    // F=10000, P=50, CVu=30 -> BE 500
    const d = breakEvenChartData(10000, 50, 30, 500)
    expect(d.maxQuantity).toBe(1000)
    expect(d.revenueAtMax).toBe(50000)
    expect(d.costAtMax).toBe(40000)
    expect(d.breakEvenRevenue).toBe(25000)
    expect(d.maxValue).toBe(50000)
  })

  it('extends past the current quantity and handles zero break-even', () => {
    expect(breakEvenChartData(10000, 50, 30, 500, 2000).maxQuantity).toBe(2400)
    expect(breakEvenChartData(0, 10, 4, 0).maxQuantity).toBe(1)
  })
})

describe('compositionSegments', () => {
  it('widths sum to 1 and negative amounts take no width', () => {
    const segs = compositionSegments([
      { key: 'COST', label: 'Custo', amount: 60, rate: 0.6 },
      { key: 'SALES_TAX', label: 'Impostos', amount: 40, rate: 0.4 },
      { key: 'PROFIT', label: 'Lucro', amount: -0.01, rate: 0 },
    ])
    expect(segs.map((s) => s.width)).toEqual([0.6, 0.4, 0])
  })
})
