import { describe, expect, it } from 'vitest'
import { parseNumberBR, parseSeries } from './parseSeries'

describe('parseNumberBR', () => {
  it.each([
    ['1,5', 1.5],
    ['1.5', 1.5],
    ['-0,25', -0.25],
    ['+2', 2],
    ['−3,5', -3.5],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['1.234.567', 1234567],
    ['1,234,567', 1234567],
    ['1.234.567,8', 1234567.8],
    ['42', 42],
  ])('parses %s', (raw, expected) => {
    expect(parseNumberBR(raw)).toBeCloseTo(expected, 10)
  })

  it.each(['abc', '', '-', '1,2,3.4.5', '1e5', 'R$10', '.,', '1,2,3', '1.2.3', '12.34.5,6', '1.23,4.5'])(
    'rejects %s',
    (raw) => {
      expect(parseNumberBR(raw)).toBeNull()
    },
  )

  it('needs the series decimal mark for a lone separator followed by 3 digits', () => {
    expect(parseNumberBR('1.002')).toBeNull()
    expect(parseNumberBR('1.002', ',')).toBe(1002)
    expect(parseNumberBR('1.002', '.')).toBeCloseTo(1.002, 12)
    expect(parseNumberBR('1,002', ',')).toBeCloseTo(1.002, 12)
    expect(parseNumberBR('0.123')).toBeCloseTo(0.123, 12)
  })
})

describe('parseSeries', () => {
  it('splits on newlines, semicolons, tabs and spaces', () => {
    expect(parseSeries('1,5\n2.5;3\t4  5').values).toEqual([1.5, 2.5, 3, 4, 5])
  })

  it('divides tokens with % by 100', () => {
    const { values } = parseSeries('1,5%; -2%\n0.01')
    expect(values[0]).toBeCloseTo(0.015, 12)
    expect(values[1]).toBeCloseTo(-0.02, 12)
    expect(values[2]).toBeCloseTo(0.01, 12)
  })

  it('percent mode divides every token once', () => {
    const { values } = parseSeries('1,5 2% -3', true)
    expect(values).toHaveLength(3)
    expect(values[0]).toBeCloseTo(0.015, 12)
    expect(values[1]).toBeCloseTo(0.02, 12)
    expect(values[2]).toBeCloseTo(-0.03, 12)
  })

  it('tolerates trailing commas used as en-US list separators', () => {
    expect(parseSeries('1.5, 2.5, 3.5').values).toEqual([1.5, 2.5, 3.5])
  })

  it('reports invalid tokens with position and keeps the valid ones', () => {
    const { values, errors } = parseSeries('10\nabc\n12')
    expect(values).toEqual([10, 12])
    expect(errors).toEqual(['Valor inválido na posição 2: "abc"'])
  })

  it('reads ambiguous tokens with the decimal mark the rest of the series uses', () => {
    expect(parseSeries('998,50\n1.002\n1.010,25').values).toEqual([998.5, 1002, 1010.25])
    expect(parseSeries('998.50\n1,002\n1,010.25').values).toEqual([998.5, 1002, 1010.25])
    expect(parseSeries('0,5\n1,002').values).toEqual([0.5, 1.002])
  })

  it.each(['998\n1.002\n1.010', '998\n1,002\n1,010', '1,5\n2.5\n1.002'])(
    'reports ambiguous thousands instead of guessing in %j',
    (text) => {
      const { values, errors } = parseSeries(text)
      expect(errors.some((e) => e.startsWith('Valor ambíguo na posição'))).toBe(true)
      expect(values).not.toContain(1.002)
      expect(values).not.toContain(1002)
    },
  )

  it('reports malformed thousands groups as invalid', () => {
    expect(parseSeries('1,2,3')).toEqual({ values: [], errors: ['Valor inválido na posição 1: "1,2,3"'] })
  })

  it('returns empty for blank input', () => {
    expect(parseSeries('  \n ;; ')).toEqual({ values: [], errors: [] })
  })
})
