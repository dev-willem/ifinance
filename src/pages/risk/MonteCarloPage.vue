<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { Dices } from 'lucide-vue-next'
import { monteCarloApi } from '@/services/api/monteCarlo'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import MetricCard from '@/components/data/MetricCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import MonteCarloFanChart from '@/components/montecarlo/MonteCarloFanChart.vue'
import MonteCarloHistogram from '@/components/montecarlo/MonteCarloHistogram.vue'
import { isResultStale, toRequest, validateForm, type MonteCarloForm } from '@/components/montecarlo/monteCarloForm'
import type { MonteCarloRequest, MonteCarloResponse } from '@/types/monteCarlo'

const { formatCurrency, formatPercent, formatInt } = useFormatBR()
const toast = useToast()

const form = ref<MonteCarloForm>({
  initialAmount: 10_000,
  monthlyContribution: 1_000,
  expectedAnnualReturnPct: 10,
  annualVolatilityPct: 15,
  years: 20,
  iterations: 5000,
  targetAmount: null,
  annualInflationPct: null,
  contributionGrowthPct: null,
  seed: null,
})

const iterationOptions = [1000, 5000, 10_000, 20_000].map((v) => ({ value: v, label: formatInt(v) }))

const errors = computed(() => validateForm(form.value))
const isValid = computed(() => Object.keys(errors.value).length === 0)

const result = ref<MonteCarloResponse | null>(null)
const resultRequest = ref<MonteCarloRequest | null>(null)
const isStale = computed(
  () => !!result.value && !!resultRequest.value && isResultStale(form.value, resultRequest.value, result.value.seed),
)

const { mutate, isPending } = useMutation({
  mutationFn: (request: MonteCarloRequest) => monteCarloApi.simulate(request),
  onSuccess: (data, request) => {
    result.value = data
    resultRequest.value = request
    toast.success('Simulação concluída!')
  },
  onError: (err) => {
    const message = isAxiosError(err) ? err.response?.data?.message : undefined
    toast.error('Erro ao executar a simulação.', typeof message === 'string' ? message : undefined)
  },
})

const percentileRows = computed(() => {
  const p = result.value?.percentiles
  if (!p) return []
  return [
    { label: 'P5', value: p.p5 },
    { label: 'P10', value: p.p10 },
    { label: 'P25', value: p.p25 },
    { label: 'P50', value: p.p50 },
    { label: 'P75', value: p.p75 },
    { label: 'P90', value: p.p90 },
    { label: 'P95', value: p.p95 },
  ]
})

function reuseSeed() {
  if (result.value) form.value.seed = result.value.seed
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Simulação de Monte Carlo</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Projete milhares de cenários de retorno para ver a faixa provável do seu patrimônio
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Formulário -->
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="form.initialAmount"
            label="Valor inicial (R$)"
            type="number"
            :min="0"
            placeholder="10000"
            :error="errors.initialAmount"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.monthlyContribution"
            label="Aporte mensal (R$)"
            type="number"
            :min="0"
            placeholder="1000"
            :error="errors.monthlyContribution"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.expectedAnnualReturnPct"
            label="Retorno esperado (%)"
            type="number"
            :min="-50"
            :max="100"
            :step="0.1"
            placeholder="10"
            hint="Média anual nominal"
            :error="errors.expectedAnnualReturnPct"
          >
            <template #suffix>% a.a.</template>
          </AppInput>

          <AppInput
            v-model="form.annualVolatilityPct"
            label="Volatilidade anual (%)"
            type="number"
            :min="0"
            :max="150"
            :step="0.1"
            placeholder="15"
            hint="Volatilidade anual dos retornos logarítmicos (ex.: renda fixa ~2%, ações ~25%)"
            :error="errors.annualVolatilityPct"
          >
            <template #suffix>%</template>
          </AppInput>

          <AppInput
            v-model="form.years"
            label="Horizonte (anos)"
            type="number"
            :min="1"
            :max="60"
            placeholder="20"
            :error="errors.years"
          />

          <AppSelect
            :model-value="form.iterations"
            label="Número de simulações"
            :options="iterationOptions"
            @update:model-value="(v) => (form.iterations = Number(v))"
          />

          <AppInput
            v-model="form.targetAmount"
            label="Meta (R$) — opcional"
            type="number"
            :min="0"
            placeholder="1000000"
            hint="Em valores de hoje se a inflação for informada"
            :error="errors.targetAmount"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.annualInflationPct"
            label="Inflação anual (%) — opcional"
            type="number"
            :min="-10"
            :max="100"
            :step="0.1"
            placeholder="4,5"
            hint="Usada para corrigir a meta até o fim do horizonte"
            :error="errors.annualInflationPct"
          >
            <template #suffix>% a.a.</template>
          </AppInput>

          <AppInput
            v-model="form.contributionGrowthPct"
            label="Reajuste anual do aporte (%) — opcional"
            type="number"
            :min="-50"
            :max="100"
            :step="0.1"
            placeholder="0"
            :error="errors.contributionGrowthPct"
          >
            <template #suffix>% a.a.</template>
          </AppInput>

          <AppInput
            v-model="form.seed"
            label="Semente — opcional"
            type="number"
            :min="0"
            :step="1"
            placeholder="aleatória"
            hint="Mesma semente e parâmetros reproduzem o resultado"
            :error="errors.seed"
          />
        </div>

        <AppButton full-width :loading="isPending" :disabled="!isValid" class="mt-5" @click="() => mutate(toRequest(form))">
          <template #icon-left>
            <Dices class="w-4 h-4" aria-hidden="true" />
          </template>
          Simular
        </AppButton>
      </AppCard>

      <!-- Resultado -->
      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <p v-if="isStale" role="status">
          <AppBadge tone="warning" dot>Parâmetros alterados — simule novamente para atualizar</AppBadge>
        </p>
        <div :class="['space-y-4 transition-opacity', { 'opacity-50': isStale }]">
          <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
            <MetricCard
              v-if="result.probabilityOfReachingTarget != null"
              label="Chance de atingir a meta"
              :value="formatPercent(result.probabilityOfReachingTarget, true)"
              :color="result.probabilityOfReachingTarget >= 0.5 ? 'success' : 'warning'"
            />
            <MetricCard
              label="Chance de terminar abaixo do aportado"
              :value="formatPercent(result.probabilityBelowContributed, true)"
              color="danger"
            />
            <MetricCard label="Mediana (P50)" :value="formatCurrency(result.percentiles.p50)" color="primary" />
            <MetricCard label="Total aportado" :value="formatCurrency(result.totalContributed)" />
            <MetricCard label="Valor esperado (determinístico)" :value="formatCurrency(result.expectedFinalValue)" />
            <MetricCard label="Média das simulações" :value="formatCurrency(result.mean)" />
          </div>

          <AppCard>
            <template #header>
              <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Percentis do patrimônio final</h2>
            </template>
            <dl class="divide-y divide-[var(--border-subtle)] text-sm">
              <div v-for="row in percentileRows" :key="row.label" class="flex justify-between py-1.5">
                <dt class="text-[var(--text-muted)]">{{ row.label }}</dt>
                <dd class="font-medium tabular-nums text-[var(--text-primary)]">{{ formatCurrency(row.value) }}</dd>
              </div>
            </dl>
            <p v-if="result.nominalTarget != null" class="mt-3 text-xs text-[var(--text-muted)]">
              Meta corrigida para o fim do horizonte: {{ formatCurrency(result.nominalTarget) }}
            </p>
            <p class="mt-1 text-xs text-[var(--text-muted)]">
              {{ formatInt(result.iterations) }} simulações · semente {{ result.seed }}
              <button type="button" class="ml-1 text-indigo-400 hover:underline" @click="reuseSeed">fixar semente</button>
            </p>
          </AppCard>
        </div>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Preencha os parâmetros e clique em Simular"
      />
    </div>

    <div v-if="result" :class="['space-y-6 transition-opacity', { 'opacity-50': isStale }]">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Evolução do patrimônio (faixas de percentis)</h2>
        </template>
        <MonteCarloFanChart :bands="result.yearlyBands" :target="result.nominalTarget" />
      </AppCard>

      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Distribuição do patrimônio final</h2>
        </template>
        <MonteCarloHistogram
          :bins="result.histogram"
          :iterations="result.iterations"
          :overflow-count="result.histogramOverflowCount"
          :target="result.nominalTarget"
        />
      </AppCard>
    </div>

    <AppCard>
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Como a simulação funciona</h2>
      </template>
      <ul class="list-disc space-y-1.5 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Cada simulação sorteia um retorno para cada mês. Os retornos seguem uma distribuição log-normal calibrada
          para que o crescimento médio anual seja igual ao retorno esperado informado, com a volatilidade anual
          convertida para mensal (σ ÷ √12). A volatilidade informada é a dos retornos logarítmicos; a dispersão dos
          retornos simples anuais fica um pouco maior (com 10% de retorno e 25% de volatilidade, cerca de 28%).
        </li>
        <li>Os aportes são feitos no fim de cada mês e, se informado, reajustados no início de cada ano.</li>
        <li>
          Os meses são independentes entre si: o modelo não captura crises prolongadas, mudanças de regime, taxas,
          impostos ou come-cotas. Trate os resultados como faixas de cenários, não como previsão.
        </li>
        <li>
          Todos os valores são nominais. Com inflação informada, a meta é tratada em valores de hoje e corrigida até o
          fim do horizonte antes de calcular a chance de atingi-la.
        </li>
        <li>
          O "valor esperado" é a projeção determinística pelo retorno médio; a mediana (P50) costuma ficar abaixo dele
          porque poucos cenários muito bons puxam a média para cima.
        </li>
        <li>P5 significa que 5% dos cenários terminaram abaixo daquele valor; P95, que 95% terminaram abaixo.</li>
      </ul>
    </AppCard>
  </div>
</template>
