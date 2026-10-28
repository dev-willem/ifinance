// Rates are fractions (0.18 = 18%). Optional amounts may be omitted.

export interface IncomeStatementRequest {
  grossRevenue: number
  salesDeductionsRate?: number
  costOfGoodsSold: number
  sellingExpenses?: number
  administrativeExpenses?: number
  otherOperatingExpenses?: number
  depreciationAmortization?: number
  financialRevenue?: number
  financialExpenses?: number
  incomeTaxRate?: number
  months?: number
  monthlyRevenueGrowth?: number
}

export interface IncomeStatementProjectionMonth {
  month: number
  grossRevenue: number
  netRevenue: number
  grossProfit: number
  ebitda: number
  ebit: number
  earningsBeforeTax: number
  incomeTax: number
  netIncome: number
  /** null when the month's net revenue is zero (nested records are serialized with explicit nulls). */
  netMargin: number | null
  cumulativeNetIncome: number
}

export interface IncomeStatementResponse {
  grossRevenue: number
  salesDeductions: number
  netRevenue: number
  costOfGoodsSold: number
  grossProfit: number
  sellingExpenses: number
  administrativeExpenses: number
  otherOperatingExpenses: number
  operatingExpenses: number
  ebitda: number
  depreciationAmortization: number
  ebit: number
  financialRevenue: number
  financialExpenses: number
  financialResult: number
  earningsBeforeTax: number
  incomeTax: number
  netIncome: number
  /** Margins over net revenue; absent when net revenue is zero. */
  grossMargin?: number
  ebitdaMargin?: number
  operatingMargin?: number
  netMargin?: number
  projection?: IncomeStatementProjectionMonth[]
}

export interface BreakEvenRequest {
  fixedCosts: number
  unitPrice: number
  unitVariableCost: number
  depreciation?: number
  desiredProfit?: number
  currentQuantity?: number
}

export interface BreakEvenResponse {
  unitContributionMargin: number
  contributionMarginRatio: number
  accountingBreakEvenUnitsExact: number
  accountingBreakEvenUnits: number
  accountingBreakEvenRevenue: number
  economicBreakEvenUnitsExact?: number
  economicBreakEvenUnits?: number
  economicBreakEvenRevenue?: number
  financialBreakEvenUnitsExact: number
  financialBreakEvenUnits: number
  financialBreakEvenRevenue: number
  currentRevenue?: number
  operatingProfit?: number
  safetyMarginUnits?: number
  safetyMarginRevenue?: number
  safetyMarginRatio?: number
  operatingLeverageDegree?: number
}

export interface MarkupExtraRate {
  name: string
  rate: number
}

export interface MarkupRequest {
  unitCost: number
  salesTaxRate?: number
  commissionRate?: number
  cardFeeRate?: number
  fixedExpenseRate?: number
  desiredProfitRate?: number
  extraRates?: MarkupExtraRate[]
  currentPrice?: number
}

export type PriceComponentKey =
  | 'COST'
  | 'SALES_TAX'
  | 'COMMISSION'
  | 'CARD_FEE'
  | 'FIXED_EXPENSE'
  | 'EXTRA'
  | 'PROFIT'

export interface PriceComponent {
  key: PriceComponentKey
  label: string
  rate: number
  amount: number
}

export interface MarkupResponse {
  totalRate: number
  markupDivisor: number
  markupMultiplier: number
  suggestedPrice: number
  composition: PriceComponent[]
  currentPrice?: number
  actualProfitAmount?: number
  actualProfitMargin?: number
}
