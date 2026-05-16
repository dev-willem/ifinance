import { AmortizationSystem, EconomicIndex, InvestmentType, Periodicity, RateBasis, RateType } from '@/types'

export const API_BASE_URL = '/api/v1'
export const OAUTH_URL = '/oauth2/authorization/google'
export const MAX_COMPARE_ITEMS = 5
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]
export const TOAST_DURATION = 5000

export const AMORTIZATION_SYSTEMS: { value: AmortizationSystem; label: string; description: string }[] = [
  { value: AmortizationSystem.SAC, label: 'SAC', description: 'Sistema de Amortização Constante' },
  { value: AmortizationSystem.PRICE, label: 'PRICE', description: 'Sistema Francês de Amortização' },
  { value: AmortizationSystem.AMERICAN, label: 'Americano', description: 'Sistema Americano de Amortização' },
  { value: AmortizationSystem.GERMAN, label: 'Alemão', description: 'Sistema Alemão de Amortização' },
  { value: AmortizationSystem.SAM, label: 'SAM', description: 'Sistema de Amortização Misto' },
]

export const PERIODICITY_OPTIONS: { value: Periodicity; label: string }[] = [
  { value: Periodicity.MONTHLY, label: 'Mensal' },
  { value: Periodicity.QUARTERLY, label: 'Trimestral' },
  { value: Periodicity.ANNUAL, label: 'Anual' },
]

export const RATE_TYPE_OPTIONS: { value: RateType; label: string }[] = [
  { value: RateType.NOMINAL, label: 'Nominal' },
  { value: RateType.EFFECTIVE, label: 'Efetiva' },
]

export const ECONOMIC_INDEX_OPTIONS: { value: EconomicIndex; label: string }[] = [
  { value: EconomicIndex.IPCA, label: 'IPCA' },
  { value: EconomicIndex.IGP_M, label: 'IGP-M' },
  { value: EconomicIndex.CDI, label: 'CDI' },
  { value: EconomicIndex.SELIC, label: 'SELIC' },
  { value: EconomicIndex.TR, label: 'TR' },
]

export const INVESTMENT_TYPE_OPTIONS: { value: InvestmentType; label: string; description: string }[] = [
  { value: InvestmentType.CDB, label: 'CDB', description: 'Certificado de Depósito Bancário' },
  { value: InvestmentType.LCI, label: 'LCI', description: 'Letra de Crédito Imobiliário' },
  { value: InvestmentType.LCA, label: 'LCA', description: 'Letra de Crédito do Agronegócio' },
  { value: InvestmentType.DEBENTURE, label: 'Debênture', description: 'Debênture Corporativa' },
  { value: InvestmentType.TESOURO_SELIC, label: 'Tesouro Selic', description: 'Tesouro Direto - Selic' },
  { value: InvestmentType.TESOURO_IPCA_PLUS, label: 'Tesouro IPCA+', description: 'Tesouro Direto - IPCA+' },
  { value: InvestmentType.PRE_FIXADO, label: 'Pré-Fixado', description: 'Renda Fixa Pré-Fixada' },
]

export const RATE_BASIS_OPTIONS: { value: RateBasis; label: string }[] = [
  { value: RateBasis.CDI_PERCENT, label: '% do CDI' },
  { value: RateBasis.SELIC_PERCENT, label: '% da Selic' },
  { value: RateBasis.IPCA_PLUS, label: 'IPCA +' },
  { value: RateBasis.PRE_FIXADO, label: 'Pré-Fixado' },
]

export const IR_TABLE: { minDays: number; maxDays: number | null; rate: number; label: string }[] = [
  { minDays: 0, maxDays: 180, rate: 0.225, label: 'Até 180 dias: 22,5%' },
  { minDays: 181, maxDays: 360, rate: 0.20, label: '181 a 360 dias: 20%' },
  { minDays: 361, maxDays: 720, rate: 0.175, label: '361 a 720 dias: 17,5%' },
  { minDays: 721, maxDays: null, rate: 0.15, label: 'Acima de 720 dias: 15%' },
]

export const TAX_EXEMPT_INVESTMENTS: InvestmentType[] = [
  InvestmentType.LCI,
  InvestmentType.LCA,
]

export const NAV_ITEMS = [
  {
    section: 'Visão Geral',
    items: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
    ],
  },
  {
    section: 'Simulações',
    items: [
      { label: 'Simulações', path: '/simulations', icon: 'Calculator' },
      { label: 'Nova Simulação', path: '/simulations/new', icon: 'Plus' },
      { label: 'Comparar', path: '/simulations/compare', icon: 'GitCompare' },
    ],
  },
  {
    section: 'Investimentos',
    items: [
      { label: 'Investimentos', path: '/investments', icon: 'TrendingUp' },
      { label: 'Novo Investimento', path: '/investments/new', icon: 'Plus' },
      { label: 'Comparar (salvos)', path: '/investments/compare', icon: 'GitCompare' },
      { label: 'Comparar Produtos', path: '/investments/compare-direct', icon: 'Zap' },
    ],
  },
  {
    section: 'Análise',
    items: [
      { label: 'Análise (NPV/IRR)', path: '/analysis', icon: 'BarChart3' },
    ],
  },
  {
    section: 'Planejamento',
    items: [
      { label: 'Aposentadoria FIRE', path: '/planning/retirement', icon: 'Flame' },
      { label: 'Reserva de Emergência', path: '/planning/emergency', icon: 'Shield' },
    ],
  },
] as const
