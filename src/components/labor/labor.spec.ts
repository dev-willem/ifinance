import { describe, expect, it } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { apiErrorMessage, noticeOptions, optional, payslipTotals, tableYearOf } from './labor'
import type { PayslipLine } from '@/types/labor'

const line = (type: PayslipLine['type'], amount: number): PayslipLine => ({
  description: 'x',
  reference: null,
  type,
  amount,
  taxable: type === 'EARNING' ? true : null,
})

describe('payslipTotals', () => {
  it('sums earnings and deductions without float drift', () => {
    // 0.1 + 0.2 would be 0.30000000000000004 in plain floats
    const totals = payslipTotals([line('EARNING', 0.1), line('EARNING', 0.2), line('DEDUCTION', 0.05)])
    expect(totals).toEqual({ earnings: 0.3, deductions: 0.05, net: 0.25 })
  })

  it('matches the backend termination example (net 9797.28; the FGTS fine is not a statement line)', () => {
    const totals = payslipTotals([
      line('EARNING', 2583.33),
      line('EARNING', 4030),
      line('EARNING', 1808.33),
      line('EARNING', 1291.67),
      line('EARNING', 430.56),
      line('DEDUCTION', 208.18),
      line('DEDUCTION', 138.43),
    ])
    expect(totals.earnings).toBe(10143.89)
    expect(totals.deductions).toBe(346.61)
    expect(totals.net).toBe(9797.28)
  })

  it('handles an empty payslip', () => {
    expect(payslipTotals([])).toEqual({ earnings: 0, deductions: 0, net: 0 })
  })
})

describe('noticeOptions', () => {
  it('offers worked/indemnified for employer dismissals', () => {
    expect(noticeOptions('WITHOUT_CAUSE').map((o) => o.value)).toEqual(['INDEMNIFIED', 'WORKED'])
    expect(noticeOptions('MUTUAL_AGREEMENT').map((o) => o.value)).toEqual(['INDEMNIFIED', 'WORKED'])
  })

  it('offers worked/not served for resignation', () => {
    expect(noticeOptions('RESIGNATION').map((o) => o.value)).toEqual(['WORKED', 'NOT_SERVED'])
  })

  it('has no notice for dismissal with cause or end of fixed term', () => {
    expect(noticeOptions('WITH_CAUSE')).toEqual([])
    expect(noticeOptions('END_OF_FIXED_TERM')).toEqual([])
  })
})

describe('tableYearOf', () => {
  it('returns the year only when a table exists for it', () => {
    expect(tableYearOf('2025-06-25')).toBe('2025')
    expect(tableYearOf('2026-01-01')).toBe('2026')
    expect(tableYearOf('2024-12-31')).toBeUndefined()
    expect(tableYearOf('')).toBeUndefined()
    expect(tableYearOf(null)).toBeUndefined()
  })
})

describe('optional', () => {
  it('converts percent input to decimal and keeps empty as undefined', () => {
    expect(optional(20, 100)).toBe(0.2)
    expect(optional(0, 100)).toBe(0)
    expect(optional(null, 100)).toBeUndefined()
    expect(optional(500)).toBe(500)
  })
})

describe('apiErrorMessage', () => {
  it('extracts the API error message', () => {
    const err = new AxiosError('fail', '400', undefined, undefined, {
      data: { message: 'O abono pecuniário é limitado a 1/3' },
    } as AxiosResponse)
    expect(apiErrorMessage(err)).toBe('O abono pecuniário é limitado a 1/3')
  })

  it('returns undefined for non-API errors', () => {
    expect(apiErrorMessage(new Error('boom'))).toBeUndefined()
  })
})
