import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    layout?: 'dashboard' | 'auth' | 'none'
  }
}

const routes: RouteRecordRaw[] = [
  // Auth routes
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { title: 'Login', requiresAuth: false, layout: 'auth' },
  },
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
    component: () => import('@/pages/dashboard/DashboardPage.vue'),
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
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  return next()
})

export default router