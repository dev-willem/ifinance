export type CreditAmortizationSystem = 'PRICE' | 'SAC'

/** Rates are decimals (0.30 = 30%). */
export interface CreditCapacityRequest {
  monthlyIncome: number
  existingMonthlyDebts: number
  maxCommitmentRate?: number
  annualInterestRate: number
  termMonths: number
  amortizationSystem: CreditAmortizationSystem
  desiredLoanAmount?: number
}

/** `*Percent` fields are 0..100; maxCommitmentRate and monthlyRate are decimals. */
export interface CreditCapacityResponse {
  amortizationSystem: CreditAmortizationSystem
  maxCommitmentRate: number
  monthlyRate: number
  maxInstallment: number
  currentCommitmentPercent: number
  maxLoanAmount: number
  desiredLoanAmount?: number
  desiredFirstInstallment?: number
  resultingCommitmentPercent?: number
  approved?: boolean
  minimumTermMonths?: number
  statusMessage: string
}

export type DiscountModality =
  | 'RATIONAL_SIMPLE'
  | 'COMMERCIAL_SIMPLE'
  | 'RATIONAL_COMPOUND'
  | 'COMMERCIAL_COMPOUND'

export interface DiscountRequest {
  faceValue: number
  ratePerPeriod: number
  periods: number
}

/** Numeric fields are absent when valid is false; rates are decimals. */
export interface DiscountModalityResult {
  modality: DiscountModality
  valid: boolean
  presentValue?: number
  discountAmount?: number
  effectiveRateTotal?: number
  effectiveSimpleRatePerPeriod?: number
  effectiveCompoundRatePerPeriod?: number
  message?: string
}

export interface DiscountResponse {
  faceValue: number
  ratePerPeriod: number
  periods: number
  modalities: DiscountModalityResult[]
}
