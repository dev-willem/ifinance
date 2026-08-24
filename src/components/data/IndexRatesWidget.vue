<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { indexesApi } from '@/services/api/indexes'
import { useFormatBR } from '@/composables/useFormatBR'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import type { EconomicIndex } from '@/types'

const props = withDefaults(defineProps<{ enabled?: boolean }>(), {
  enabled: true,
})

const { formatPercent } = useFormatBR()

const { data: rates, isLoading } = useQuery({
  queryKey: ['indexes', 'all'],
  queryFn: () => indexesApi.getAllCurrent(),
  // Índices econômicos mudam pouco — cache por 10 minutos
  staleTime: 10 * 60 * 1000,
  // Só dispara quando o pai indicar que o conteúdo principal já pintou
  enabled: computed(() => props.enabled),
  // Não refetch ao mudar de aba — usa cache se disponível
  refetchOnWindowFocus: false,
})

const indexLabels: Record<EconomicIndex, string> = {
  IPCA: 'IPCA',
  CDI: 'CDI',
  SELIC: 'Selic',
  TR: 'TR',
  IGP_M: 'IGP-M',
}
</script>

<template>
  <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-[var(--text-secondary)]">Índices Econômicos</h3>
      <span class="text-xs text-[var(--text-muted)]">Fonte: BCB</span>
    </div>

    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <AppSkeleton v-for="i in 5" :key="i" height="64px" rounded="lg" />
    </div>

    <div v-else-if="rates" class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div
        v-for="rate in rates"
        :key="rate.index"
        class="flex flex-col gap-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3"
      >
        <span class="text-xs font-medium text-[var(--text-muted)]">
          {{ indexLabels[rate.index] }}
        </span>
        <span class="text-base font-bold text-[var(--text-primary)]">
          {{ formatPercent(rate.annualRate) }}
        </span>
        <span class="text-xs text-[var(--text-muted)]">ao ano</span>
      </div>
    </div>

    <div v-else class="text-sm text-[var(--text-muted)] text-center py-4">
      Índices indisponíveis no momento.
    </div>
  </div>
</template>
