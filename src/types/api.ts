import type { AmortizationSystem, ChargeType, EconomicIndex, InvestmentType, Periodicity, RateBasis, RateType } from './models'

// ─── Common ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface ApiError {
  status: number
  code: string
  message: string
  details?: Record<string, string>
  timestamp: string
}

// ─── Simulation ─────────────────────────────────────────────────────────────

export interface CetCharge {
  description: string
  chargeType: ChargeType
  amount: number
  appliesOnPeriod: number | null
}

export interface CetResult {
  monthlyRate: number
  annualRate: number
}

export interface SimulationRequest {
  name: string
  amortizationSystem: AmortizationSystem
  principal: number
  interestRate: number
  rateType: RateType
  term: number
  periodicity: Periodicity
  cetEnabled: boolean
  inflationCorrectionEnabled: boolean
  inflationIndex?: EconomicIndex
  charges?: CetCharge[]
}

export interface Installment {
  periodNumber: number
  principalBalanceBefore: number
  amortization: number
  interest: number
  additionalCharges: number
  total: number
  principalBalanceAfter: number
}

export interface SimulationResponse {
  id: string
  name: string
  amortizationSystem: AmortizationSystem
  principal: number
  interestRate: number
  rateType: RateType
  term: number
  periodicity: Periodicity
  totalPaid: number
  totalInterest: number
  totalCharges: number
  cet: CetResult | null
  cetEnabled: boolean
  inflationCorrectionEnabled: boolean
  inflationIndex: EconomicIndex | null
  installments: Installment[]
  charges: CetCharge[]
  createdAt: string
}

export interface SimulationListItem {
  id: string
  name: string
  amortizationSystem: AmortizationSystem
  principal: number
  interestRate: number
  term: number
  totalPaid: number
  cet: CetResult | null
  createdAt: string
}

export interface PrepaymentInfo {
  period: number
  currentBalance: number
  prepaymentDiscount: number
  totalSavings: number
  remainingInstallments: number
}

export interface SimulationSnapshot {
  id: string
  simulationId: string
  name: string
  createdAt: string
  metadata: Record<string, string>
}

// ─── Investment ─────────────────────────────────────────────────────────────

export interface InvestmentRequest {
  name: string
  investmentType: InvestmentType
  rateBasis: RateBasis
  rateValue: number
  principal: number
  termDays: number
  startDate: string
}

export interface InvestmentResponse {
  id: string
  name: string
  investmentType: InvestmentType
  rateBasis: RateBasis
  rateValue: number
  principal: number
  termDays: number
  startDate: string
  grossReturn: number
  netReturn: number
  irRate: number
  irAmount: number
  grossAnnualRate: number
  netAnnualRate: number
  indexRateUsed: number
  isTaxExempt: boolean
  createdAt: string
}

export interface InvestmentListItem {
  id: string
  name: string
  investmentType: InvestmentType
  principal: number
  termDays: number
  grossReturn: number
  netReturn: number
  irRate: number
  isTaxExempt: boolean
  createdAt: string
}

// ─── Analysis ───────────────────────────────────────────────────────────────

export interface AnalysisRequest {
  cashFlows: number[]
  discountRate: number
}

export interface AnalysisResponse {
  npv: number
  npvPositive: boolean
  irrPercent: number
  irrDecimal: number
  paybackAchieved: boolean
  simplePayback: number
  simplePaybackPeriod: number
  discountedPayback: number
  discountedPaybackPeriod: number
}

// ─── Indexes ─────────────────────────────────────────────────────────────────

export interface IndexRate {
  index: EconomicIndex
  annualRate: number
  referenceDate: string
  isProjection: boolean
}

// ─── Direct Compare ──────────────────────────────────────────────────────────

export interface DirectCompareRequest {
  investments: InvestmentRequest[]
}

export interface DirectCompareItem {
  name: string
  investmentType: InvestmentType
  rateBasis: RateBasis
  rateValue: number
  principal: number
  termDays: number
  grossReturn: number
  netReturn: number
  irAmount: number
  irRate: number
  grossAnnualRate: number
  netAnnualRate: number
  indexRateUsed: number | null
  isTaxExempt: boolean
}

// ─── Planning ────────────────────────────────────────────────────────────────

export interface RetirementRequest {
  monthlyExpenses: number
  currentSavings: number
  monthlySavings: number
  expectedAnnualReturn: number
  withdrawalRate: number
}

export interface RetirementResponse {
  targetAmount: number
  annualExpenses: number
  monthlyRate: number
  monthsToFire: number | null
  yearsToFire: number | null
  remainingMonths: number | null
  alreadyFire: boolean
  projectedAmountAt10Years: number
  projectedAmountAt20Years: number
}

export interface EmergencyRequest {
  monthlyExpenses: number
  monthsCoverage: number
  currentSavings: number
  monthlySavings: number
  expectedAnnualReturn: number
}

export interface EmergencyResponse {
  targetAmount: number
  currentCoverageAmount: number
  currentCoverageMonths: number
  progressPercent: number
  targetReached: boolean
  monthsToComplete: number | null
  monthlyShortfall: number | null
}
