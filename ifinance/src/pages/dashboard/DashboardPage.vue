<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { simulationApi } from '@/services/api/simulation'
import { investmentApi } from '@/services/api/investment'
import { indexesApi } from '@/services/api/indexes'
import { useFormatBR } from '@/composables/useFormatBR'
import MetricCard from '@/components/data/MetricCard.vue'
import IndexRatesWidget from '@/components/data/IndexRatesWidget.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { EconomicIndex } from '@/types'
import type { AmortizationSystem } from '@/types'

const auth = useAuthStore()
const router = useRouter()
const { formatCurrency, formatDate, formatPercent } = useFormatBR()

// Controla quando o widget de índices pode disparar suas queries.
// Aguarda 2 frames para garantir que o conteúdo principal pintou primeiro.
const indexWidgetEnabled = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      indexWidgetEnabled.value = true
    })
  })
})

// Queries de conteúdo principal — disparam imediatamente ao montar
const { data: simulations, isLoading: loadingSimulations } = useQuery({
  queryKey: ['simulations', 'history', 0, 5],
  queryFn: () => simulationApi.getHistory(0, 5),
  staleTime: 2 * 60 * 1000,
})

const { data: investments, isLoading: loadingInvestments } = useQuery({
  queryKey: ['investments', 'history', 0, 5],
  queryFn: () => investmentApi.getHistory(0, 5),
  staleTime: 2 * 60 * 1000,
})

const { data: cdiRate, isLoading: loadingCdi } = useQuery({
  queryKey: ['indexes', 'CDI'],
  queryFn: () => indexesApi.getCurrent(EconomicIndex.CDI),
  staleTime: 10 * 60 * 1000,
})

const totalSimulations = computed(() => simulations.value?.totalElements ?? 0)
const totalInvestments = computed(() => investments.value?.totalElements ?? 0)
const lastSimulationTotal = computed(() => {
  const first = simulations.value?.content[0]
  return first ? formatCurrency(first.totalPaid) : '-'
})

const systemLabels: Record<AmortizationSystem, string> = {
  SAC: 'SAC',
  PRICE: 'PRICE',
  AMERICAN: 'Americano',
  GERMAN: 'Alemão',
  SAM: 'SAM',
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Welcome header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">
        Olá, {{ auth.userName || 'Bem-vindo' }} 👋
      </h1>
      <p class="mt-1 text-sm text-[var(--text-muted)]">
        Aqui está um resumo da sua atividade financeira
      </p>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total de Simulações"
        :value="totalSimulations"
        :loading="loadingSimulations"
        color="primary"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </template>
      </MetricCard>

      <MetricCard
        label="Total de Investimentos"
        :value="totalInvestments"
        :loading="loadingInvestments"
        color="success"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </template>
      </MetricCard>

      <MetricCard
        label="Última Simulação (Total)"
        :value="lastSimulationTotal"
        :loading="loadingSimulations"
        color="warning"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </MetricCard>

      <MetricCard
        label="Índice CDI"
        :value="cdiRate ? formatPercent(cdiRate.annualRate) : '—'"
        :loading="loadingCdi"
        color="default"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M8 16V10m4 6V4m4 12V8" />
          </svg>
        </template>
      </MetricCard>
    </div>

    <!-- Índices econômicos — carregam após o conteúdo principal pintar -->
    <IndexRatesWidget :enabled="indexWidgetEnabled" />

    <!-- Tables row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent simulations -->
      <AppCard :padding="'none'">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Simulações Recentes</h2>
            <button
              class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              @click="router.push('/simulations')"
            >
              Ver todas →
            </button>
          </div>
        </template>

        <div v-if="loadingSimulations" class="p-4 space-y-3">
          <AppSkeleton v-for="i in 3" :key="i" height="36px" />
        </div>
        <div v-else-if="simulations?.content.length" class="divide-y divide-[var(--border-subtle)]">
          <div
            v-for="sim in simulations.content"
            :key="sim.id"
            class="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            @click="router.push(`/simulations/${sim.id}`)"
          >
            <div>
              <p class="text-sm font-medium text-[var(--text-primary)]">{{ sim.name }}</p>
              <p class="text-xs text-[var(--text-muted)]">{{ formatDate(sim.createdAt) }}</p>
            </div>
            <div class="text-right">
              <AppBadge tone="primary" variant="subtle">{{ systemLabels[sim.amortizationSystem] }}</AppBadge>
              <p class="text-xs text-[var(--text-secondary)] mt-1">{{ formatCurrency(sim.totalPaid) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="p-8 text-center text-sm text-[var(--text-muted)]">
          Nenhuma simulação ainda.
          <button class="block mt-2 mx-auto text-indigo-400 hover:underline" @click="router.push('/simulations/new')">
            Criar primeira simulação
          </button>
        </div>
      </AppCard>

      <!-- Recent investments -->
      <AppCard :padding="'none'">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Investimentos Recentes</h2>
            <button
              class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              @click="router.push('/investments')"
            >
              Ver todos →
            </button>
          </div>
        </template>

        <div v-if="loadingInvestments" class="p-4 space-y-3">
          <AppSkeleton v-for="i in 3" :key="i" height="36px" />
        </div>
        <div v-else-if="investments?.content.length" class="divide-y divide-[var(--border-subtle)]">
          <div
            v-for="inv in investments.content"
            :key="inv.id"
            class="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            @click="router.push(`/investments/${inv.id}`)"
          >
            <div>
              <p class="text-sm font-medium text-[var(--text-primary)]">{{ inv.name }}</p>
              <p class="text-xs text-[var(--text-muted)]">{{ formatDate(inv.createdAt) }}</p>
            </div>
            <div class="text-right">
              <AppBadge :tone="inv.isTaxExempt ? 'success' : 'neutral'" variant="subtle">
                {{ inv.investmentType }}
              </AppBadge>
              <p class="text-xs text-emerald-400 mt-1">{{ formatCurrency(inv.netReturn) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="p-8 text-center text-sm text-[var(--text-muted)]">
          Nenhum investimento ainda.
          <button class="block mt-2 mx-auto text-indigo-400 hover:underline" @click="router.push('/investments/new')">
            Criar primeiro investimento
          </button>
        </div>
      </AppCard>
    </div>
  </div>
</template>
