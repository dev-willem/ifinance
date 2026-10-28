import { AxiosError, AxiosHeaders } from 'axios'
import {
  apiErrorMessage,
  commitmentBar,
  isCapacityFormValid,
  isDiscountFormValid,
  toCapacityRequest,
  toDiscountRequest,
  type CapacityForm,
} from './credit'

const base: CapacityForm = {
  monthlyIncome: 10000,
  existingMonthlyDebts: 1000,
  maxCommitmentPercent: 30,
  annualRatePercent: 12.5,
  termMonths: 60,
  amortizationSystem: 'SAC',
  desiredLoanAmount: null,
}

describe('toCapacityRequest', () => {
  it('converts percents to decimals and omits empty optionals', () => {
    expect(toCapacityRequest(base)).toEqual({
      monthlyIncome: 10000,
      existingMonthlyDebts: 1000,
      maxCommitmentRate: 0.3,
      annualInterestRate: 0.125,
      termMonths: 60,
      amortizationSystem: 'SAC',
    })
  })

  it('sends desired amount and lets the backend default the commitment rate', () => {
    const req = toCapacityRequest({ ...base, maxCommitmentPercent: null, desiredLoanAmount: 50000 })
    expect(req).not.toHaveProperty('maxCommitmentRate')
    expect(req.desiredLoanAmount).toBe(50000)
  })
})

describe('isCapacityFormValid', () => {
  it.each([
    [{}, true],
    [{ monthlyIncome: 0 }, false],
    [{ existingMonthlyDebts: -1 }, false],
    [{ maxCommitmentPercent: 80 }, false],
    [{ maxCommitmentPercent: null }, true],
    [{ annualRatePercent: 0 }, true],
    [{ termMonths: 481 }, false],
    [{ termMonths: 12.5 }, false],
    [{ desiredLoanAmount: 0 }, false],
    [{ desiredLoanAmount: 0.001 }, false],
    [{ desiredLoanAmount: 1e11 + 1 }, false],
    [{ monthlyIncome: 1e9 + 1 }, false],
    [{ existingMonthlyDebts: 1e9 + 1 }, false],
    [{ annualRatePercent: 2000 }, true],
    [{ annualRatePercent: 2001 }, false],
  ] as [Partial<CapacityForm>, boolean][])('%o -> %s', (patch, expected) => {
    expect(isCapacityFormValid({ ...base, ...patch })).toBe(expected)
  })
})

describe('discount form', () => {
  it('converts the rate to decimal and keeps fractional periods', () => {
    expect(toDiscountRequest({ faceValue: 1000, ratePercent: 5, periods: 1.5 })).toEqual({
      faceValue: 1000,
      ratePerPeriod: 0.05,
      periods: 1.5,
    })
  })

  it('requires positive values', () => {
    expect(isDiscountFormValid({ faceValue: 1000, ratePercent: 5, periods: 1.5 })).toBe(true)
    expect(isDiscountFormValid({ faceValue: 1000, ratePercent: 0, periods: 1 })).toBe(false)
    expect(isDiscountFormValid({ faceValue: null, ratePercent: 5, periods: 1 })).toBe(false)
  })

  it('mirrors the backend upper bounds', () => {
    expect(isDiscountFormValid({ faceValue: 1e11, ratePercent: 1000, periods: 1200 })).toBe(true)
    expect(isDiscountFormValid({ faceValue: 1e11 + 1, ratePercent: 5, periods: 1 })).toBe(false)
    expect(isDiscountFormValid({ faceValue: 1000, ratePercent: 1001, periods: 1 })).toBe(false)
    expect(isDiscountFormValid({ faceValue: 1000, ratePercent: 5, periods: 1201 })).toBe(false)
  })
})

describe('commitmentBar', () => {
  it('splits current debts and the new installment', () => {
    expect(commitmentBar(10, 25, 30)).toEqual({ currentWidth: 10, newWidth: 15, limitPosition: 30, overLimit: false })
  })

  it('flags over-limit and clamps to the bar', () => {
    expect(commitmentBar(40, 130, 30)).toEqual({ currentWidth: 40, newWidth: 60, limitPosition: 30, overLimit: true })
  })

  it('trusts the backend approval when rounded percents tie at the limit', () => {
    // installment 3000.01 on income 10000: backend says not approved, percent rounds to 30.00
    expect(commitmentBar(0, 30, 30, false).overLimit).toBe(true)
    expect(commitmentBar(0, 30, 30, true).overLimit).toBe(false)
  })

  it('uses current commitment when there is no desired loan', () => {
    expect(commitmentBar(35, undefined, 30)).toEqual({ currentWidth: 35, newWidth: 0, limitPosition: 30, overLimit: true })
  })
})

describe('apiErrorMessage', () => {
  const axiosError = (data: unknown) =>
    new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', undefined, undefined, {
      data,
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
    })

  it('uses the backend pt-BR message', () => {
    expect(apiErrorMessage(axiosError({ message: 'O prazo deve ser de no máximo 480 meses.' }), 'x')).toBe(
      'O prazo deve ser de no máximo 480 meses.',
    )
  })

  it('falls back when there is no backend message', () => {
    expect(apiErrorMessage(axiosError(undefined), 'Erro ao calcular.')).toBe('Erro ao calcular.')
    expect(apiErrorMessage(new Error('Network Error'), 'Erro ao calcular.')).toBe('Erro ao calcular.')
  })
})
