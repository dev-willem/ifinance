import { isAxiosError } from 'axios'
import type {
  CreditAmortizationSystem,
  CreditCapacityRequest,
  DiscountModality,
  DiscountRequest,
} from '@/types/credit'

export interface CapacityForm {
  monthlyIncome: number | null
  existingMonthlyDebts: number | null
  maxCommitmentPercent: number | null
  annualRatePercent: number | null
  termMonths: number | null
  amortizationSystem: CreditAmortizationSystem
  desiredLoanAmount: number | null
}

export interface DiscountForm {
  faceValue: number | null
  ratePercent: number | null
  periods: number | null
}

const filled = (v: number | null): v is number => v !== null && Number.isFinite(v)

/** The backend's pt-BR ApiError.message, or the fallback (axios' own message is English). */
export function apiErrorMessage(e: unknown, fallback: string): string {
  const message = isAxiosError<{ message?: unknown }>(e) ? e.response?.data?.message : undefined
  return typeof message === 'string' && message ? message : fallback
}

/** Bounds mirror CreditCapacityRequest / DiscountRequest on the backend. */
export function isCapacityFormValid(f: CapacityForm): boolean {
  return (
    filled(f.monthlyIncome) && f.monthlyIncome > 0 && f.monthlyIncome <= 1e9 &&
    filled(f.existingMonthlyDebts) && f.existingMonthlyDebts >= 0 && f.existingMonthlyDebts <= 1e9 &&
    (!filled(f.maxCommitmentPercent) || (f.maxCommitmentPercent >= 5 && f.maxCommitmentPercent <= 70)) &&
    filled(f.annualRatePercent) && f.annualRatePercent >= 0 && f.annualRatePercent <= 2000 &&
    filled(f.termMonths) && Number.isInteger(f.termMonths) && f.termMonths >= 1 && f.termMonths <= 480 &&
    (!filled(f.desiredLoanAmount) || (f.desiredLoanAmount >= 0.01 && f.desiredLoanAmount <= 1e11))
  )
}

/** Percent fields are typed as % and sent as decimals; empty optional fields are omitted. */
export function toCapacityRequest(f: CapacityForm): CreditCapacityRequest {
  return {
    monthlyIncome: f.monthlyIncome!,
    existingMonthlyDebts: f.existingMonthlyDebts!,
    ...(filled(f.maxCommitmentPercent) ? { maxCommitmentRate: f.maxCommitmentPercent / 100 } : {}),
    annualInterestRate: f.annualRatePercent! / 100,
    termMonths: f.termMonths!,
    amortizationSystem: f.amortizationSystem,
    ...(filled(f.desiredLoanAmount) ? { desiredLoanAmount: f.desiredLoanAmount } : {}),
  }
}

export function isDiscountFormValid(f: DiscountForm): boolean {
  return (
    filled(f.faceValue) && f.faceValue > 0 && f.faceValue <= 1e11 &&
    filled(f.ratePercent) && f.ratePercent > 0 && f.ratePercent <= 1000 &&
    filled(f.periods) && f.periods > 0 && f.periods <= 1200
  )
}

export function toDiscountRequest(f: DiscountForm): DiscountRequest {
  return { faceValue: f.faceValue!, ratePerPeriod: f.ratePercent! / 100, periods: f.periods! }
}

export interface CommitmentBar {
  currentWidth: number
  newWidth: number
  limitPosition: number
  overLimit: boolean
}

/**
 * Widths/positions in % of the bar, which spans 0..100% of income. With a desired loan, `approved` (decided by the
 * backend on cent-rounded installments) drives overLimit, since the 2-decimal percents can tie at the limit.
 */
export function commitmentBar(
  currentPercent: number,
  resultingPercent: number | undefined,
  limitPercent: number,
  approved?: boolean,
): CommitmentBar {
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  const current = clamp(currentPercent)
  const total = resultingPercent === undefined ? current : clamp(resultingPercent)
  return {
    currentWidth: current,
    newWidth: Math.max(0, total - current),
    limitPosition: clamp(limitPercent),
    overLimit: approved !== undefined ? !approved : (resultingPercent ?? currentPercent) > limitPercent,
  }
}

export const DISCOUNT_INFO: Record<DiscountModality, { title: string; formula: string; description: string }> = {
  RATIONAL_SIMPLE: {
    title: 'Racional simples (por dentro)',
    formula: 'A = N / (1 + i·n)',
    description: 'Juros simples calculados sobre o valor atual. A taxa efetiva simples coincide com a taxa contratada.',
  },
  COMMERCIAL_SIMPLE: {
    title: 'Comercial simples (por fora)',
    formula: 'D = N·i·n  ·  A = N·(1 − i·n)',
    description: 'Desconto bancário: juros simples sobre o valor nominal. Usual em duplicatas; a taxa efetiva é maior que a contratada e só é válido se i·n < 100%.',
  },
  RATIONAL_COMPOUND: {
    title: 'Racional composto',
    formula: 'A = N / (1 + i)ⁿ',
    description: 'Equivale a trazer o valor a valor presente com juros compostos. A taxa efetiva composta coincide com a contratada.',
  },
  COMMERCIAL_COMPOUND: {
    title: 'Comercial composto',
    formula: 'A = N·(1 − i)ⁿ',
    description: 'Desconto aplicado sucessivamente sobre o valor nominal. Pouco usado no Brasil; a taxa efetiva composta é i / (1 − i).',
  },
}
