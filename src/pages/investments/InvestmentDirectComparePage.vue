<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { planningApi } from '@/services/api/planning'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import { INVESTMENT_TYPE_OPTIONS, RATE_BASIS_OPTIONS } from '@/core/constants'
import { InvestmentType, RateBasis } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { DirectCompareItem, InvestmentRequest } from '@/types'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

interface InvestmentFormItem extends InvestmentRequest {
  _id: number
}

let _nextId = 1
function makeItem(): InvestmentFormItem {
  return {
    _id: _nextId++,
    name: '',
    investmentType: InvestmentType.CDB,
    rateBasis: RateBasis.CDI_PERCENT,
    rateValue: undefined as unknown as number,
    principal: 10000 as number,
    termDays: 365 as number,
    startDate: new Date().toISOString().split('T')[0],
  }
}

const items = ref<InvestmentFormItem[]>([makeItem(), makeItem()])
const results = ref<DirectCompareItem[] | null>(null)

function addItem() {
  if (items.value.length >= 5) {
    toast.warning('Máximo de 5 investimentos.')
    return
  }
  items.value.push(makeItem())
}

function removeItem(id: number) {
  if (items.value.length <= 2) {
    toast.warning('Mínimo de 2 investimentos.')
    return
  }
  items.value = items.value.filter((i) => i._id !== id)
}

const investmentOptions = INVESTMENT_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))
const rateBasisOptions = RATE_BASIS_OPTIONS

const isValid = computed(() =>
  items.value.every(
    (i) => i.name.length >= 1 && i.rateValue > 0 && i.principal > 0 && i.termDays > 0,
  ),
)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    planningApi.compareDirect({
      investments: items.value.map(({ _id, ...rest }) => rest),
    }),
  onSuccess: (data) => {
    results.value = data
    toast.success('Comparação calculada!')
  },
  onError: () => toast.error('Erro ao calcular comparação.'),
})

const metricRows = [
  { label: 'Capital', key: 'principal', fmt: (v: unknown) => formatCurrency(v as number) },
  { label: 'Prazo', key: 'termDays', fmt: (v: unknown) => `${v} dias` },
  { label: 'Taxa', key: 'rateValue', fmt: (v: unknown) => `${v}%` },
  { label: 'Base', key: 'rateBasis', fmt: (v: unknown) => String(v) },
  { label: 'Rend. Bruto', key: 'grossReturn', fmt: (v: unknown) => formatCurrency(v as number) },
  { label: 'IR', key: 'irRate', fmt: (v: unknown) => formatPercent((v as number)) },
  { label: 'Rend. Líquido', key: 'netReturn', fmt: (v: unknown) => formatCurrency(v as number) },
  { label: 'Taxa Bruta a.a.', key: 'grossAnnualRate', fmt: (v: unknown) => formatPercent(v as number) },
  { label: 'Taxa Líquida a.a.', key: 'netAnnualRate', fmt: (v: unknown) => formatPercent(v as number) },
] as const
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Comparar Produtos de Renda Fixa</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Compare até 5 produtos diretamente, sem precisar salvar cada um
      </p>
    </div>

    <!-- Formulário de itens -->
    <div class="space-y-4">
      <div
        v-for="(item, i) in items"
        :key="item._id"
        class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Produto {{ i + 1 }}</span>
          <button
            v-if="items.length > 2"
            class="rounded p-1 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            @click="removeItem(item._id)"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AppInput v-model="item.name" label="Nome" placeholder="CDB Banco X" required />

          <AppSelect
            v-model="item.investmentType"
            label="Tipo"
            :options="investmentOptions"
          />

          <AppSelect
            v-model="item.rateBasis"
            label="Base da taxa"
            :options="rateBasisOptions"
          />

          <AppInput
            v-model="item.rateValue"
            label="Taxa"
            type="number"
            :min="0.01"
            :step="0.01"
            placeholder="110"
            hint="Ex: 110 para 110% CDI, 12.5 para 12,5% a.a."
          />

          <AppInput
            v-model="item.principal"
            label="Capital (R$)"
            type="number"
            :min="1"
            placeholder="10000"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="item.termDays"
            label="Prazo (dias)"
            type="number"
            :min="1"
            placeholder="365"
          />
        </div>
      </div>

      <div class="flex gap-3">
        <AppButton
          v-if="items.length < 5"
          variant="secondary"
          @click="addItem"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Adicionar produto
        </AppButton>

        <AppButton
          :loading="isPending"
          :disabled="!isValid"
          @click="() => mutate()"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </template>
          Comparar
        </AppButton>
      </div>
    </div>

    <!-- Tabela de resultados -->
    <AppCard v-if="results" :padding="'none'" class="animate-slide-in-right">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
              <th class="px-5 py-4 text-left font-medium text-[var(--text-muted)] w-40">Métrica</th>
              <th
                v-for="(res, i) in results"
                :key="i"
                class="px-5 py-4 text-center"
              >
                <div class="flex flex-col items-center gap-1">
                  <span class="font-semibold text-[var(--text-primary)] truncate max-w-[140px]">{{ res.name }}</span>
                  <div class="flex items-center gap-1">
                    <AppBadge tone="info" variant="subtle">{{ res.investmentType }}</AppBadge>
                    <AppBadge v-if="res.isTaxExempt" tone="success" variant="subtle">Isento IR</AppBadge>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-subtle)]">
            <tr
              v-for="row in metricRows"
              :key="row.key"
              class="hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <td class="px-5 py-3.5 font-medium text-[var(--text-secondary)] whitespace-nowrap">
                {{ row.label }}
              </td>
              <td
                v-for="(res, i) in results"
                :key="i"
                class="px-5 py-3.5 text-center font-mono"
                :class="[
                  row.key === 'netReturn' || row.key === 'netAnnualRate' ? 'text-emerald-400 font-semibold' : 'text-[var(--text-secondary)]',
                  row.key === 'grossReturn' ? 'text-emerald-300' : '',
                  row.key === 'irRate' ? 'text-amber-400' : '',
                ]"
              >
                {{ row.fmt(res[row.key as keyof typeof res]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
