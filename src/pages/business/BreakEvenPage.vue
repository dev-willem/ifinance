<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { businessApi, apiErrorMessage } from '@/services/api/business'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/business/StatCard.vue'
import BreakEvenChart from '@/components/business/BreakEvenChart.vue'
import type { BreakEvenRequest, BreakEvenResponse } from '@/types/business'

const { formatCurrency, formatPercent, formatNumber, formatInt } = useFormatBR()
const toast = useToast()

const form = ref({
  fixedCosts: null as number | null,
  unitPrice: null as number | null,
  unitVariableCost: null as number | null,
  depreciation: null as number | null,
  desiredProfit: null as number | null,
  currentQuantity: null as number | null,
})

// Inputs of the last successful call, so the chart does not move while the form is edited.
const result = ref<{ input: BreakEvenRequest; data: BreakEvenResponse } | null>(null)

const opt = (v: number | null) => v ?? undefined

const { mutate, isPending } = useMutation({
  mutationFn: async () => {
    const f = form.value
    const input: BreakEvenRequest = {
      fixedCosts: f.fixedCosts!,
      unitPrice: f.unitPrice!,
      unitVariableCost: f.unitVariableCost!,
      depreciation: opt(f.depreciation),
      desiredProfit: opt(f.desiredProfit),
      currentQuantity: f.currentQuantity ? f.currentQuantity : undefined,
    }
    return { input, data: await businessApi.breakEven(input) }
  },
  onSuccess: (r) => {
    result.value = r
    toast.success('Ponto de equilíbrio calculado!')
  },
  onError: (err) => toast.error(apiErrorMessage(err, 'Erro ao calcular o ponto de equilíbrio.')),
})

const priceError = () => {
  const f = form.value
  return f.unitPrice !== null && f.unitVariableCost !== null && f.unitPrice <= f.unitVariableCost
    ? 'O preço precisa ser maior que o custo variável unitário'
    : undefined
}

const depreciationError = () => {
  const f = form.value
  return f.depreciation !== null && f.fixedCosts !== null && f.depreciation > f.fixedCosts
    ? 'A depreciação não pode exceder os custos fixos'
    : undefined
}

function isValid() {
  const f = form.value
  return (
    f.fixedCosts !== null &&
    f.fixedCosts >= 0 &&
    f.unitPrice !== null &&
    f.unitPrice > 0 &&
    f.unitVariableCost !== null &&
    f.unitVariableCost >= 0 &&
    !priceError() &&
    !depreciationError()
  )
}

const units = (exact: number | undefined, rounded: number | undefined) =>
  exact === rounded ? `${formatInt(rounded)} un` : `${formatInt(rounded)} un (${formatNumber(exact, 2)})`
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Ponto de Equilíbrio</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Quantas unidades você precisa vender para cobrir os custos — e quanto sobra acima disso
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros (por mês)</h2>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="form.fixedCosts"
            label="Custos e despesas fixos (R$)"
            variant="currency"
            :min="0"
            placeholder="10000"
            hint="Inclui a depreciação"
            required
          >
            <template #prefix>R$</template>
          </AppInput>
          <AppInput
            v-model="form.depreciation"
            label="Depreciação (R$) — opcional"
            variant="currency"
            :min="0"
            placeholder="0"
            hint="Parte não desembolsável dos custos fixos"
            :error="depreciationError()"
          >
            <template #prefix>R$</template>
          </AppInput>
          <AppInput v-model="form.unitPrice" label="Preço de venda unitário (R$)" variant="currency" :min="0" placeholder="50" required>
            <template #prefix>R$</template>
          </AppInput>
          <AppInput
            v-model="form.unitVariableCost"
            label="Custo variável unitário (R$)"
            variant="currency"
            :min="0"
            placeholder="30"
            hint="Matéria-prima, impostos e comissões por unidade"
            :error="priceError()"
            required
          >
            <template #prefix>R$</template>
          </AppInput>
          <AppInput
            v-model="form.desiredProfit"
            label="Lucro desejado (R$) — opcional"
            variant="currency"
            :min="0"
            placeholder="5000"
            hint="Para o ponto de equilíbrio econômico"
          >
            <template #prefix>R$</template>
          </AppInput>
          <AppInput
            v-model="form.currentQuantity"
            label="Vendas atuais (un) — opcional"
            variant="number"
            :min="0"
            placeholder="800"
            hint="Para margem de segurança e alavancagem"
          />
        </div>

        <AppButton full-width class="mt-4" :loading="isPending" :disabled="!isValid()" @click="() => mutate()">
          Calcular ponto de equilíbrio
        </AppButton>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5">
          <p class="text-sm text-[var(--text-secondary)]">Ponto de equilíbrio contábil</p>
          <p class="text-3xl font-bold text-indigo-400 tabular-nums">
            {{ formatInt(result.data.accountingBreakEvenUnits) }} un
          </p>
          <p class="text-sm text-[var(--text-secondary)] mt-1">
            {{ formatCurrency(result.data.accountingBreakEvenRevenue) }} de receita
            <span class="text-[var(--text-muted)]">(exato: {{ formatNumber(result.data.accountingBreakEvenUnitsExact, 4) }} un)</span>
          </p>
        </div>

        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Margem de contribuição unitária"
            :value="`${formatCurrency(result.data.unitContributionMargin)} (${formatPercent(result.data.contributionMarginRatio, true)})`"
            tone="primary"
          />
          <StatCard
            label="PE financeiro (caixa)"
            :value="units(result.data.financialBreakEvenUnitsExact, result.data.financialBreakEvenUnits)"
            :detail="formatCurrency(result.data.financialBreakEvenRevenue)"
          />
          <StatCard
            v-if="result.data.economicBreakEvenUnits != null"
            label="PE econômico (com lucro desejado)"
            :value="units(result.data.economicBreakEvenUnitsExact, result.data.economicBreakEvenUnits)"
            :detail="formatCurrency(result.data.economicBreakEvenRevenue)"
            tone="success"
          />
          <template v-if="result.data.safetyMarginRatio != null">
            <StatCard
              label="Margem de segurança"
              :value="formatPercent(result.data.safetyMarginRatio, true)"
              :detail="`${formatNumber(result.data.safetyMarginUnits, 2)} un · ${formatCurrency(result.data.safetyMarginRevenue)}`"
              :tone="result.data.safetyMarginRatio < 0 ? 'danger' : 'success'"
            />
            <StatCard
              label="Lucro operacional atual"
              :value="formatCurrency(result.data.operatingProfit)"
              :tone="(result.data.operatingProfit ?? 0) < 0 ? 'danger' : 'success'"
            />
            <StatCard
              label="Grau de alavancagem operacional"
              :value="result.data.operatingLeverageDegree != null ? `${formatNumber(result.data.operatingLeverageDegree, 2)}x` : 'Indefinido'"
              detail="Variação % do lucro para cada 1% de vendas"
              tone="warning"
            />
          </template>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Informe custos fixos, preço e custo variável unitário</p>
      </div>
    </div>

    <AppCard v-if="result">
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Receita × custo total</h2>
      </template>
      <BreakEvenChart
        :fixed-costs="result.input.fixedCosts"
        :unit-price="result.input.unitPrice"
        :unit-variable-cost="result.input.unitVariableCost"
        :break-even-quantity="result.data.accountingBreakEvenUnitsExact"
        :current-quantity="result.input.currentQuantity"
      />
    </AppCard>
  </div>
</template>
