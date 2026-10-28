import type { BusinessActivity, RegimeResult, SimplesAnnex, TaxRegime, TaxType } from '@/types/tax'

export const TAX_LABELS: Record<TaxType, string> = {
  IRPJ: 'IRPJ',
  CSLL: 'CSLL',
  COFINS: 'Cofins',
  PIS_PASEP: 'PIS/Pasep',
  CPP: 'CPP (INSS patronal)',
  ICMS: 'ICMS',
  IPI: 'IPI',
  ISS: 'ISS',
}

// Same order as the backend TaxType enum
const TAX_ORDER = Object.keys(TAX_LABELS) as TaxType[]

export const REGIME_LABELS: Record<TaxRegime, string> = {
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
}

export const ANNEX_OPTIONS: { value: SimplesAnnex; label: string }[] = [
  { value: 'I', label: 'Anexo I — Comércio' },
  { value: 'II', label: 'Anexo II — Indústria' },
  { value: 'III', label: 'Anexo III — Serviços e locação de bens móveis' },
  { value: 'IV', label: 'Anexo IV — Construção, limpeza, vigilância, advocacia' },
  { value: 'V', label: 'Anexo V — Serviços intelectuais (TI, engenharia, publicidade)' },
]

export const ACTIVITY_OPTIONS: { value: BusinessActivity; label: string }[] = [
  { value: 'COMMERCE', label: 'Comércio (Anexo I)' },
  { value: 'INDUSTRY', label: 'Indústria (Anexo II)' },
  { value: 'SERVICES', label: 'Serviços em geral (Anexo III)' },
  { value: 'SERVICES_ANNEX_IV', label: 'Construção, limpeza, vigilância, advocacia (Anexo IV)' },
  { value: 'SERVICES_ANNEX_V', label: 'Serviços intelectuais com Fator R (Anexo V/III)' },
  { value: 'PASSENGER_TRANSPORT', label: 'Transporte municipal de passageiros' },
]

export const DEFAULT_DISCLAIMER =
  'Simulação simplificada e educativa com as regras de 2026; não substitui a análise de um contador. ' +
  'A Reforma Tributária (EC 132/2023 e LC 214/2025 — CBS/IBS) não é modelada.'

export function salesTaxOf(activity: BusinessActivity): 'ICMS' | 'ISS' {
  return activity === 'COMMERCE' || activity === 'INDUSTRY' ? 'ICMS' : 'ISS'
}

/** Bar widths in % of the largest value; null, negative and non-finite values count as zero. */
export function barWidths(values: (number | null | undefined)[]): number[] {
  const clean = values.map((v) => (v != null && Number.isFinite(v) && v > 0 ? v : 0))
  const max = Math.max(0, ...clean)
  return clean.map((v) => (max === 0 ? 0 : (v / max) * 100))
}

/** One row per tax present in any regime, with that tax's amount per regime (null when absent). */
export function buildTaxMatrix(regimes: RegimeResult[]): { tax: TaxType; amounts: (number | null)[] }[] {
  const present = new Set(regimes.flatMap((r) => r.breakdown.map((s) => s.tax)))
  return TAX_ORDER.filter((tax) => present.has(tax)).map((tax) => ({
    tax,
    amounts: regimes.map((r) => r.breakdown.find((s) => s.tax === tax)?.amount ?? null),
  }))
}

/** Eligible regimes from the cheapest to the most expensive. */
export function rankEligible(regimes: RegimeResult[]): RegimeResult[] {
  return regimes
    .filter((r): r is RegimeResult & { total: number } => r.eligible && r.total != null)
    .sort((a, b) => a.total - b.total)
}
