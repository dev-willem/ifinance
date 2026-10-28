import { describe, expect, it } from 'vitest'
import { useFormatBR } from './useFormatBR'

// Intl pt-BR separates "R$" from the amount with a non-breaking space (U+00A0)
const NBSP = ' '
const f = useFormatBR()

describe('useFormatBR', () => {
  describe('formatCurrency', () => {
    it('formats BRL with dot thousands and comma decimals', () => {
      expect(f.formatCurrency(1234.56)).toBe(`R$${NBSP}1.234,56`)
      expect(f.formatCurrency(1_000_000)).toBe(`R$${NBSP}1.000.000,00`)
    })

    it('formats zero and negatives', () => {
      expect(f.formatCurrency(0)).toBe(`R$${NBSP}0,00`)
      expect(f.formatCurrency(-1234.5)).toBe(`-R$${NBSP}1.234,50`)
    })

    it('rounds to 2 decimals half away from zero', () => {
      // 0.125 is exact in binary, so this checks the rounding mode, not float noise
      expect(f.formatCurrency(0.125)).toBe(`R$${NBSP}0,13`)
    })

    it('returns placeholder for null/undefined', () => {
      expect(f.formatCurrency(null)).toBe('R$ -')
      expect(f.formatCurrency(undefined)).toBe('R$ -')
    })
  })

  describe('formatPercent', () => {
    it('treats input as percentage points by default', () => {
      expect(f.formatPercent(12.5)).toBe('12,50%')
      expect(f.formatPercent(0)).toBe('0,00%')
      expect(f.formatPercent(-3)).toBe('-3,00%')
    })

    it('treats input as a fraction when isDecimal is true', () => {
      expect(f.formatPercent(0.125, true)).toBe('12,50%')
      expect(f.formatPercent(1, true)).toBe('100,00%')
    })

    it('keeps up to 4 fraction digits', () => {
      // 12.34567 / 100 = 0.1234567 -> 12.34567% -> 12,3457%
      expect(f.formatPercent(12.34567)).toBe('12,3457%')
    })

    it('returns dash for null/undefined', () => {
      expect(f.formatPercent(null)).toBe('-')
      expect(f.formatPercent(undefined, true)).toBe('-')
    })
  })

  describe('formatNumber / formatInt', () => {
    it('formats with the requested number of decimals', () => {
      expect(f.formatNumber(1234567.891, 2)).toBe('1.234.567,89')
      expect(f.formatNumber(1.5, 3)).toBe('1,500')
    })

    it('defaults to 0 decimals', () => {
      expect(f.formatNumber(1234.5)).toBe('1.235')
    })

    it('formats integers with thousand separators', () => {
      expect(f.formatInt(1234567)).toBe('1.234.567')
      expect(f.formatInt(-9876.4)).toBe('-9.876')
    })

    it('returns dash for null/undefined', () => {
      expect(f.formatNumber(null)).toBe('-')
      expect(f.formatInt(undefined)).toBe('-')
    })
  })

  describe('formatDate', () => {
    it('keeps the calendar day of a date-only ISO string in any timezone', () => {
      expect(f.formatDate('2024-01-15')).toBe('15/01/2024')
      expect(f.formatDate('2024-12-31')).toBe('31/12/2024')
    })

    it('formats a local date-time as dd/MM/yyyy', () => {
      expect(f.formatDate('2024-03-05T10:30:00')).toBe('05/03/2024')
    })

    it('returns dash for empty values', () => {
      expect(f.formatDate(null)).toBe('-')
      expect(f.formatDate(undefined)).toBe('-')
      expect(f.formatDate('')).toBe('-')
    })

    it('returns the raw input when it is not a date', () => {
      expect(f.formatDate('not-a-date')).toBe('not-a-date')
    })
  })

  describe('formatDatetime', () => {
    it('formats a local date-time with hours and minutes', () => {
      expect(f.formatDatetime('2024-03-05T09:07:00')).toBe('05/03/2024, 09:07')
    })

    it('returns dash for empty and raw input when invalid', () => {
      expect(f.formatDatetime(null)).toBe('-')
      expect(f.formatDatetime('garbage')).toBe('garbage')
    })
  })

  describe('formatLargeNumber', () => {
    it('abbreviates thousands, millions and billions', () => {
      expect(f.formatLargeNumber(12_345)).toBe('R$ 12,3 Mil')
      expect(f.formatLargeNumber(1_500_000)).toBe('R$ 1,5 Mi')
      expect(f.formatLargeNumber(2_500_000_000)).toBe('R$ 2,5 Bi')
    })

    it('keeps the sign for negatives', () => {
      expect(f.formatLargeNumber(-12_345)).toBe('-R$ 12,3 Mil')
    })

    it('falls back to full currency below 1000', () => {
      expect(f.formatLargeNumber(999)).toBe(`R$${NBSP}999,00`)
      expect(f.formatLargeNumber(null)).toBe('-')
    })
  })

  describe('formatTerm', () => {
    it('formats monthly terms in months and years', () => {
      expect(f.formatTerm(1)).toBe('1 mês')
      expect(f.formatTerm(6)).toBe('6 meses')
      expect(f.formatTerm(12)).toBe('1 ano')
      expect(f.formatTerm(24)).toBe('2 anos')
      expect(f.formatTerm(30)).toBe('2a 6m')
    })

    it('uses generic periods for other periodicities', () => {
      expect(f.formatTerm(10, 'ANNUAL')).toBe('10 períodos')
    })
  })
})
