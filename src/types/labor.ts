export type PayslipLineType = 'EARNING' | 'DEDUCTION'

export interface PayslipLine {
  description: string
  reference: string | null
  type: PayslipLineType
  amount: number
  /** Earnings only: whether INSS/IRRF apply. */
  taxable: boolean | null
}

export interface InssBracketShare {
  from: number
  upTo: number
  rate: number
  taxedAmount: number
  contribution: number
}

export interface InssResult {
  contributionBase: number
  brackets: InssBracketShare[]
  total: number
  effectiveRate: number
}

export type DeductionMethod = 'LEGAL' | 'SIMPLIFIED'

export interface IrrfResult {
  taxableIncome: number
  inssDeduction: number
  dependentsDeduction: number
  alimonyDeduction: number
  legalDeductions: number
  simplifiedDiscount: number
  deductionMethod: DeductionMethod
  deductionApplied: number
  base: number
  rate: number
  bracketDeduction: number
  taxBeforeReduction: number
  reduction: number
  tax: number
  effectiveRate: number
}

export interface NetSalaryRequest {
  grossSalary: number
  dependents: number
  alimony?: number
  otherDiscounts?: number
  /** Decimal (0.20 = 20%). */
  employerInssRate?: number
  year?: number
}

export interface EmployerCost {
  salary: number
  fgts: number
  employerInssRate: number
  employerInss: number
  thirteenthProvision: number
  vacationProvision: number
  provisionCharges: number
  total: number
  costToSalaryRatio: number
}

export interface NetSalaryResponse {
  year: number
  grossSalary: number
  inss: InssResult
  irrf: IrrfResult
  alimony: number
  otherDiscounts: number
  totalDeductions: number
  netSalary: number
  fgts: number
  totalTaxEffectiveRate: number
  employerCost: EmployerCost
  lines: PayslipLine[]
}

export interface VacationRequest {
  monthlySalary: number
  averageVariablePay?: number
  days: number
  soldDays: number
  dependents: number
  year?: number
}

export interface VacationResponse {
  year: number
  remuneration: number
  days: number
  soldDays: number
  vacationPay: number
  vacationBonus: number
  allowance: number
  allowanceBonus: number
  taxableTotal: number
  inss: InssResult
  irrf: IrrfResult
  grossTotal: number
  totalDeductions: number
  netTotal: number
  lines: PayslipLine[]
}

export interface ThirteenthRequest {
  monthlySalary: number
  averageVariablePay?: number
  monthsWorked: number
  dependents: number
  year?: number
}

export interface ThirteenthResponse {
  year: number
  remuneration: number
  monthsWorked: number
  grossTotal: number
  firstInstallment: number
  secondInstallmentGross: number
  inss: InssResult
  irrf: IrrfResult
  secondInstallment: number
  totalDeductions: number
  netTotal: number
  lines: PayslipLine[]
}

export type TerminationType =
  | 'WITHOUT_CAUSE'
  | 'RESIGNATION'
  | 'WITH_CAUSE'
  | 'MUTUAL_AGREEMENT'
  | 'END_OF_FIXED_TERM'

export type NoticeType = 'WORKED' | 'INDEMNIFIED' | 'NOT_SERVED'

export interface TerminationRequest {
  monthlySalary: number
  admissionDate: string
  terminationDate: string
  terminationType: TerminationType
  noticeType?: NoticeType
  expiredVacationPeriods: number
  fgtsBalance?: number
  dependents: number
  year?: number
}

export interface FgtsSummary {
  balance: number
  balanceEstimated: boolean
  terminationDeposit: number
  fineRate: number
  fine: number
  withdrawalRate: number
  withdrawableAmount: number
}

export interface TerminationResponse {
  year: number
  terminationType: TerminationType
  noticeType: NoticeType | null
  completeYearsOfService: number
  noticeDays: number
  indemnifiedNoticeDays: number
  projectedEndDate: string
  salaryBalanceDays: number
  thirteenthMonths: number
  vacationMonths: number
  lines: PayslipLine[]
  salaryInss: InssResult
  salaryIrrf: IrrfResult
  thirteenthInss: InssResult
  thirteenthIrrf: IrrfResult
  fgts: FgtsSummary
  unemploymentInsuranceEligible: boolean
  notes: string[]
  grossTotal: number
  totalDeductions: number
  netTotal: number
}
