import { describe, expect, it } from 'vitest'
import type { DepreciationResponse } from '@/types/depreciation'
import {
  allowsShiftAcceleration,
  bookValueSeries,
  parseUnitsList,
  scaleLinear,
  toPath,
  yearTicks,
} from './depreciationChart'

function schedule(rows: [number, number, number][]): DepreciationResponse {
  return {
    method: 'STRAIGHT_LINE',
    annualRatePercent: 20,
    effectiveLifeYears: 5,
    monthlyDepreciationFirstFullYear: 150,
    depreciableBase: 9000,
    totalDepreciation: 9000,
    finalBookValue: 1000,
    rows: rows.map(([months, opening, closing], i) => ({
      year: i + 1,
      months,
      openingBookValue: opening,
      depreciation: opening - closing,
      accumulatedDepreciation: 10000 - closing,
      closingBookValue: closing,
    })),
  }
}

describe('bookValueSeries', () => {
  it('starts at the acquisition value and accumulates partial years in months', () => {
    const s = schedule([
      [6, 10000, 9100],
      [12, 9100, 7300],
      [6, 7300, 6400],
    ])
    expect(bookValueSeries(s)).toEqual([
      { x: 0, y: 10000 },
      { x: 0.5, y: 9100 },
      { x: 1.5, y: 7300 },
      { x: 2, y: 6400 },
    ])
  })

  it('returns no points for an empty schedule', () => {
    expect(bookValueSeries(schedule([]))).toEqual([])
  })
})

describe('scaleLinear', () => {
  it('maps domain to an inverted range', () => {
    const sy = scaleLinear(0, 10000, 200, 0)
    expect(sy(0)).toBe(200)
    expect(sy(5000)).toBe(100)
    expect(sy(10000)).toBe(0)
  })

  it('does not divide by zero on a degenerate domain', () => {
    expect(scaleLinear(5, 5, 10, 20)(5)).toBe(10)
  })
})

describe('toPath', () => {
  it('builds an SVG path', () => {
    const id = (v: number) => v
    expect(toPath([{ x: 0, y: 1 }, { x: 2, y: 3 }], id, id)).toBe('M0.0,1.0 L2.0,3.0')
  })
})

describe('yearTicks', () => {
  it('uses one tick per year for short lives', () => {
    expect(yearTicks(3.33)).toEqual([0, 1, 2, 3, 4])
  })

  it('thins ticks for long lives', () => {
    expect(yearTicks(25)).toEqual([0, 3, 6, 9, 12, 15, 18, 21, 24])
  })
})

describe('parseUnitsList', () => {
  it('parses pt-BR numbers separated by spaces, semicolons and new lines', () => {
    expect(parseUnitsList('30.000; 25000\n20000,5')).toEqual([30000, 25000, 20000.5])
  })

  it('rejects empty, negative or non-numeric input', () => {
    expect(parseUnitsList('  ')).toBeNull()
    expect(parseUnitsList('100 -5')).toBeNull()
    expect(parseUnitsList('100 abc')).toBeNull()
  })
})

describe('allowsShiftAcceleration', () => {
  it('blocks the art. 323 shift coefficients for real estate (bens imóveis)', () => {
    expect(allowsShiftAcceleration('BUILDINGS')).toBe(false)
    expect(allowsShiftAcceleration('INSTALLATIONS')).toBe(false)
  })

  it('allows them for movable assets or when no class is chosen', () => {
    expect(allowsShiftAcceleration('MACHINERY_EQUIPMENT')).toBe(true)
    expect(allowsShiftAcceleration(null)).toBe(true)
  })
})
