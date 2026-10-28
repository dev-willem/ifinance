import { describe, expect, it } from 'vitest'
import { bandPath, linePath, niceStep, niceTicks, scaleLinear, yearTicks } from './chartScale'

describe('scaleLinear', () => {
  it('maps domain onto range, including inverted ranges', () => {
    const y = scaleLinear(0, 100, 200, 0)
    expect(y(0)).toBe(200)
    expect(y(50)).toBe(100)
    expect(y(100)).toBe(0)
  })

  it('maps a degenerate domain to the range start', () => {
    expect(scaleLinear(5, 5, 10, 20)(5)).toBe(10)
  })
})

describe('niceStep / niceTicks', () => {
  it('rounds steps up to 1-2-5 multiples', () => {
    expect(niceStep(0.7)).toBeCloseTo(1)
    expect(niceStep(13)).toBe(20)
    expect(niceStep(31_000)).toBe(50_000)
    expect(niceStep(80_000)).toBe(100_000)
    expect(niceStep(0)).toBe(1)
  })

  it('covers the max with the last tick', () => {
    // 142000 / 5 = 28400 → step 50000 → 0, 50k, 100k, 150k
    expect(niceTicks(142_000)).toEqual([0, 50_000, 100_000, 150_000])
    expect(niceTicks(100)).toEqual([0, 20, 40, 60, 80, 100])
  })

  it('handles zero, negative and non-finite max', () => {
    expect(niceTicks(0)).toEqual([0, 1])
    expect(niceTicks(-5)).toEqual([0, 1])
    expect(niceTicks(Number.POSITIVE_INFINITY)).toEqual([0, 1])
  })
})

describe('yearTicks', () => {
  it('labels every year for short horizons', () => {
    expect(yearTicks(5)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('thins long horizons and always ends at the last year', () => {
    expect(yearTicks(30)).toEqual([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30])
    // step ceil(6) = 6: 0…54 then 60
    expect(yearTicks(60)).toEqual([0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60])
    // step ceil(4.1) = 5: 0…40, but 41 − 40 < 2.5 would crowd → 40 dropped
    expect(yearTicks(41)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 41])
    expect(yearTicks(1)).toEqual([0, 1])
  })
})

describe('paths', () => {
  it('builds a closed band going right on top and back on bottom', () => {
    expect(bandPath([0, 10], [1, 2], [5, 6])).toBe('M0.0,1.0 L10.0,2.0 L10.0,6.0 L0.0,5.0 Z')
    expect(bandPath([], [], [])).toBe('')
  })

  it('builds a polyline', () => {
    expect(linePath([0, 5, 10], [3, 2, 1])).toBe('M0.0,3.0 L5.0,2.0 L10.0,1.0')
  })
})
