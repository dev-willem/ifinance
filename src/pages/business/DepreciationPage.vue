<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { isAxiosError } from 'axios'
import { depreciationApi } from '@/services/api/depreciation'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import MetricCard from '@/components/data/MetricCard.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import DepreciationChart from '@/components/depreciation/DepreciationChart.vue'
import { allowsShiftAcceleration, parseUnitsList } from '@/components/depreciation/depreciationChart'
import type { DepreciationMethod, DepreciationResponse } from '@/types/depreciation'

const { formatCurrency, formatNumber } = useFormatBR()
const toast = useToast()

const METHOD_LABELS: Record<DepreciationMethod, string> = {
  STRAIGHT_LINE: 'Linear',
  SUM_OF_YEARS_DIGITS: 'Soma dos dígitos',
  DECLINING_BALANCE: 'Saldo decrescente',
  UNITS_OF_PRODUCTION: 'Unidades produzidas',
}
const methodOptions = Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))

const form = ref({
  assetClass: null as string | null,
  assetValue: null as number | null,
  residualValue: 0 as number | null,
  usefulLifeYears: 5 as number | null,
  method: 'STRAIGHT_LINE' as DepreciationMethod,
  decliningFactor: 2 as number | null,
  shiftsPerDay: 1,
  firstYearMonths: 12 as number | null,
  totalUnits: null as number | null,
  unitsPerYear: '',
})

const { data: assetClasses } = useQuery({
  queryKey: ['depreciation', 'asset-classes'],
  queryFn: depreciationApi.assetClasses,
  staleTime: Infinity,
})

const assetClassOptions = computed(() =>
  (assetClasses.value ?? []).map((c) => ({
    value: c.code,
    label: `${c.description} — ${formatNumber(c.annualRatePercent, 0)}% a.a. / ${c.usefulLifeYears} anos`,
  })),
)

function onAssetClassChange(code: string | number | null) {
  const cls = assetClasses.value?.find((c) => c.code === code)
  if (cls) form.value.usefulLifeYears = cls.usefulLifeYears
}

const isUnits = computed(() => form.value.method === 'UNITS_OF_PRODUCTION')
const shiftsAllowed = computed(() => allowsShiftAcceleration(form.value.assetClass))
const effectiveShifts = computed(() => (isUnits.value || !shiftsAllowed.value ? 1 : form.value.shiftsPerDay))
const parsedUnits = computed(() => parseUnitsList(form.value.unitsPerYear))

const result = ref<DepreciationResponse | null>(null)
const comparison = ref<DepreciationResponse[]>([])

function errorMessage(err: unknown): string {
  if (isAxiosError(err) && typeof err.response?.data?.message === 'string') return err.response.data.message
  return 'Erro ao calcular a depreciação.'
}

const { mutate, isPending } = useMutation({
  mutationFn: () => {
    const f = form.value
    const common = {
      assetValue: f.assetValue!,
      residualValue: f.residualValue ?? 0,
      usefulLifeYears: f.usefulLifeYears!,
      decliningFactor: f.decliningFactor ?? undefined,
      shiftsPerDay: effectiveShifts.value,
      firstYearMonths: f.firstYearMonths ?? 12,
    }
    return Promise.all([
      depreciationApi.calculate({
        ...common,
        method: f.method,
        ...(isUnits.value ? { totalUnits: f.totalUnits!, unitsPerYear: parsedUnits.value! } : {}),
      }),
      depreciationApi.compare(common),
    ])
  },
  onSuccess: ([schedule, compared]) => {
    result.value = schedule
    comparison.value = compared
    toast.success('Depreciação calculada!')
  },
  onError: (err) => toast.error(errorMessage(err)),
})

const isValid = computed(() => {
  const f = form.value
  const baseOk =
    f.assetValue !== null && f.assetValue > 0 &&
    f.residualValue !== null && f.residualValue >= 0 && f.residualValue < f.assetValue &&
    f.usefulLifeYears !== null && Number.isInteger(f.usefulLifeYears) && f.usefulLifeYears >= 1 && f.usefulLifeYears <= 50 &&
    f.firstYearMonths !== null && Number.isInteger(f.firstYearMonths) && f.firstYearMonths >= 1 && f.firstYearMonths <= 12
  if (!baseOk) return false
  if (f.method === 'DECLINING_BALANCE') return f.decliningFactor !== null && f.decliningFactor >= 1 && f.decliningFactor <= 4
  if (isUnits.value) return f.totalUnits !== null && f.totalUnits > 0 && parsedUnits.value !== null
  return true
})

const lifeLabel = computed(() => {
  if (!result.value) return '-'
  const years = result.value.effectiveLifeYears
  return `${formatNumber(years, Number.isInteger(years) ? 0 : 2)} ${years === 1 ? 'ano' : 'anos'}`
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Depreciação de Ativos</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Calcule a depreciação linear, acelerada por turnos (RIR/2018, art. 323) e por métodos de
        aceleração contábil
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <div class="space-y-4">
          <AppSelect
            v-model="form.assetClass"
            label="Classe do ativo (Receita Federal)"
            placeholder="Selecione para preencher a vida útil"
            :options="assetClassOptions"
            hint="Taxas da IN RFB nº 1.700/2017, Anexo III"
            @change="onAssetClassChange"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.assetValue" label="Valor do ativo (R$)" type="number" :min="0" :step="0.01" placeholder="10000">
              <template #prefix>R$</template>
            </AppInput>
            <AppInput v-model="form.residualValue" label="Valor residual (R$)" type="number" :min="0" :step="0.01" placeholder="0">
              <template #prefix>R$</template>
            </AppInput>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.usefulLifeYears" label="Vida útil (anos)" type="number" :min="1" :max="50" placeholder="5" />
            <AppSelect
              v-model="form.method"
              label="Método"
              :options="methodOptions"
            />
          </div>

          <AppInput
            v-if="form.method === 'DECLINING_BALANCE'"
            v-model="form.decliningFactor"
            label="Fator do saldo decrescente"
            type="number"
            :min="1"
            :max="4"
            :step="0.1"
            hint="2 = saldo duplamente decrescente; muda para linear quando esta gera cota maior"
          />

          <template v-if="isUnits">
            <AppInput
              v-model="form.totalUnits"
              label="Capacidade total (unidades)"
              type="number"
              :min="1"
              placeholder="100000"
            />
            <div>
              <label for="units-per-year" class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Unidades produzidas por ano
              </label>
              <textarea
                id="units-per-year"
                v-model="form.unitsPerYear"
                rows="2"
                placeholder="30000; 25000; 20000; 15000; 10000"
                class="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-base sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
              <p class="text-xs text-[var(--text-muted)] mt-1">
                Separe os anos por espaço ou ponto e vírgula. A soma deve atingir a capacidade total.
              </p>
            </div>
          </template>

          <div v-else>
            <span id="shifts-label" class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Turnos diários de 8 horas
            </span>
            <div class="flex gap-2" role="group" aria-labelledby="shifts-label">
              <button
                v-for="s in [1, 2, 3]"
                :key="s"
                type="button"
                :aria-pressed="effectiveShifts === s"
                :disabled="s > 1 && !shiftsAllowed"
                :class="[
                  'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                  effectiveShifts === s
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-base)]',
                ]"
                @click="form.shiftsPerDay = s"
              >
                {{ s }} ({{ ['1,0', '1,5', '2,0'][s - 1] }}×)
              </button>
            </div>
            <p class="text-xs text-[var(--text-muted)] mt-1">
              {{
                shiftsAllowed
                  ? 'Coeficiente aplicado à taxa (RIR/2018, art. 323, bens móveis) — reduz a vida útil'
                  : 'A depreciação acelerada por turnos (RIR/2018, art. 323) aplica-se apenas a bens móveis'
              }}
            </p>
          </div>

          <AppInput
            v-model="form.firstYearMonths"
            label="Meses de uso no primeiro ano"
            type="number"
            :min="1"
            :max="12"
            hint="Pro rata do ano de aquisição (12 = ano completo)"
          />

          <AppButton full-width :loading="isPending" :disabled="!isValid" class="mt-2" @click="() => mutate()">
            Calcular Depreciação
          </AppButton>
        </div>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <MetricCard label="Taxa anual" :value="`${formatNumber(result.annualRatePercent, 2)}%`" color="primary" />
          <MetricCard label="Vida útil efetiva" :value="lifeLabel" />
          <MetricCard
            label="Cota mensal (1º ano cheio)"
            :value="formatCurrency(result.monthlyDepreciationFirstFullYear)"
            color="warning"
          />
          <MetricCard label="Base depreciável" :value="formatCurrency(result.depreciableBase)" color="success" />
        </div>

        <AppCard v-if="comparison.length">
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Valor contábil por método</h2>
          </template>
          <DepreciationChart :schedules="comparison" :labels="METHOD_LABELS" />
        </AppCard>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Preencha os parâmetros e calcule a depreciação"
      />
    </div>

    <AppCard v-if="result" padding="none">
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">
          Cronograma — {{ METHOD_LABELS[result.method] }}
        </h2>
      </template>
      <div class="overflow-x-auto">
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
              <th scope="col" class="px-4 py-2 font-medium">Ano</th>
              <th scope="col" class="px-4 py-2 font-medium text-right">Valor inicial</th>
              <th scope="col" class="px-4 py-2 font-medium text-right">Depreciação</th>
              <th scope="col" class="px-4 py-2 font-medium text-right">Acumulada</th>
              <th scope="col" class="px-4 py-2 font-medium text-right">Valor final</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in result.rows"
              :key="row.year"
              class="border-b border-[var(--border-subtle)] last:border-0 text-[var(--text-primary)]"
            >
              <td class="px-4 py-2">
                {{ row.year }}
                <span v-if="row.months !== 12" class="text-xs text-[var(--text-muted)]">({{ row.months }}m)</span>
              </td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(row.openingBookValue) }}</td>
              <td class="px-4 py-2 text-right text-rose-400">{{ formatCurrency(row.depreciation) }}</td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(row.accumulatedDepreciation) }}</td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(row.closingBookValue) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-semibold text-[var(--text-primary)] border-t border-[var(--border-subtle)]">
              <td class="px-4 py-2" colspan="2">Total</td>
              <td class="px-4 py-2 text-right">{{ formatCurrency(result.totalDepreciation) }}</td>
              <td class="px-4 py-2" />
              <td class="px-4 py-2 text-right">{{ formatCurrency(result.finalBookValue) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </AppCard>
  </div>
</template>
