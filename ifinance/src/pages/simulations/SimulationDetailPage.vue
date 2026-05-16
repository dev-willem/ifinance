<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { simulationApi } from '@/services/api/simulation'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AmortizationTable from '@/components/data/AmortizationTable.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { formatCurrency, formatPercent, formatDate } = useFormatBR()

const id = route.params['id'] as string
const prepaymentPeriod = ref<number>(1)
const snapshotModalOpen = ref(false)
const snapshotName = ref('')

const { data: simulation, isLoading, error } = useQuery({
  queryKey: ['simulations', id],
  queryFn: () => simulationApi.getById(id),
})

const { data: prepayment, isLoading: loadingPrepayment, refetch: refetchPrepayment } = useQuery({
  queryKey: ['simulations', id, 'prepayment', prepaymentPeriod.value],
  queryFn: () => simulationApi.getPrepayment(id, prepaymentPeriod.value),
  enabled: false,
})

const { data: snapshots } = useQuery({
  queryKey: ['simulations', id, 'snapshots'],
  queryFn: () => simulationApi.getSnapshots(id),
})

async function handleExport(format: 'pdf' | 'xlsx') {
  try {
    const blob = await simulationApi.exportSimulation(id, format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulacao-${id}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exportação ${format.toUpperCase()} concluída!`)
  } catch {
    toast.error('Erro ao exportar.')
  }
}

async function handleCreateSnapshot() {
  if (!snapshotName.value.trim()) {
    toast.warning('Informe um nome para o snapshot.')
    return
  }
  try {
    await simulationApi.createSnapshot(id, snapshotName.value)
    toast.success('Snapshot criado!')
    snapshotModalOpen.value = false
    snapshotName.value = ''
  } catch {
    toast.error('Erro ao criar snapshot.')
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-colors"
          @click="router.back()"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <AppSkeleton v-if="isLoading" width="200px" height="28px" />
          <h1 v-else class="text-2xl font-bold text-[var(--text-primary)]">{{ simulation?.name }}</h1>
          <AppSkeleton v-if="isLoading" width="120px" height="16px" class="mt-1" />
          <p v-else class="text-sm text-[var(--text-muted)]">
            Criada em {{ formatDate(simulation?.createdAt) }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AppButton variant="secondary" size="sm" @click="snapshotModalOpen = true">
          Snapshot
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleExport('pdf')">
          PDF
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleExport('xlsx')">
          Excel
        </AppButton>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppSkeleton v-for="i in 4" :key="i" height="80px" rounded="lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-sm text-rose-400">
      Erro ao carregar simulação.
      <button class="block mt-2 mx-auto underline" @click="router.back()">Voltar</button>
    </div>

    <!-- Content -->
    <template v-else-if="simulation">
      <!-- Summary metrics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Capital</p>
          <p class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ formatCurrency(simulation.principal) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Total Pago</p>
          <p class="text-xl font-bold text-rose-400 mt-1">{{ formatCurrency(simulation.totalPaid) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Total de Juros</p>
          <p class="text-xl font-bold text-amber-400 mt-1">{{ formatCurrency(simulation.totalInterest) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Encargos</p>
          <p class="text-xl font-bold text-[var(--text-secondary)] mt-1">{{ formatCurrency(simulation.totalCharges) }}</p>
        </AppCard>
      </div>

      <!-- Params + CET row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Params card -->
        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
            <AppBadge tone="primary" variant="subtle">{{ simulation.amortizationSystem }}</AppBadge>
          </template>
          <div class="divide-y divide-[var(--border-subtle)] -mx-5">
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Taxa</span>
              <span class="font-medium text-[var(--text-primary)]">{{ simulation.interestRate }}% ({{ simulation.rateType }})</span>
            </div>
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Prazo</span>
              <span class="font-medium text-[var(--text-primary)]">{{ simulation.term }} × {{ simulation.periodicity }}</span>
            </div>
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Periodicidade</span>
              <span class="font-medium text-[var(--text-primary)]">{{ simulation.periodicity }}</span>
            </div>
            <div v-if="simulation.inflationCorrectionEnabled" class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Índice</span>
              <span class="font-medium text-[var(--text-primary)]">{{ simulation.inflationIndex }}</span>
            </div>
          </div>
        </AppCard>

        <!-- CET card -->
        <AppCard v-if="simulation.cet">
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">CET - Custo Efetivo Total</h2>
            <AppBadge tone="warning" variant="subtle">CET habilitado</AppBadge>
          </template>
          <div class="flex gap-8 mt-2">
            <div>
              <p class="text-xs text-[var(--text-muted)]">Taxa Mensal</p>
              <p class="text-2xl font-bold text-amber-400 mt-1">{{ formatPercent(simulation.cet.monthlyRate * 100) }}</p>
            </div>
            <div>
              <p class="text-xs text-[var(--text-muted)]">Taxa Anual</p>
              <p class="text-2xl font-bold text-amber-400 mt-1">{{ formatPercent(simulation.cet.annualRate * 100) }}</p>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Amortization table -->
      <div>
        <h2 class="text-base font-semibold text-[var(--text-primary)] mb-3">Tabela de Amortização</h2>
        <AmortizationTable :installments="simulation.installments" />
      </div>

      <!-- Prepayment calculator -->
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Amortização Antecipada</h2>
        </template>

        <div class="flex items-end gap-3">
          <AppInput
            v-model="prepaymentPeriod"
            label="Período de antecipação"
            type="number"
            :min="1"
            :max="simulation.term"
            hint="Informe em qual parcela deseja antecipar"
          />
          <AppButton variant="secondary" :loading="loadingPrepayment" @click="refetchPrepayment()">
            Calcular
          </AppButton>
        </div>

        <div v-if="prepayment" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3">
            <p class="text-xs text-[var(--text-muted)]">Saldo Devedor</p>
            <p class="text-base font-bold text-[var(--text-primary)]">{{ formatCurrency(prepayment.currentBalance) }}</p>
          </div>
          <div class="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3">
            <p class="text-xs text-[var(--text-muted)]">Desconto</p>
            <p class="text-base font-bold text-emerald-400">{{ formatCurrency(prepayment.prepaymentDiscount) }}</p>
          </div>
          <div class="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3">
            <p class="text-xs text-[var(--text-muted)]">Economia Total</p>
            <p class="text-base font-bold text-emerald-400">{{ formatCurrency(prepayment.totalSavings) }}</p>
          </div>
          <div class="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-3">
            <p class="text-xs text-[var(--text-muted)]">Parcelas Restantes</p>
            <p class="text-base font-bold text-[var(--text-primary)]">{{ prepayment.remainingInstallments }}</p>
          </div>
        </div>
      </AppCard>

      <!-- Snapshots -->
      <AppCard v-if="snapshots?.length">
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Snapshots</h2>
          <span class="text-xs text-[var(--text-muted)]">{{ snapshots.length }} salvo(s)</span>
        </template>
        <div class="space-y-2">
          <div
            v-for="snap in snapshots"
            :key="snap.id"
            class="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-4 py-3"
          >
            <div>
              <p class="text-sm font-medium text-[var(--text-primary)]">{{ snap.name }}</p>
              <p class="text-xs text-[var(--text-muted)]">{{ formatDate(snap.createdAt) }}</p>
            </div>
          </div>
        </div>
      </AppCard>
    </template>

    <!-- Snapshot modal -->
    <AppModal v-model:open="snapshotModalOpen" title="Salvar Snapshot">
      <AppInput
        v-model="snapshotName"
        label="Nome do snapshot"
        placeholder="ex: Versão com seguro MIP"
        autofocus
      />
      <template #footer>
        <AppButton variant="secondary" @click="snapshotModalOpen = false">Cancelar</AppButton>
        <AppButton @click="handleCreateSnapshot">Salvar</AppButton>
      </template>
    </AppModal>
  </div>
</template>
