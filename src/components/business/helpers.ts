import type { IncomeStatementResponse, PriceComponent } from '@/types/business'

/**
 * Percent typed by the user -> fraction for the API. Rounded to 8 decimals so float noise
 * (14.3 / 100 = 0.14300000000000002) stays within the backend's 10-decimal limit.
 */
export function percentToRate(v: number | null | undefined): number | undefined {
  return v == null ? undefined : Number((v / 100).toFixed(8))
}

/** Maps [d0, d1] onto [r0, r1]; a degenerate domain maps everything to r0. */
export function linearScale(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0
  return (v: number) => (span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0))
}

export type DreRowKind = 'line' | 'subtotal' | 'result'

export interface DreRow {
  label: string
  value: number
  kind: DreRowKind
  /** Vertical analysis: value over net revenue (null when net revenue is zero). */
  share: number | null
}

export function incomeStatementRows(r: IncomeStatementResponse): DreRow[] {
  const rows: [string, number, DreRowKind][] = [
    ['Receita bruta', r.grossRevenue, 'subtotal'],
    ['(-) Deduções sobre vendas', -r.salesDeductions, 'line'],
    ['= Receita líquida', r.netRevenue, 'subtotal'],
    ['(-) CMV / CPV / CSP', -r.costOfGoodsSold, 'line'],
    ['= Lucro bruto', r.grossProfit, 'subtotal'],
    ['(-) Despesas com vendas', -r.sellingExpenses, 'line'],
    ['(-) Despesas administrativas', -r.administrativeExpenses, 'line'],
    ['(-) Outras despesas operacionais', -r.otherOperatingExpenses, 'line'],
    ['= EBITDA', r.ebitda, 'subtotal'],
    ['(-) Depreciação e amortização', -r.depreciationAmortization, 'line'],
    ['= EBIT (resultado operacional)', r.ebit, 'subtotal'],
    ['(+) Receitas financeiras', r.financialRevenue, 'line'],
    ['(-) Despesas financeiras', -r.financialExpenses, 'line'],
    ['= LAIR', r.earningsBeforeTax, 'subtotal'],
    ['(-) IR / CSLL', -r.incomeTax, 'line'],
    ['= Lucro líquido', r.netIncome, 'result'],
  ]
  return rows.map(([label, value, kind]) => ({
    label,
    value: value === 0 ? 0 : value, // avoid rendering "-R$ 0,00"
    kind,
    share: r.netRevenue === 0 ? null : value / r.netRevenue,
  }))
}

export interface WaterfallBar {
  label: string
  start: number
  end: number
  kind: 'total' | 'increase' | 'decrease'
}

/** Gross revenue down to net income; zero-valued steps are skipped. */
export function waterfallBars(r: IncomeStatementResponse): WaterfallBar[] {
  const steps: [string, number][] = [
    ['Deduções', -r.salesDeductions],
    ['CMV', -r.costOfGoodsSold],
    ['Desp. oper.', -r.operatingExpenses],
    ['D&A', -r.depreciationAmortization],
    ['Res. fin.', r.financialResult],
    ['IR/CSLL', -r.incomeTax],
  ]
  const bars: WaterfallBar[] = [{ label: 'Receita', start: 0, end: r.grossRevenue, kind: 'total' }]
  let level = r.grossRevenue
  for (const [label, delta] of steps) {
    if (delta === 0) continue
    bars.push({ label, start: level, end: level + delta, kind: delta > 0 ? 'increase' : 'decrease' })
    level += delta
  }
  bars.push({ label: 'Lucro líq.', start: 0, end: r.netIncome, kind: 'total' })
  return bars
}

/** Domain [min, max] that always includes zero and never collapses. */
export function valueDomain(values: number[]): [number, number] {
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  return min === max ? [0, 1] : [min, max]
}

export interface BreakEvenChartData {
  maxQuantity: number
  maxValue: number
  revenueAtMax: number
  costAtMax: number
  breakEvenQuantity: number
  breakEvenRevenue: number
}

/** X axis spans twice the break-even (or past the current quantity) so both lines visibly cross. */
export function breakEvenChartData(
  fixedCosts: number,
  unitPrice: number,
  unitVariableCost: number,
  breakEvenQuantity: number,
  currentQuantity?: number | null,
): BreakEvenChartData {
  const maxQuantity = Math.max(breakEvenQuantity * 2, (currentQuantity ?? 0) * 1.2, 1)
  const revenueAtMax = maxQuantity * unitPrice
  const costAtMax = fixedCosts + unitVariableCost * maxQuantity
  return {
    maxQuantity,
    maxValue: Math.max(revenueAtMax, costAtMax, 1),
    revenueAtMax,
    costAtMax,
    breakEvenQuantity,
    breakEvenRevenue: breakEvenQuantity * unitPrice,
  }
}

export interface CompositionSegment extends PriceComponent {
  /** Fraction of the bar width; negative amounts (e.g. a rounding loss) take no width. */
  width: number
}

export function compositionSegments(items: PriceComponent[]): CompositionSegment[] {
  const total = items.reduce((sum, i) => sum + Math.max(0, i.amount), 0)
  return items.map((i) => ({ ...i, width: total > 0 ? Math.max(0, i.amount) / total : 0 }))
}
