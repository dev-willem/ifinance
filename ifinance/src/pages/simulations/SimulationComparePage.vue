<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueries } from '@tanstack/vue-query'
import { simulationApi } from '@/services/api/simulation'
import { useFormatBR } from '@/composables/useFormatBR'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { AmortizationSystem } from '@/types'

const route = useRoute()
const router = useRouter()
const { formatCurrency, formatPercent } = useFormatBR()

const ids = computed(() => {
  const param = route.query['ids']
  if (!param) return []
  return String(param).split(',').filter(Boolean)
})

const queries = useQueries({
  queries: computed(() =>
    ids.value.map((id) => ({
      queryKey: ['simulations', id] as const,
      queryFn: () => simulationApi.getById(id),
    })),
  ),
})

const simulations = computed(() => queries.value.map((q) => q.data).filter(Boolean))
const isLoading = computed(() => queries.value.some((q) => q.isLoading))

const systemBadge: Record<AmortizationSystem, 'primary' | 'success' | 'info' | 'warning' | 'neutral'> = {
  SAC: 'primary', PRICE: 'success', AMERICAN: 'info', GERMAN: 'warning', SAM: 'neutral',
}

const comparisonRows = [
  { label: 'Sistema', key: 'amortizationSystem', formatter: (v: unknown) => String(v) },
  { label: 'Capital', key: 'principal', formatter: (v: unknown) => formatCurrency(v as number) },
  { label: 'Taxa (%)', key: 'interestRate', formatter: (v: unknown) => `${v}%` },
  { label: 'Prazo', key: 'term', formatter: (v: unknown) => `${v} períodos` },
  { label: 'Total Pago', key: 'totalPaid', formatter: (v: unknown) => formatCurrency(v as number) },
  { label: 'Total Juros', key: 'totalInterest', formatter: (v: unknown) => formatCurrency(v as number) },
  {
    label: 'CET (a.a.)',
    key: 'cet',
    formatter: (v: unknown) => {
      const cet = v as { annualRate: number } | null
      return cet ? formatPercent(cet.annualRate * 100) : '-'
    },
  },
] as const

function getBestValue(key: string): number {
  const values = simulations.value.map((s) => {
    if (!s) return Infinity
    const v = s[key as keyof typeof s]
    return typeof v === 'number' ? v : (v as { annualRate?: number } | null)?.annualRate ?? Infinity
  })
  return Math.min(...values)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center gap-4">
      <button
        class="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-colors"
        @click="router.back()"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">
        Comparar Simulações ({{ ids.length }})
      </h1>
    </div>

    <div v-if="ids.length < 2" class="text-center py-16 text-[var(--text-muted)]">
      Selecione pelo menos 2 simulações para comparar.
      <AppButton class="mt-4" variant="secondary" @click="router.push('/simulations')">
        Ir para Simulações
      </AppButton>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="isLoading" class="space-y-3">
        <AppSkeleton v-for="i in 7" :key="i" height="44px" />
      </div>

      <AppCard v-else :padding="'none'">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
                <th class="px-5 py-4 text-left font-medium text-[var(--text-muted)] w-40">Métrica</th>
                <th
                  v-for="sim in simulations"
                  :key="sim!.id"
                  class="px-5 py-4 text-center"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="font-semibold text-[var(--text-primary)] truncate max-w-[140px]">{{ sim!.name }}</span>
                    <AppBadge :tone="systemBadge[sim!.amortizationSystem]" variant="subtle">
                      {{ sim!.amortizationSystem }}
                    </AppBadge>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-subtle)]">
              <tr
                v-for="row in comparisonRows"
                :key="row.key"
                class="hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <td class="px-5 py-3.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">
                  {{ row.label }}
                </td>
                <td
                  v-for="sim in simulations"
                  :key="sim!.id"
                  class="px-5 py-3.5 text-center font-mono"
                  :class="[
                    row.key === 'totalPaid' || row.key === 'totalInterest' || row.key === 'cet'
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)]',
                  ]"
                >
                  {{ row.formatter(sim![row.key as keyof typeof sim]) }}
                </td>
              </tr>

              <!-- First installment -->
              <tr class="hover:bg-[var(--bg-card-hover)] transition-colors">
                <td class="px-5 py-3.5 font-medium text-[var(--text-secondary)]">1ª Parcela</td>
                <td
                  v-for="sim in simulations"
                  :key="sim!.id"
                  class="px-5 py-3.5 text-center font-mono text-[var(--text-primary)]"
                >
                  {{ sim!.installments[0] ? formatCurrency(sim!.installments[0].total) : '-' }}
                </td>
              </tr>

              <!-- Last installment -->
              <tr class="hover:bg-[var(--bg-card-hover)] transition-colors">
                <td class="px-5 py-3.5 font-medium text-[var(--text-secondary)]">Última Parcela</td>
                <td
                  v-for="sim in simulations"
                  :key="sim!.id"
                  class="px-5 py-3.5 text-center font-mono text-[var(--text-primary)]"
                >
                  {{ sim!.installments.at(-1) ? formatCurrency(sim!.installments.at(-1)!.total) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>
