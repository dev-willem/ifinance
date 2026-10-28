import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresRole?: User['role']
    layout?: 'dashboard' | 'auth' | 'none'
  }
}

const routes: RouteRecordRaw[] = [
  // Auth routes
  { path: '/login', redirect: '/' },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/pages/auth/CallbackPage.vue'),
    meta: { title: 'Autenticando...', requiresAuth: false, layout: 'none' },
  },

  // Dashboard
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: 'Dashboard', requiresAuth: true, layout: 'dashboard' },
  },

  // Simulations
  {
    path: '/simulations',
    name: 'simulations',
    component: () => import('@/pages/simulations/SimulationListPage.vue'),
    meta: { title: 'Simulações', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/simulations/new',
    name: 'simulations-new',
    component: () => import('@/pages/simulations/SimulationNewPage.vue'),
    meta: { title: 'Nova Simulação', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/simulations/compare',
    name: 'simulations-compare',
    component: () => import('@/pages/simulations/SimulationComparePage.vue'),
    meta: { title: 'Comparar Simulações', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/simulations/:id',
    name: 'simulation-detail',
    component: () => import('@/pages/simulations/SimulationDetailPage.vue'),
    meta: { title: 'Detalhes da Simulação', requiresAuth: true, layout: 'dashboard' },
  },

  // Investments
  {
    path: '/investments',
    name: 'investments',
    component: () => import('@/pages/investments/InvestmentListPage.vue'),
    meta: { title: 'Investimentos', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/investments/new',
    name: 'investments-new',
    component: () => import('@/pages/investments/InvestmentNewPage.vue'),
    meta: { title: 'Novo Investimento', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/investments/compare',
    name: 'investments-compare',
    component: () => import('@/pages/investments/InvestmentComparePage.vue'),
    meta: { title: 'Comparar Investimentos', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/investments/compare-direct',
    name: 'investments-compare-direct',
    component: () => import('@/pages/investments/InvestmentDirectComparePage.vue'),
    meta: { title: 'Comparar Produtos', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/investments/:id',
    name: 'investment-detail',
    component: () => import('@/pages/investments/InvestmentDetailPage.vue'),
    meta: { title: 'Detalhes do Investimento', requiresAuth: true, layout: 'dashboard' },
  },

  // Analysis
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('@/pages/analysis/AnalysisPage.vue'),
    meta: { title: 'Análise NPV/TIR', requiresAuth: true, layout: 'dashboard' },
  },

  // Planning
  {
    path: '/planning/retirement',
    name: 'planning-retirement',
    component: () => import('@/pages/planning/RetirementPage.vue'),
    meta: { title: 'Aposentadoria FIRE', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/planning/emergency',
    name: 'planning-emergency',
    component: () => import('@/pages/planning/EmergencyPage.vue'),
    meta: { title: 'Reserva de Emergência', requiresAuth: true, layout: 'dashboard' },
  },

  // Credit
  {
    path: '/credit/capacity',
    name: 'credit-capacity',
    component: () => import('@/pages/credit/CreditCapacityPage.vue'),
    meta: { title: 'Capacidade de Crédito', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/credit/discount',
    name: 'credit-discount',
    component: () => import('@/pages/credit/DiscountPage.vue'),
    meta: { title: 'Desconto de Títulos', requiresAuth: true, layout: 'dashboard' },
  },

  // Risk
  {
    path: '/risk/metrics',
    name: 'risk-metrics',
    component: () => import('@/pages/risk/RiskMetricsPage.vue'),
    meta: { title: 'Métricas de Risco', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/risk/monte-carlo',
    name: 'risk-monte-carlo',
    component: () => import('@/pages/risk/MonteCarloPage.vue'),
    meta: { title: 'Monte Carlo', requiresAuth: true, layout: 'dashboard' },
  },

  // Business
  {
    path: '/business/income-statement',
    name: 'business-income-statement',
    component: () => import('@/pages/business/IncomeStatementPage.vue'),
    meta: { title: 'DRE Simulada', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/business/break-even',
    name: 'business-break-even',
    component: () => import('@/pages/business/BreakEvenPage.vue'),
    meta: { title: 'Ponto de Equilíbrio', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/business/markup',
    name: 'business-markup',
    component: () => import('@/pages/business/MarkupPage.vue'),
    meta: { title: 'Markup e Preço de Venda', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/business/depreciation',
    name: 'business-depreciation',
    component: () => import('@/pages/business/DepreciationPage.vue'),
    meta: { title: 'Depreciação', requiresAuth: true, layout: 'dashboard' },
  },

  // Tax
  {
    path: '/tax/simples',
    name: 'tax-simples',
    component: () => import('@/pages/tax/SimplesNacionalPage.vue'),
    meta: { title: 'Simples Nacional', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/tax/compare',
    name: 'tax-compare',
    component: () => import('@/pages/tax/TaxRegimeComparePage.vue'),
    meta: { title: 'Comparar Regimes Tributários', requiresAuth: true, layout: 'dashboard' },
  },

  // Labor
  {
    path: '/labor/net-salary',
    name: 'labor-net-salary',
    component: () => import('@/pages/labor/NetSalaryPage.vue'),
    meta: { title: 'Salário Líquido', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/labor/vacation',
    name: 'labor-vacation',
    component: () => import('@/pages/labor/VacationPage.vue'),
    meta: { title: 'Férias', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/labor/thirteenth',
    name: 'labor-thirteenth',
    component: () => import('@/pages/labor/ThirteenthPage.vue'),
    meta: { title: '13º Salário', requiresAuth: true, layout: 'dashboard' },
  },
  {
    path: '/labor/termination',
    name: 'labor-termination',
    component: () => import('@/pages/labor/TerminationPage.vue'),
    meta: { title: 'Rescisão', requiresAuth: true, layout: 'dashboard' },
  },

  // Admin
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/pages/admin/AdminUsersPage.vue'),
    meta: { title: 'Usuários', requiresAuth: true, requiresRole: 'ADMIN', layout: 'dashboard' },
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'Página não encontrada', requiresAuth: false, layout: 'none' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach(async (to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} — iFinance` : 'iFinance'

  if (!to.meta.requiresAuth) return next()

  const authStore = useAuthStore()

  // init() usa a promise que já foi disparada no main.ts.
  // Se já estiver resolvida, retorna instantaneamente.
  // Se ainda estiver em voo, aguarda sem fazer nova requisição.
  await authStore.init()

  if (!authStore.isAuthenticated) {
    // Login é servido na própria "/" (HomePage); o destino fica guardado para depois do OAuth
    if (to.path === '/') {
      document.title = 'Login — iFinance'
      return next()
    }
    sessionStorage.setItem('auth:redirect', to.fullPath)
    return next('/')
  }

  // A API também nega (403); o guard só evita abrir a página para quem não tem o perfil
  if (to.meta.requiresRole && authStore.role !== to.meta.requiresRole) return next('/')

  return next()
})

export default router