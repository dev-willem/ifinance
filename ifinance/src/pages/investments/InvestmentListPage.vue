<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { investmentApi } from '@/services/api/investment'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import { MAX_COMPARE_ITEMS } from '@/core/constants'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { TableColumn, InvestmentListItem } from '@/types'

const router = useRouter()
const { formatCurrency, formatPercent, formatDate } = useFormatBR()
const toast = useToast()

const currentPage = ref(0)
const pageSize = ref(10)
const selectedIds = ref<string[]>([])

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['investments', 'history', currentPage.value, pageSize.value]),
  queryFn: () => investmentApi.getHistory(currentPage.value, pageSize.value),
})

const columns: TableColumn[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'investmentType', label: 'Tipo', align: 'center' },
  { key: 'principal', label: 'Capital', align: 'right', sortable: true },
  { key: 'termDays', label: 'Prazo (dias)', align: 'center' },
  { key: 'grossReturn', label: 'Rend. Bruto', align: 'right' },
  { key: 'netReturn', label: 'Rend. Líquido', align: 'right' },
  { key: 'irRate', label: 'IR', align: 'center' },
  { key: 'isTaxExempt', label: 'Isento IR', align: 'center' },
  { key: 'createdAt', label: 'Data', align: 'center' },
  { key: 'actions', label: 'Ações', align: 'center' },
]

function handleSelect(ids: string[]) {
  if (ids.length > MAX_COMPARE_ITEMS) {
    toast.warning(`Máximo de ${MAX_COMPARE_ITEMS} itens para comparação.`)
    return
  }
  selectedIds.value = ids
}

function handleCompare() {
  if (selectedIds.value.length < 2) {
    toast.warning('Selecione pelo menos 2 investimentos para comparar.')
    return
  }
  router.push(`/investments/compare?ids=${selectedIds.value.join(',')}`)
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Investimentos</h1>
        <p class="text-sm text-[var(--text-muted)]">{{ data?.totalElements ?? 0 }} investimentos no total</p>
      </div>
      <div class="flex items-center gap-3">
        <AppButton
          v-if="selectedIds.length >= 2"
          variant="secondary"
          size="sm"
          @click="handleCompare"
        >
          Comparar ({{ selectedIds.length }})
        </AppButton>
        <AppButton @click="router.push('/investments/new')">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Novo Investimento
        </AppButton>
      </div>
    </div>

    <AppTable
      :columns="columns"
      :data="data?.content ?? []"
      :loading="isLoading"
      :total-items="data?.totalElements ?? 0"
      :current-page="currentPage"
      :page-size="pageSize"
      :selectable="true"
      :selected-ids="selectedIds"
      empty-title="Nenhum investimento encontrado"
      empty-description="Crie seu primeiro investimento."
      @page-change="currentPage = $event"
      @page-size-change="pageSize = $event"
      @row-click="router.push(`/investments/${$event.id}`)"
      @select="handleSelect"
    >
      <template #name="{ row }">
        <span class="font-medium text-[var(--text-primary)]">{{ row.name }}</span>
      </template>

      <template #investmentType="{ value }">
        <AppBadge tone="info" variant="subtle">{{ value }}</AppBadge>
      </template>

      <template #principal="{ value }">
        <span class="font-mono text-xs">{{ formatCurrency(value as number) }}</span>
      </template>

      <template #termDays="{ value }">
        <span class="text-[var(--text-muted)]">{{ value }}d</span>
      </template>

      <template #grossReturn="{ value }">
        <span class="font-mono text-xs text-emerald-400">+{{ formatCurrency(value as number) }}</span>
      </template>

      <template #netReturn="{ value }">
        <span class="font-mono text-xs text-emerald-500 font-semibold">+{{ formatCurrency(value as number) }}</span>
      </template>

      <template #irRate="{ value }">
        <span class="text-xs text-amber-400">{{ formatPercent((value as number) * 100) }}</span>
      </template>

      <template #isTaxExempt="{ value }">
        <AppBadge :tone="value ? 'success' : 'neutral'" :dot="true" variant="subtle">
          {{ value ? 'Isento' : 'Tributado' }}
        </AppBadge>
      </template>

      <template #createdAt="{ value }">
        <span class="text-[var(--text-muted)] text-xs">{{ formatDate(value as string) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1" @click.stop>
          <button
            class="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            @click="router.push(`/investments/${row.id}`)"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </template>
    </AppTable>
  </div>
</template>
