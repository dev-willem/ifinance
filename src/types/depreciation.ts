export type DepreciationMethod =
  | 'STRAIGHT_LINE'
  | 'SUM_OF_YEARS_DIGITS'
  | 'DECLINING_BALANCE'
  | 'UNITS_OF_PRODUCTION'

export interface DepreciationCompareRequest {
  assetValue: number
  residualValue: number
  usefulLifeYears: number
  decliningFactor?: number
  shiftsPerDay?: number
  firstYearMonths?: number
}

export interface DepreciationRequest extends DepreciationCompareRequest {
  method: DepreciationMethod
  totalUnits?: number
  unitsPerYear?: number[]
}

export interface DepreciationRow {
  year: number
  months: number
  openingBookValue: number
  depreciation: number
  accumulatedDepreciation: number
  closingBookValue: number
}

export interface DepreciationResponse {
  method: DepreciationMethod
  annualRatePercent: number
  effectiveLifeYears: number
  monthlyDepreciationFirstFullYear: number
  depreciableBase: number
  totalDepreciation: number
  finalBookValue: number
  rows: DepreciationRow[]
}

export interface AssetClass {
  code: string
  description: string
  reference: string
  annualRatePercent: number
  usefulLifeYears: number
}
