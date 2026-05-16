export enum AmortizationSystem {
  SAC = 'SAC',
  PRICE = 'PRICE',
  AMERICAN = 'AMERICAN',
  GERMAN = 'GERMAN',
  SAM = 'SAM',
}

export enum Periodicity {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum RateType {
  NOMINAL = 'NOMINAL',
  EFFECTIVE = 'EFFECTIVE',
}

export enum InvestmentType {
  CDB = 'CDB',
  LCI = 'LCI',
  LCA = 'LCA',
  DEBENTURE = 'DEBENTURE',
  TESOURO_SELIC = 'TESOURO_SELIC',
  TESOURO_IPCA_PLUS = 'TESOURO_IPCA_PLUS',
  PRE_FIXADO = 'PRE_FIXADO',
}

export enum RateBasis {
  CDI_PERCENT = 'CDI_PERCENT',
  SELIC_PERCENT = 'SELIC_PERCENT',
  IPCA_PLUS = 'IPCA_PLUS',
  PRE_FIXADO = 'PRE_FIXADO',
}

export enum EconomicIndex {
  IPCA = 'IPCA',
  CDI = 'CDI',
  SELIC = 'SELIC',
  TR = 'TR',
  IGP_M = 'IGP_M',
}

export enum ChargeType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export interface User {
  id: string
  name: string
  email: string
  picture?: string
  roles: string[]
  createdAt: string
}

export interface NavItem {
  label: string
  path: string
  icon: string
  children?: NavItem[]
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  formatter?: (value: unknown) => string
}

export interface SortState {
  key: string
  direction: 'asc' | 'desc'
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}
