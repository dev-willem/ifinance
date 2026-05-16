<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { simulationApi } from '@/services/api/simulation'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import { MAX_COMPARE_ITEMS } from '@/core/constants'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import type { TableColumn, SimulationListItem, AmortizationSystem } from '@/types'

const router = useRouter()
const { formatCurrency, formatPercent, formatDate } = useFormatBR()
const toast = useToast()

const currentPage = ref(0)
const pageSize = ref(10)
const selectedIds = ref<string[]>([])
const filterSystem = ref('')

const { data, isLoading, error } = useQuery({
  queryKey: computed(() => ['simulations', 'history', currentPage.value, pageSize.value]),
  queryFn: () => simulationApi.getHistory(currentPage.value, pageSize.value),
})

const systemOptions = [
  { value: '', label: 'Todos os sistemas' },
  { value: 'SAC', label: 'SAC' },
  { value: 'PRICE', label: 'PRICE' },
  { value: 'AMERICAN', label: 'Americano' },
  { value: 'GERMAN', label: 'Alemão' },
  { value: 'SAM', label: 'SAM' },
]

const filteredData = computed(() => {
  if (!data.value) return []
  if (!filterSystem.value) return data.value.content
  return data.value.content.filter((s) => s.amortizationSystem === filterSystem.value)
})

const columns: TableColumn[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'amortizationSystem', label: 'Sistema', align: 'center' },
  { key: 'principal', label: 'Capital', align: 'right', sortable: true },
  { key: 'term', label: 'Prazo', align: 'center' },
  { key: 'totalPaid', label: 'Total Pago', align: 'right', sortable: true },
  { key: 'cet', label: 'CET a.a.', align: 'right' },
  { key: 'createdAt', label: 'Data', align: 'center', sortable: true },
  { key: 'actions', label: 'Ações', align: 'center' },
]

const systemBadgeTone: Record<AmortizationSystem, 'primary' | 'success' | 'info' | 'warning' | 'neutral'> = {
  SAC: 'primary',
  PRICE: 'success',
  AMERICAN: 'info',
  GERMAN: 'warning',
  SAM: 'neutral',
}

function handleSelect(ids: string[]) {
  if (ids.length > MAX_COMPARE_ITEMS) {
    toast.warning(`Máximo de ${MAX_COMPARE_ITEMS} simulações para comparação.`)
    return
  }
  selectedIds.value = ids
}

function handleCompare() {
  if (selectedIds.value.length < 2) {
    toast.warning('Selecione pelo menos 2 simulações para comparar.')
    return
  }
  router.push(`/simulations/compare?ids=${selectedIds.value.join(',')}`)
}

async function handleExport(id: string, format: 'pdf' | 'xlsx') {
  try {
    const blob = await simulationApi.exportSimulation(id, format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulacao-${id}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exportação concluída!')
  } catch {
    toast.error('Erro ao exportar simulação.')
  }
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Simulações</h1>
        <p class="text-sm text-[var(--text-muted)]">
          {{ data?.totalElements ?? 0 }} simulações no total
        </p>
      </div>
      <div class="flex items-center gap-3">
        <AppButton
          v-if="selectedIds.length >= 2"
          variant="secondary"
          size="sm"
          @click="handleCompare"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </template>
          Comparar ({{ selectedIds.length }})
        </AppButton>

        <AppButton @click="router.push('/simulations/new')">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Nova Simulação
        </AppButton>
      </div>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <AppSelect
            v-model="filterSystem"
            :options="systemOptions"
            placeholder="Filtrar por sistema"
          />
        </div>
        <AppButton
          v-if="selectedIds.length > 0"
          variant="ghost"
          size="md"
          @click="selectedIds = []"
        >
          Limpar seleção ({{ selectedIds.length }})
        </AppButton>
      </div>
    </AppCard>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="isLoading"
      :total-items="data?.totalElements ?? 0"
      :current-page="currentPage"
      :page-size="pageSize"
      :selectable="true"
      :selected-ids="selectedIds"
      empty-title="Nenhuma simulação encontrada"
      empty-description="Crie sua primeira simulação de financiamento."
      @page-change="currentPage = $event"
      @page-size-change="pageSize = $event"
      @row-click="router.push(`/simulations/${$event.id}`)"
      @select="handleSelect"
    >
      <template #name="{ row }">
        <span class="font-medium text-[var(--text-primary)]">{{ row.name }}</span>
      </template>

      <template #amortizationSystem="{ value }">
        <AppBadge :tone="systemBadgeTone[value as AmortizationSystem]" variant="subtle">
          {{ value }}
        </AppBadge>
      </template>

      <template #principal="{ value }">
        <span class="font-mono text-xs">{{ formatCurrency(value as number) }}</span>
      </template>

      <template #term="{ row }">
        <span class="text-[var(--text-muted)]">{{ row.term }}x</span>
      </template>

      <template #totalPaid="{ value }">
        <span class="font-mono text-xs font-medium">{{ formatCurrency(value as number) }}</span>
      </template>

      <template #cet="{ row }">
        <span class="font-mono text-xs text-amber-400">
          {{ row.cet ? formatPercent(row.cet.annualRate * 100) : '-' }}
        </span>
      </template>

      <template #createdAt="{ value }">
        <span class="text-[var(--text-muted)] text-xs">{{ formatDate(value as string) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-center gap-1" @click.stop>
          <button
            class="rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="Visualizar"
            @click="router.push(`/simulations/${row.id}`)"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            class="rounded p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Exportar PDF"
            @click="handleExport(row.id, 'pdf')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            class="rounded p-1.5 text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Exportar Excel"
            @click="handleExport(row.id, 'xlsx')"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      </template>
    </AppTable>

    <!-- Error state -->
    <div v-if="error" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
      Erro ao carregar simulações. Tente novamente.
    </div>
  </div>
</template>
