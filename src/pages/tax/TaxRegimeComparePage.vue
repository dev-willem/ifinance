<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { taxApi } from '@/services/api/tax'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import TaxBars from '@/components/tax/TaxBars.vue'
import {
  ACTIVITY_OPTIONS,
  DEFAULT_DISCLAIMER,
  REGIME_LABELS,
  TAX_LABELS,
  buildTaxMatrix,
  rankEligible,
  salesTaxOf,
} from '@/components/tax/taxHelpers'
import type { BusinessActivity, TaxCompareResponse } from '@/types/tax'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref({
  annualRevenue: null as number | null,
  activity: 'SERVICES' as BusinessActivity,
  annualPayroll: null as number | null,
  payrollChargesRate: 27.8 as number | null,
  deductibleExpenses: null as number | null,
  creditablePurchases: null as number | null,
  salesTaxRate: null as number | null,
})

const result = ref<TaxCompareResponse | null>(null)

const salesTax = computed(() => salesTaxOf(form.value.activity))

const purchasesError = computed(() =>
  (form.value.creditablePurchases ?? 0) > (form.value.deductibleExpenses ?? 0)
    ? 'As compras com crédito devem estar incluídas nos custos dedutíveis'
    : undefined,
)

const isValid = computed(
  () => form.value.annualRevenue !== null && form.value.annualRevenue > 0 && !purchasesError.value,
)

const toFraction = (percent: number | null) => (percent == null ? null : percent / 100)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    taxApi.compare({
      annualRevenue: form.value.annualRevenue!,
      activity: form.value.activity,
      annualPayroll: form.value.annualPayroll,
      payrollChargesRate: toFraction(form.value.payrollChargesRate),
      deductibleExpenses: form.value.deductibleExpenses,
      creditablePurchases: form.value.creditablePurchases,
      salesTaxRate: toFraction(form.value.salesTaxRate),
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('Regimes comparados!')
  },
  onError: () => toast.error('Erro ao comparar os regimes.'),
})

const ranked = computed(() => (result.value ? rankEligible(result.value.regimes) : []))
const savings = computed(() =>
  ranked.value.length > 1 ? ranked.value[1]!.total - ranked.value[0]!.total : null,
)
const matrix = computed(() => (result.value ? buildTaxMatrix(result.value.regimes) : []))
const bars = computed(() =>
  (result.value?.regimes ?? []).map((r) => ({
    key: r.regime,
    label: REGIME_LABELS[r.regime],
    value: r.total,
    emptyText: 'Não elegível',
    highlight: r.regime === result.value?.cheapest,
  })),
)

function cellClass(regime: string) {
  return regime === result.value?.cheapest ? 'bg-emerald-500/10' : ''
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Comparar Regimes Tributários</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Simples Nacional, Lucro Presumido e Lucro Real lado a lado, em valores anuais
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Dados anuais da empresa</h2>
        </template>

        <form class="space-y-4" @submit.prevent="isValid && mutate()">
          <AppInput
            v-model="form.annualRevenue"
            label="Receita bruta anual (R$)"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="1200000"
            required
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppSelect v-model="form.activity" label="Atividade" :options="ACTIVITY_OPTIONS" required />

          <AppInput
            v-model="form.annualPayroll"
            label="Folha de salários anual (R$)"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="240000"
            hint="Salários e pró-labore, sem encargos. No Anexo V define o Fator R, que soma o FGTS de 8%"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.payrollChargesRate"
            label="Encargos sobre a folha — Presumido/Real (%)"
            type="number"
            :min="0"
            :max="100"
            :step="0.1"
            hint="Padrão 27,8% = INSS patronal 20% + RAT 2% + terceiros 5,8% (sem FGTS)"
          >
            <template #suffix>%</template>
          </AppInput>

          <AppInput
            v-model="form.deductibleExpenses"
            label="Custos e despesas dedutíveis (R$)"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="500000"
            hint="Exceto folha e tributos. Usado no Lucro Real e no lucro líquido"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.creditablePurchases"
            label="Compras com crédito de PIS/Cofins (R$)"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="300000"
            hint="Parte dos custos que gera crédito no regime não cumulativo (sem ICMS)"
            :error="purchasesError"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.salesTaxRate"
            :label="`Alíquota efetiva de ${salesTax} (%)`"
            type="number"
            :min="0"
            :max="100"
            :step="0.01"
            :placeholder="salesTax === 'ISS' ? '5' : '12'"
            :hint="`${salesTax} pago fora do DAS: no Presumido, no Real e no Simples acima de R$ 3,6 mi`"
          >
            <template #suffix>%</template>
          </AppInput>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isValid" class="mt-2">
            Comparar regimes
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="lg:col-span-2 space-y-4 animate-slide-in-right">
        <div v-if="ranked.length" class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p class="text-xs text-[var(--text-muted)]">Regime mais econômico</p>
          <p class="text-2xl font-bold text-emerald-400">{{ REGIME_LABELS[ranked[0]!.regime] }}</p>
          <p class="text-sm text-[var(--text-secondary)] mt-1">
            {{ formatCurrency(ranked[0]!.total) }} por ano
            ({{ formatPercent(ranked[0]!.effectiveRate, true) }} da receita)
            <template v-if="savings !== null && ranked[1]">
              — economia de {{ formatCurrency(savings) }} frente ao {{ REGIME_LABELS[ranked[1].regime] }}
            </template>
          </p>
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Carga tributária anual</h2>
          </template>
          <TaxBars :items="bars" aria-label="Total de tributos por regime" />
        </AppCard>

        <AppCard padding="none">
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Tributos por regime (R$ por ano)</h2>
          </template>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[520px] text-sm">
              <thead>
                <tr class="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                  <th scope="col" class="px-5 py-3 font-medium">Tributo</th>
                  <th
                    v-for="r in result.regimes"
                    :key="r.regime"
                    scope="col"
                    :class="['px-5 py-3 font-medium text-right', cellClass(r.regime)]"
                  >
                    <span class="block">{{ REGIME_LABELS[r.regime] }}</span>
                    <AppBadge v-if="r.regime === result.cheapest" tone="success" class="mt-1">Mais econômico</AppBadge>
                    <AppBadge v-else-if="!r.eligible" tone="danger" class="mt-1">Não elegível</AppBadge>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in matrix" :key="row.tax" class="border-b border-[var(--border-subtle)]">
                  <th scope="row" class="px-5 py-2 text-left font-normal text-[var(--text-secondary)]">
                    {{ TAX_LABELS[row.tax] }}
                  </th>
                  <td
                    v-for="(amount, i) in row.amounts"
                    :key="i"
                    :class="['px-5 py-2 text-right tabular-nums text-[var(--text-primary)]', cellClass(result.regimes[i]!.regime)]"
                  >
                    {{ amount == null ? '—' : formatCurrency(amount) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="font-semibold">
                <tr class="border-b border-[var(--border-subtle)]">
                  <th scope="row" class="px-5 py-2 text-left text-[var(--text-primary)]">Total</th>
                  <td v-for="r in result.regimes" :key="r.regime" :class="['px-5 py-2 text-right tabular-nums', cellClass(r.regime)]">
                    {{ r.total == null ? '—' : formatCurrency(r.total) }}
                  </td>
                </tr>
                <tr class="border-b border-[var(--border-subtle)]">
                  <th scope="row" class="px-5 py-2 text-left text-[var(--text-secondary)]">Carga sobre a receita</th>
                  <td v-for="r in result.regimes" :key="r.regime" :class="['px-5 py-2 text-right tabular-nums', cellClass(r.regime)]">
                    {{ r.effectiveRate == null ? '—' : formatPercent(r.effectiveRate, true) }}
                  </td>
                </tr>
                <tr>
                  <th scope="row" class="px-5 py-2 text-left text-[var(--text-secondary)]">Lucro líquido após tributos</th>
                  <td
                    v-for="r in result.regimes"
                    :key="r.regime"
                    :class="['px-5 py-2 text-right tabular-nums', cellClass(r.regime), (r.netProfit ?? 0) < 0 ? 'text-rose-400' : '']"
                  >
                    {{ r.netProfit == null ? '—' : formatCurrency(r.netProfit) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </AppCard>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AppCard v-for="r in result.regimes" :key="r.regime" padding="sm">
            <p class="text-xs font-semibold text-[var(--text-secondary)]">{{ REGIME_LABELS[r.regime] }}</p>
            <ul v-if="r.notes.length" class="mt-2 space-y-1 text-xs text-[var(--text-muted)] list-disc pl-4">
              <li v-for="note in r.notes" :key="note">{{ note }}</li>
            </ul>
            <p v-else class="mt-2 text-xs text-[var(--text-muted)]">Sem observações.</p>
          </AppCard>
        </div>
      </div>

      <EmptyState
        v-else
        class="lg:col-span-2"
        title="Resultados aparecerão aqui"
        description="Informe a receita anual e a atividade para comparar os regimes"
      />
    </div>

    <p class="text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-4" role="note">
      {{ result?.disclaimer ?? DEFAULT_DISCLAIMER }}
    </p>
  </div>
</template>
