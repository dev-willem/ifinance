<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { analysisApi } from '@/services/api/analysis'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { AnalysisResponse } from '@/types'

const { formatPercent, formatNumber } = useFormatBR()
const toast = useToast()

interface CashFlowRow {
  period: number
  value: number | null
}

const cashFlows = ref<CashFlowRow[]>([
  { period: 0, value: null },
  { period: 1, value: null },
  { period: 2, value: null },
])

const discountRate = ref<number | null>(null)
const result = ref<AnalysisResponse | null>(null)

function addCashFlow() {
  const nextPeriod = cashFlows.value.length
  cashFlows.value.push({ period: nextPeriod, value: null })
}

function removeCashFlow(i: number) {
  if (cashFlows.value.length <= 2) {
    toast.warning('Mínimo de 2 fluxos de caixa.')
    return
  }
  cashFlows.value.splice(i, 1)
  // Renumber
  cashFlows.value.forEach((cf, idx) => { cf.period = idx })
}

const isValid = computed(() => {
  return cashFlows.value.every((cf) => cf.value !== null) && discountRate.value !== null
})

const { mutate, isPending } = useMutation({
  mutationFn: (payload: Parameters<typeof analysisApi.analyze>[0]) => analysisApi.analyze(payload),
  onSuccess: (data) => {
    result.value = data
    toast.success('Análise concluída!')
  },
  onError: () => {
    toast.error('Erro ao calcular análise.')
  },
})

function calculate() {
  if (!isValid.value || discountRate.value === null) return
  mutate({
    cashFlows: cashFlows.value.map((cf) => cf.value ?? 0),
    discountRate: discountRate.value / 100,
  })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Análise de Viabilidade</h1>
      <p class="text-sm text-[var(--text-muted)]">Calcule VPL, TIR e Payback de projetos de investimento</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Input panel -->
      <div class="space-y-5">
        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Fluxos de Caixa</h2>
            <AppButton variant="ghost" size="sm" type="button" @click="addCashFlow">
              <template #icon-left>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              Adicionar
            </AppButton>
          </template>

          <div class="space-y-2">
            <div
              v-for="(cf, i) in cashFlows"
              :key="i"
              class="flex items-center gap-3"
            >
              <div class="w-16 flex-shrink-0">
                <div class="flex h-9 items-center justify-center rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)]">
                  P{{ cf.period }}
                </div>
              </div>
              <div class="flex-1 relative">
                <input
                  v-model.number="cf.value"
                  type="number"
                  :placeholder="i === 0 ? 'Investimento inicial (negativo)' : 'Retorno do período'"
                  :class="[
                    'w-full rounded-lg border bg-[var(--bg-card)] text-sm h-9 px-3 py-2 font-mono',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
                    'border-[var(--border-subtle)] placeholder:text-[var(--text-muted)] transition-colors',
                    cf.value !== null && cf.value < 0 ? 'text-rose-400' : 'text-emerald-400',
                  ]"
                />
              </div>
              <button
                v-if="cashFlows.length > 2"
                class="flex-shrink-0 rounded p-1.5 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                @click="removeCashFlow(i)"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <AppInput
            v-model="discountRate"
            label="Taxa de Desconto (%)"
            type="number"
            :min="0.01"
            :max="100"
            :step="0.1"
            placeholder="10"
            hint="Taxa mínima de atratividade (TMA)"
          >
            <template #suffix>% a.p.</template>
          </AppInput>

          <AppButton
            full-width
            :loading="isPending"
            :disabled="!isValid"
            class="mt-4"
            @click="calculate"
          >
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </template>
            Calcular Análise
          </AppButton>
        </AppCard>
      </div>

      <!-- Results panel -->
      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <!-- NPV decision banner -->
        <div
          :class="[
            'rounded-xl border p-4 flex items-center gap-3',
            result.npvPositive
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-rose-500/30 bg-rose-500/10',
          ]"
        >
          <div :class="['flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', result.npvPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20']">
            <svg v-if="result.npvPositive" class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p :class="['font-semibold', result.npvPositive ? 'text-emerald-400' : 'text-rose-400']">
              Projeto {{ result.npvPositive ? 'VIÁVEL' : 'INVIÁVEL' }}
            </p>
            <p class="text-xs text-[var(--text-secondary)]">
              {{ result.npvPositive ? 'VPL positivo — o projeto gera valor acima da TMA' : 'VPL negativo — o projeto não cobre o custo de capital' }}
            </p>
          </div>
        </div>

        <!-- Metrics grid -->
        <div class="grid grid-cols-2 gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">VPL</p>
            <p :class="['text-xl font-bold mt-1', result.npvPositive ? 'text-emerald-400' : 'text-rose-400']">
              R$ {{ formatNumber(result.npv) }}
            </p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">TIR</p>
            <p class="text-xl font-bold text-indigo-400 mt-1">
              {{ formatPercent(result.irrPercent) }}
            </p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Payback Simples</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">
              {{ result.paybackAchieved ? `${formatNumber(result.simplePayback)} períodos` : 'Não atingido' }}
            </p>
            <p v-if="result.paybackAchieved" class="text-xs text-[var(--text-muted)] mt-0.5">
              Período {{ result.simplePaybackPeriod }}
            </p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Payback Descontado</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">
              {{ result.paybackAchieved ? `${formatNumber(result.discountedPayback)} períodos` : 'Não atingido' }}
            </p>
            <p v-if="result.paybackAchieved" class="text-xs text-[var(--text-muted)] mt-0.5">
              Período {{ result.discountedPaybackPeriod }}
            </p>
          </AppCard>
        </div>

        <!-- Cash flow visualization -->
        <AppCard>
          <template #header>
            <h3 class="text-sm font-semibold text-[var(--text-secondary)]">Fluxo de Caixa</h3>
          </template>
          <div class="flex items-end gap-2 h-32 pt-2">
            <div
              v-for="(cf, i) in cashFlows"
              :key="i"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div class="flex-1 w-full flex items-end justify-center">
                <div
                  :class="[
                    'w-full rounded-t transition-all',
                    (cf.value ?? 0) >= 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60',
                  ]"
                  :style="{
                    height: cf.value
                      ? `${Math.min(100, Math.abs(cf.value) / Math.max(...cashFlows.map((c) => Math.abs(c.value ?? 0))) * 100)}%`
                      : '4px',
                  }"
                />
              </div>
              <span class="text-[10px] text-[var(--text-muted)]">P{{ i }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Empty results state -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--border-subtle)] mb-4">
          <svg class="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M8 16V10m4 6V4m4 12V8" />
          </svg>
        </div>
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Preencha os fluxos e calcule a análise</p>
      </div>
    </div>
  </div>
</template>
