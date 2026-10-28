<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { businessApi, apiErrorMessage } from '@/services/api/business'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import StatCard from '@/components/business/StatCard.vue'
import WaterfallChart from '@/components/business/WaterfallChart.vue'
import { incomeStatementRows, percentToRate as pct, waterfallBars } from '@/components/business/helpers'
import type { IncomeStatementResponse } from '@/types/business'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref({
  grossRevenue: null as number | null,
  salesDeductionsRate: null as number | null,
  costOfGoodsSold: null as number | null,
  sellingExpenses: null as number | null,
  administrativeExpenses: null as number | null,
  otherOperatingExpenses: null as number | null,
  depreciationAmortization: null as number | null,
  financialRevenue: null as number | null,
  financialExpenses: null as number | null,
  incomeTaxRate: 34 as number | null,
  project: false,
  months: 12 as number | null,
  monthlyRevenueGrowth: null as number | null,
})

const result = ref<IncomeStatementResponse | null>(null)

const opt = (v: number | null) => v ?? undefined

const { mutate, isPending } = useMutation({
  mutationFn: () => {
    const f = form.value
    return businessApi.incomeStatement({
      grossRevenue: f.grossRevenue!,
      salesDeductionsRate: pct(f.salesDeductionsRate),
      costOfGoodsSold: f.costOfGoodsSold!,
      sellingExpenses: opt(f.sellingExpenses),
      administrativeExpenses: opt(f.administrativeExpenses),
      otherOperatingExpenses: opt(f.otherOperatingExpenses),
      depreciationAmortization: opt(f.depreciationAmortization),
      financialRevenue: opt(f.financialRevenue),
      financialExpenses: opt(f.financialExpenses),
      incomeTaxRate: pct(f.incomeTaxRate),
      months: f.project ? opt(f.months) : undefined,
      monthlyRevenueGrowth: f.project ? pct(f.monthlyRevenueGrowth) : undefined,
    })
  },
  onSuccess: (data) => {
    result.value = data
    toast.success('DRE calculada!')
  },
  onError: (err) => toast.error(apiErrorMessage(err, 'Erro ao calcular a DRE.')),
})

function isValid() {
  const f = form.value
  return (
    f.grossRevenue !== null &&
    f.grossRevenue >= 0 &&
    f.costOfGoodsSold !== null &&
    f.costOfGoodsSold >= 0 &&
    (!f.project || (f.months !== null && f.months >= 1 && f.months <= 60))
  )
}

const rows = computed(() => (result.value ? incomeStatementRows(result.value) : []))
const bars = computed(() => (result.value ? waterfallBars(result.value) : []))

const margins = computed(() => {
  const r = result.value
  if (!r) return []
  return [
    { label: 'Margem bruta', value: r.grossMargin },
    { label: 'Margem EBITDA', value: r.ebitdaMargin },
    { label: 'Margem operacional', value: r.operatingMargin },
    { label: 'Margem líquida', value: r.netMargin },
  ].map((m) => ({
    ...m,
    tone: (m.value == null ? 'default' : m.value < 0 ? 'danger' : 'success') as 'default' | 'danger' | 'success',
  }))
})

const amountFields = [
  { key: 'costOfGoodsSold', label: 'CMV / CPV / CSP (R$)', hint: 'Custo das mercadorias, produtos ou serviços vendidos' },
  { key: 'sellingExpenses', label: 'Despesas com vendas (R$)', hint: 'Comissões, fretes, marketing — variam com a receita' },
  { key: 'administrativeExpenses', label: 'Despesas administrativas (R$)', hint: 'Aluguel, salários administrativos, contabilidade' },
  { key: 'otherOperatingExpenses', label: 'Outras despesas operacionais (R$)' },
  { key: 'depreciationAmortization', label: 'Depreciação e amortização (R$)' },
  { key: 'financialRevenue', label: 'Receitas financeiras (R$)' },
  { key: 'financialExpenses', label: 'Despesas financeiras (R$)', hint: 'Juros de empréstimos, tarifas bancárias' },
] as const
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">DRE Simulada</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Monte a Demonstração do Resultado do Exercício de um mês, veja as margens e projete os próximos meses
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Valores do mês</h2>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.grossRevenue" label="Receita bruta (R$)" variant="currency" :min="0" placeholder="100000" required>
              <template #prefix>R$</template>
            </AppInput>
            <AppInput
              v-model="form.salesDeductionsRate"
              label="Deduções sobre vendas (%)"
              variant="percent"
              :min="0"
              :max="100"
              placeholder="10"
              hint="Impostos sobre vendas, devoluções e abatimentos (% da receita bruta)"
            >
              <template #suffix>%</template>
            </AppInput>
            <AppInput
              v-for="field in amountFields"
              :key="field.key"
              v-model="form[field.key]"
              :label="field.label"
              variant="currency"
              :min="0"
              placeholder="0"
              :hint="'hint' in field ? field.hint : undefined"
              :required="field.key === 'costOfGoodsSold'"
            >
              <template #prefix>R$</template>
            </AppInput>
            <AppInput
              v-model="form.incomeTaxRate"
              label="Alíquota efetiva IR + CSLL (%)"
              variant="percent"
              :min="0"
              :max="100"
              placeholder="34"
              hint="Até 34% no Lucro Real: IRPJ 15% + CSLL 9% sobre todo o LAIR, mais adicional de 10% só sobre o que exceder R$ 20 mil/mês. Só incide se o LAIR for positivo"
            >
              <template #suffix>%</template>
            </AppInput>
          </div>

          <div class="rounded-lg border border-[var(--border-subtle)] p-4 space-y-4">
            <AppToggle v-model="form.project" label="Projetar meses seguintes" />
            <div v-if="form.project" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput v-model="form.months" label="Meses de projeção" variant="number" :min="1" :max="60" placeholder="12" />
              <AppInput
                v-model="form.monthlyRevenueGrowth"
                label="Crescimento mensal da receita (%)"
                variant="percent"
                :min="-99"
                :max="100"
                placeholder="2"
                hint="CMV e despesas com vendas acompanham a receita; demais despesas ficam fixas"
              >
                <template #suffix>% a.m.</template>
              </AppInput>
            </div>
          </div>

          <AppButton full-width :loading="isPending" :disabled="!isValid()" @click="() => mutate()">
            Calcular DRE
          </AppButton>
        </div>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div
          :class="[
            'rounded-xl border p-5',
            result.netIncome >= 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10',
          ]"
        >
          <p class="text-sm text-[var(--text-secondary)]">{{ result.netIncome >= 0 ? 'Lucro líquido' : 'Prejuízo líquido' }}</p>
          <p :class="['text-3xl font-bold tabular-nums', result.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400']">
            {{ formatCurrency(result.netIncome) }}
          </p>
          <p v-if="result.earningsBeforeTax <= 0" class="mt-1 text-xs text-[var(--text-muted)]">
            LAIR não positivo: não há IR/CSLL a pagar neste mês.
          </p>
        </div>

        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            v-for="m in margins"
            :key="m.label"
            :label="m.label"
            :value="formatPercent(m.value, true)"
            :tone="m.tone"
          />
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Da receita ao lucro</h2>
          </template>
          <WaterfallChart :bars="bars" />
        </AppCard>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Informe ao menos a receita bruta e o CMV</p>
      </div>
    </div>

    <AppCard v-if="result" padding="none">
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Demonstração do Resultado</h2>
      </template>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="sr-only">DRE com análise vertical sobre a receita líquida</caption>
          <thead>
            <tr class="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <th scope="col" class="px-5 py-3 text-left font-medium">Conta</th>
              <th scope="col" class="px-5 py-3 text-right font-medium">Valor</th>
              <th scope="col" class="px-5 py-3 text-right font-medium">% Rec. líquida</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.label"
              :class="[
                'border-b border-[var(--border-subtle)] last:border-0',
                row.kind !== 'line' && 'bg-[var(--border-subtle)]/30 font-semibold',
              ]"
            >
              <th
                scope="row"
                :class="['px-5 py-2.5 text-left font-[inherit]', row.kind === 'line' ? 'pl-8 text-[var(--text-secondary)]' : 'text-[var(--text-primary)]']"
              >
                {{ row.label }}
              </th>
              <td
                :class="[
                  'px-5 py-2.5 text-right tabular-nums whitespace-nowrap',
                  row.kind === 'result' ? (row.value < 0 ? 'text-rose-400' : 'text-emerald-400') : row.value < 0 ? 'text-rose-400/90' : 'text-[var(--text-primary)]',
                ]"
              >
                {{ formatCurrency(row.value) }}
              </td>
              <td class="px-5 py-2.5 text-right tabular-nums text-[var(--text-muted)]">
                {{ formatPercent(row.share, true) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppCard v-if="result?.projection?.length" padding="none">
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Projeção mensal</h2>
      </template>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="sr-only">Projeção mensal da DRE</caption>
          <thead>
            <tr class="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <th scope="col" class="px-4 py-3 text-left font-medium">Mês</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Receita bruta</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Receita líquida</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">EBITDA</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">LAIR</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">IR/CSLL</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Lucro líquido</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Margem</th>
              <th scope="col" class="px-4 py-3 text-right font-medium">Acumulado</th>
            </tr>
          </thead>
          <tbody class="tabular-nums whitespace-nowrap">
            <tr v-for="m in result.projection" :key="m.month" class="border-b border-[var(--border-subtle)] last:border-0">
              <th scope="row" class="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">{{ m.month }}</th>
              <td class="px-4 py-2 text-right">{{ formatCurrency(m.grossRevenue) }}</td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(m.netRevenue) }}</td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(m.ebitda) }}</td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(m.earningsBeforeTax) }}</td>
              <td class="px-4 py-2 text-right text-[var(--text-muted)]">{{ formatCurrency(m.incomeTax) }}</td>
              <td :class="['px-4 py-2 text-right font-medium', m.netIncome < 0 ? 'text-rose-400' : 'text-emerald-400']">
                {{ formatCurrency(m.netIncome) }}
              </td>
              <td class="px-4 py-2 text-right text-[var(--text-muted)]">{{ formatPercent(m.netMargin, true) }}</td>
              <td :class="['px-4 py-2 text-right', m.cumulativeNetIncome < 0 ? 'text-rose-400' : 'text-[var(--text-primary)]']">
                {{ formatCurrency(m.cumulativeNetIncome) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>
