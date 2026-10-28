export type SimplesAnnex = 'I' | 'II' | 'III' | 'IV' | 'V'

export type TaxType = 'IRPJ' | 'CSLL' | 'COFINS' | 'PIS_PASEP' | 'CPP' | 'ICMS' | 'IPI' | 'ISS'

export type BusinessActivity =
  | 'COMMERCE'
  | 'INDUSTRY'
  | 'SERVICES'
  | 'SERVICES_ANNEX_IV'
  | 'SERVICES_ANNEX_V'
  | 'PASSENGER_TRANSPORT'

export type TaxRegime = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL'

/** share = fraction of the DAS (or regime total) that goes to the tax */
export interface TaxShare {
  tax: TaxType
  share: number
  amount: number
}

export interface SimplesRequest {
  rbt12: number
  monthlyRevenue: number
  annex: SimplesAnnex
  payroll12?: number | null
}

/** Rates are fractions (0.0808 = 8,08%). DAS fields are absent when not eligible. */
export interface SimplesResponse {
  requestedAnnex: SimplesAnnex
  appliedAnnex: SimplesAnnex
  fatorR?: number
  eligible: boolean
  aboveSublimit: boolean
  bracket?: number
  nominalRate?: number
  deduction?: number
  effectiveRate?: number
  dasAmount?: number
  shares: TaxShare[]
  notes: string[]
  disclaimer: string
}

/** Rates are fractions. Optional fields default to 0, payrollChargesRate to 0.278. */
export interface TaxCompareRequest {
  annualRevenue: number
  activity: BusinessActivity
  annualPayroll?: number | null
  payrollChargesRate?: number | null
  deductibleExpenses?: number | null
  creditablePurchases?: number | null
  salesTaxRate?: number | null
}

export interface RegimeResult {
  regime: TaxRegime
  eligible: boolean
  breakdown: TaxShare[]
  total: number | null
  effectiveRate: number | null
  netProfit: number | null
  notes: string[]
}

export interface TaxCompareResponse {
  regimes: RegimeResult[]
  cheapest: TaxRegime | null
  disclaimer: string
}
