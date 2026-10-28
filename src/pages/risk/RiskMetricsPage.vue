<script setup lang="ts">
import { computed, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useMutation } from '@tanstack/vue-query'
import { riskApi } from '@/services/api/risk'
import { indexesApi } from '@/services/api/indexes'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import RiskLineChart from '@/components/risk/RiskLineChart.vue'
import { parseSeries } from '@/components/risk/parseSeries'
import { EconomicIndex } from '@/types'
import type { RiskInputType, RiskMetricsResponse, RiskPeriodicity } from '@/types/risk'

const { formatPercent, formatNumber } = useFormatBR()
const toast = useToast()

const MAX_VALUES = 5000

const form = ref({
  inputType: 'RETURNS' as RiskInputType,
  percentMode: true,
  valuesText: '',
  benchmarkText: '',
  periodicity: 'MONTHLY' as RiskPeriodicity,
  riskFree: null as number | null,
  confidence: 95,
})

const periodicityOptions = [
  { value: 'DAILY', label: 'Diária (252 pregões/ano)' },
  { value: 'WEEKLY', label: 'Semanal (52/ano)' },
  { value: 'MONTHLY', label: 'Mensal (12/ano)' },
  { value: 'ANNUAL', label: 'Anual' },
]
const confidenceOptions = [
  { value: 90, label: '90%' },
  { value: 95, label: '95%' },
  { value: 99, label: '99%' },
]

const usePercent = computed(() => form.value.inputType === 'RETURNS' && form.value.percentMode)
const asset = computed(() => parseSeries(form.value.valuesText, usePercent.value))
const bench = computed(() => parseSeries(form.value.benchmarkText, usePercent.value))
const hasBench = computed(() => bench.value.values.length > 0 || bench.value.errors.length > 0)

const assetError = computed(() => {
  if (asset.value.errors.length) return asset.value.errors.slice(0, 3).join('; ')
  const n = asset.value.values.length
  if (n > 0 && n < 2) return 'Informe ao menos 2 valores.'
  if (n > MAX_VALUES) return `Máximo de ${MAX_VALUES} valores.`
  return ''
})
const benchError = computed(() => {
  if (!hasBench.value) return ''
  if (bench.value.errors.length) return bench.value.errors.slice(0, 3).join('; ')
  if (bench.value.values.length !== asset.value.values.length)
    return `O benchmark tem ${bench.value.values.length} valores; o ativo tem ${asset.value.values.length}.`
  return ''
})
const isValid = computed(
  () => asset.value.values.length >= 2 && !assetError.value && !benchError.value,
)

const result = ref<RiskMetricsResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    riskApi.metrics({
      values: asset.value.values,
      inputType: form.value.inputType,
      benchmarkValues: hasBench.value ? bench.value.values : undefined,
      periodicity: form.value.periodicity,
      riskFreeAnnualRate: form.value.riskFree != null ? form.value.riskFree / 100 : 0,
      // AppSelect emits the option value as a string
      confidenceLevel: Number(form.value.confidence) / 100,
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('Métricas calculadas!')
  },
  onError: (err) => {
    const message = isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined
    toast.error('Erro ao calcular métricas de risco.', message)
  },
})

const rateLoading = ref<EconomicIndex | null>(null)
async function fillRate(index: EconomicIndex) {
  rateLoading.value = index
  try {
    const rate = await indexesApi.getCurrent(index)
    form.value.riskFree = rate.annualRate
  } catch {
    toast.error(`Não foi possível obter a taxa ${index === EconomicIndex.CDI ? 'CDI' : 'Selic'} atual.`)
  } finally {
    rateLoading.value = null
  }
}

const pct = (v: number | null | undefined) => (v == null ? '—' : formatPercent(v, true))
const num = (v: number | null | undefined) => (v == null ? '—' : formatNumber(v, 2))

type Tone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'neutral'
const toneClass: Record<Tone, string> = {
  indigo: 'text-indigo-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  neutral: 'text-[var(--text-primary)]',
}
const signTone = (v: number | null | undefined): Tone => (v == null ? 'neutral' : v >= 0 ? 'emerald' : 'rose')
// VaR/CVaR are positive losses; <= 0 means even the worst tail periods were gains.
const loss = (v: number | null | undefined) => (v != null && v <= 0 ? 'Sem perda' : pct(v))
const lossTone = (v: number | null | undefined): Tone => (v != null && v <= 0 ? 'emerald' : 'rose')

const drawdownHint = computed(() => {
  const r = result.value
  if (!r || r.drawdownPeakIndex == null) return 'Nenhuma queda a partir de um pico.'
  const rec = r.drawdownRecoveryIndex != null ? `recuperado no ${r.drawdownRecoveryIndex}` : 'ainda não recuperado'
  return `Pico no período ${r.drawdownPeakIndex}, fundo no ${r.drawdownTroughIndex}, ${rec} (0 = início).`
})

const cards = computed(() => {
  const r = result.value
  if (!r) return []
  const c = Math.round((r.confidenceLevel ?? 0.95) * 100)
  return [
    { label: 'Retorno acumulado', value: pct(r.cumulativeReturn), tone: signTone(r.cumulativeReturn),
      hint: `Resultado composto de ${r.periods} períodos.` },
    { label: 'Retorno anualizado (CAGR)', value: pct(r.annualizedReturn), tone: signTone(r.annualizedReturn),
      hint: 'Taxa anual composta equivalente ao retorno acumulado.' },
    { label: 'Volatilidade anualizada', value: pct(r.annualizedVolatility), tone: 'amber' as Tone,
      hint: `Desvio-padrão dos retornos (${pct(r.periodVolatility)} por período) × √${r.periodsPerYear}.` },
    { label: 'Índice de Sharpe', value: num(r.sharpeRatio), tone: 'indigo' as Tone,
      hint: 'Retorno excedente à taxa livre de risco por unidade de volatilidade (a.a.).' },
    { label: 'Índice de Sortino', value: num(r.sortinoRatio), tone: 'indigo' as Tone,
      hint: 'Como o Sharpe, mas penaliza só as quedas abaixo da taxa livre de risco.' },
    { label: 'Drawdown máximo', value: pct(r.maxDrawdown), tone: 'rose' as Tone, hint: drawdownHint.value },
    { label: 'Índice de Calmar', value: num(r.calmarRatio), tone: 'indigo' as Tone,
      hint: 'Retorno anualizado dividido pelo drawdown máximo.' },
    { label: `VaR histórico ${c}%`, value: loss(r.historicalVar), tone: lossTone(r.historicalVar),
      hint: r.historicalVar != null && r.historicalVar <= 0
        ? 'Nenhum período de perda na cauda observada.'
        : `Perda por período igualada ou superada em ~${100 - c}% dos períodos observados.` },
    { label: `CVaR histórico ${c}%`, value: loss(r.historicalCvar), tone: lossTone(r.historicalCvar),
      hint: `Perda média nos piores ~${100 - c}% dos períodos (a cauda a partir do VaR).` },
  ]
})

const benchCards = computed(() => {
  const b = result.value?.benchmark
  if (!b) return []
  return [
    { label: 'Beta', value: num(b.beta), tone: 'indigo' as Tone,
      hint: 'Sensibilidade ao benchmark: 1 = acompanha, >1 = amplifica.' },
    { label: 'Alfa de Jensen (a.a.)', value: pct(b.jensensAlphaAnnualized), tone: signTone(b.jensensAlphaAnnualized),
      hint: 'Retorno acima do previsto pelo CAPM para o beta da carteira.' },
    { label: 'Correlação', value: num(b.correlation), tone: 'neutral' as Tone,
      hint: 'De -1 a 1: quanto os retornos andam juntos.' },
    { label: 'R²', value: num(b.rSquared), tone: 'neutral' as Tone,
      hint: 'Parcela da variação explicada pelo benchmark.' },
    { label: 'Tracking error (a.a.)', value: pct(b.trackingErrorAnnualized), tone: 'amber' as Tone,
      hint: 'Volatilidade da diferença de retorno em relação ao benchmark.' },
    { label: 'Information ratio', value: num(b.informationRatio), tone: 'indigo' as Tone,
      hint: 'Retorno ativo anualizado por unidade de tracking error.' },
    { label: 'Benchmark: retorno anualizado', value: pct(b.annualizedReturn), tone: signTone(b.annualizedReturn),
      hint: `Volatilidade anualizada de ${pct(b.annualizedVolatility)}.` },
  ]
})

const wealthSeries = computed(() => {
  const r = result.value
  if (!r) return []
  const s = [{ label: 'Ativo', values: r.wealthIndex, color: '#6366f1' }]
  if (r.benchmarkWealthIndex) s.push({ label: 'Benchmark', values: r.benchmarkWealthIndex, color: '#10b981' })
  return s
})
const drawdownSeries = computed(() =>
  result.value ? [{ label: 'Drawdown do ativo', values: result.value.drawdownSeries, color: '#f43f5e' }] : [],
)
const formatWealth = (v: number) => formatNumber(v, 2)
const formatDd = (v: number) => formatPercent(v, true)

const textareaClass =
  'w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] text-base sm:text-sm px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500'
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Métricas de Risco</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Sharpe, Sortino, drawdown, VaR, beta e alfa a partir de uma série de retornos ou preços
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Formulário -->
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <div class="space-y-4">
          <div>
            <span id="risk-input-type" class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Tipo de série</span>
            <div class="flex gap-2" role="group" aria-labelledby="risk-input-type">
              <button
                v-for="opt in [{ v: 'RETURNS', l: 'Retornos' }, { v: 'PRICES', l: 'Preços / cotas' }] as const"
                :key="opt.v"
                type="button"
                :aria-pressed="form.inputType === opt.v"
                :class="[
                  'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                  form.inputType === opt.v
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-base)]',
                ]"
                @click="form.inputType = opt.v"
              >
                {{ opt.l }}
              </button>
            </div>
          </div>

          <AppToggle
            v-if="form.inputType === 'RETURNS'"
            v-model="form.percentMode"
            size="sm"
            label="Retornos em %"
            :description="form.percentMode ? 'Ex.: 1,5 = 1,5% no período' : 'Ex.: 0,015 = 1,5% (valores com % são sempre divididos por 100)'"
          />

          <div>
            <label for="risk-values" class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              {{ form.inputType === 'RETURNS' ? 'Retornos do ativo' : 'Preços do ativo' }}
            </label>
            <textarea
              id="risk-values"
              v-model="form.valuesText"
              rows="6"
              :class="textareaClass"
              :aria-invalid="!!assetError"
              aria-describedby="risk-values-hint"
              :placeholder="form.inputType === 'RETURNS' ? '1,2\n-0,8\n2,5%\n...' : '100,00\n101,35\n99,80\n...'"
            />
            <p id="risk-values-hint" :class="['text-xs mt-1', assetError ? 'text-rose-400' : 'text-[var(--text-muted)]']">
              {{ assetError || `${asset.values.length} valores · separe por linha, espaço ou ";" · aceita 1.234,56 ou 1,234.56` }}
            </p>
          </div>

          <div>
            <label for="risk-bench" class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Benchmark (opcional, mesma quantidade e tipo)
            </label>
            <textarea
              id="risk-bench"
              v-model="form.benchmarkText"
              rows="4"
              :class="textareaClass"
              :aria-invalid="!!benchError"
              aria-describedby="risk-bench-hint"
              placeholder="Ex.: retornos do Ibovespa no mesmo período"
            />
            <p id="risk-bench-hint" :class="['text-xs mt-1', benchError ? 'text-rose-400' : 'text-[var(--text-muted)]']">
              {{ benchError || (hasBench ? `${bench.values.length} valores` : 'Habilita beta, alfa, correlação e tracking error') }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppSelect v-model="form.periodicity" label="Periodicidade" :options="periodicityOptions" />
            <AppSelect v-model="form.confidence" label="Confiança do VaR" :options="confidenceOptions" />
          </div>

          <div>
            <AppInput
              v-model="form.riskFree"
              label="Taxa livre de risco (%) — opcional"
              type="number"
              :step="0.01"
              placeholder="0"
              hint="Convertida para a taxa equivalente por período"
            >
              <template #suffix>% a.a.</template>
            </AppInput>
            <div class="flex gap-2 mt-2">
              <AppButton
                size="sm"
                variant="secondary"
                :loading="rateLoading === EconomicIndex.CDI"
                @click="fillRate(EconomicIndex.CDI)"
              >
                Usar CDI atual
              </AppButton>
              <AppButton
                size="sm"
                variant="secondary"
                :loading="rateLoading === EconomicIndex.SELIC"
                @click="fillRate(EconomicIndex.SELIC)"
              >
                Usar Selic atual
              </AppButton>
            </div>
          </div>

          <AppButton full-width :loading="isPending" :disabled="!isValid" class="mt-2" @click="() => mutate()">
            Calcular métricas
          </AppButton>
        </div>
      </AppCard>

      <!-- Resultado -->
      <div v-if="result" class="space-y-4 animate-fade-in">
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <AppCard v-for="c in cards" :key="c.label">
            <p class="text-xs text-[var(--text-muted)]">{{ c.label }}</p>
            <p :class="['text-xl font-bold mt-1 tabular-nums', toneClass[c.tone]]">{{ c.value }}</p>
            <p class="text-xs text-[var(--text-muted)] mt-1">{{ c.hint }}</p>
          </AppCard>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Cole uma série de retornos ou preços e calcule</p>
      </div>
    </div>

    <template v-if="result">
      <AppCard v-if="benchCards.length">
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Comparação com o benchmark</h2>
        </template>
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="c in benchCards" :key="c.label">
            <p class="text-xs text-[var(--text-muted)]">{{ c.label }}</p>
            <p :class="['text-lg font-bold mt-1 tabular-nums', toneClass[c.tone]]">{{ c.value }}</p>
            <p class="text-xs text-[var(--text-muted)] mt-1">{{ c.hint }}</p>
          </div>
        </div>
      </AppCard>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Patrimônio acumulado (base 1)</h2>
          </template>
          <RiskLineChart
            :series="wealthSeries"
            :baseline="1"
            :format-y="formatWealth"
            label="Evolução do patrimônio acumulado do ativo e do benchmark"
          />
        </AppCard>
        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Drawdown (underwater)</h2>
          </template>
          <RiskLineChart
            :series="drawdownSeries"
            :baseline="0"
            area
            :format-y="formatDd"
            label="Queda percentual do ativo em relação ao pico anterior"
          />
        </AppCard>
      </div>
    </template>
  </div>
</template>
