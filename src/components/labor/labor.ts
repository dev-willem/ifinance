import { isAxiosError } from 'axios'
import type { NoticeType, PayslipLine, TerminationType } from '@/types/labor'

export const TABLE_YEAR_OPTIONS = [
  { value: '2026', label: '2026 (vigente)' },
  { value: '2025', label: '2025' },
]

/** Table year of a YYYY-MM-DD date, or undefined when no table exists for it. */
export function tableYearOf(date: string | number | null | undefined): string | undefined {
  const year = String(date ?? '').slice(0, 4)
  return TABLE_YEAR_OPTIONS.some((o) => o.value === year) ? year : undefined
}

export const TERMINATION_TYPE_OPTIONS: { value: TerminationType; label: string }[] = [
  { value: 'WITHOUT_CAUSE', label: 'Dispensa sem justa causa' },
  { value: 'RESIGNATION', label: 'Pedido de demissão' },
  { value: 'MUTUAL_AGREEMENT', label: 'Acordo (art. 484-A da CLT)' },
  { value: 'END_OF_FIXED_TERM', label: 'Fim de contrato por prazo determinado' },
  { value: 'WITH_CAUSE', label: 'Dispensa por justa causa' },
]

/** Notice choices valid for each termination type; empty when notice does not apply. */
export function noticeOptions(type: TerminationType): { value: NoticeType; label: string }[] {
  switch (type) {
    case 'WITHOUT_CAUSE':
    case 'MUTUAL_AGREEMENT':
      return [
        { value: 'INDEMNIFIED', label: 'Indenizado' },
        { value: 'WORKED', label: 'Trabalhado' },
      ]
    case 'RESIGNATION':
      return [
        { value: 'WORKED', label: 'Cumprido' },
        { value: 'NOT_SERVED', label: 'Não cumprido (descontado)' },
      ]
    default:
      return []
  }
}

const cents = (v: number) => Math.round(v * 100) / 100

export function payslipTotals(lines: PayslipLine[]) {
  const sum = (type: PayslipLine['type']) =>
    cents(lines.filter((l) => l.type === type).reduce((acc, l) => acc + l.amount, 0))
  const earnings = sum('EARNING')
  const deductions = sum('DEDUCTION')
  return { earnings, deductions, net: cents(earnings - deductions) }
}

/** Optional numeric field: empty stays undefined so the API applies its default. */
export function optional(value: number | null | undefined, divisor = 1): number | undefined {
  return value == null ? undefined : value / divisor
}

export function apiErrorMessage(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}
