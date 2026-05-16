<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueries } from '@tanstack/vue-query'
import { investmentApi } from '@/services/api/investment'
import { useFormatBR } from '@/composables/useFormatBR'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

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
      queryKey: ['investments', id] as const,
      queryFn: () => investmentApi.getById(id),
    })),
  ),
})

const investments = computed(() => queries.value.map((q) => q.data).filter(Boolean))
const isLoading = computed(() => queries.value.some((q) => q.isLoading))

const rows = [
  { label: 'Tipo', key: 'investmentType', fmt: (v: unknown) => String(v) },
  { label: 'Base da Taxa', key: 'rateBasis', fmt: (v: unknown) => String(v) },
  { label: 'Taxa', key: 'rateValue', fmt: (v: unknown) => `${v}%` },
  { label: 'Capital', key: 'principal', fmt: (v: unknown) => formatCurrency(v as number) },
  { label: 'Prazo', key: 'termDays', fmt: (v: unknown) => `${v} dias` },
  { label: 'Rend. Bruto', key: 'grossReturn', fmt: (v: unknown) => `+${formatCurrency(v as number)}` },
  { label: 'Rend. Líquido', key: 'netReturn', fmt: (v: unknown) => `+${formatCurrency(v as number)}` },
  { label: 'Taxa Bruta a.a.', key: 'grossAnnualRate', fmt: (v: unknown) => formatPercent((v as number) * 100) },
  { label: 'Taxa Líquida a.a.', key: 'netAnnualRate', fmt: (v: unknown) => formatPercent((v as number) * 100) },
  { label: 'IR', key: 'irRate', fmt: (v: unknown) => formatPercent((v as number) * 100) },
  { label: 'Isento IR', key: 'isTaxExempt', fmt: (v: unknown) => (v ? 'Sim' : 'Não') },
] as const
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
        Comparar Investimentos ({{ ids.length }})
      </h1>
    </div>

    <div v-if="ids.length < 2" class="text-center py-16 text-[var(--text-muted)]">
      Selecione pelo menos 2 investimentos para comparar.
      <AppButton class="mt-4" variant="secondary" @click="router.push('/investments')">
        Ir para Investimentos
      </AppButton>
    </div>

    <template v-else>
      <div v-if="isLoading" class="space-y-3">
        <AppSkeleton v-for="i in 9" :key="i" height="44px" />
      </div>

      <AppCard v-else :padding="'none'">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
                <th class="px-5 py-4 text-left font-medium text-[var(--text-muted)] w-40">Métrica</th>
                <th
                  v-for="inv in investments"
                  :key="inv!.id"
                  class="px-5 py-4 text-center"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span class="font-semibold text-[var(--text-primary)] truncate max-w-[140px]">{{ inv!.name }}</span>
                    <div class="flex items-center gap-1">
                      <AppBadge tone="info" variant="subtle">{{ inv!.investmentType }}</AppBadge>
                      <AppBadge v-if="inv!.isTaxExempt" tone="success" variant="subtle">Isento IR</AppBadge>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-subtle)]">
              <tr
                v-for="row in rows"
                :key="row.key"
                class="hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <td class="px-5 py-3.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">
                  {{ row.label }}
                </td>
                <td
                  v-for="inv in investments"
                  :key="inv!.id"
                  class="px-5 py-3.5 text-center font-mono text-[var(--text-secondary)]"
                  :class="[
                    row.key === 'netReturn' || row.key === 'netAnnualRate' ? 'text-emerald-400 font-semibold' : '',
                    row.key === 'grossReturn' ? 'text-emerald-300' : '',
                    row.key === 'irRate' ? 'text-amber-400' : '',
                  ]"
                >
                  {{ row.fmt(inv![row.key as keyof typeof inv]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>
