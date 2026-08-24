<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { planningApi } from '@/services/api/planning'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { EmergencyResponse } from '@/types'

const { formatCurrency, formatNumber } = useFormatBR()
const toast = useToast()

const form = ref({
  monthlyExpenses: null as number | null,
  monthsCoverage: 6 as number,
  currentSavings: null as number | null,
  monthlySavings: null as number | null,
  expectedAnnualReturn: null as number | null,
})

const result = ref<EmergencyResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    planningApi.emergency({
      monthlyExpenses: form.value.monthlyExpenses!,
      monthsCoverage: form.value.monthsCoverage,
      currentSavings: form.value.currentSavings!,
      monthlySavings: form.value.monthlySavings!,
      expectedAnnualReturn: form.value.expectedAnnualReturn ? form.value.expectedAnnualReturn / 100 : 0,
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('Reserva calculada!')
  },
  onError: () => toast.error('Erro ao calcular reserva.'),
})

function isValid() {
  return (
    form.value.monthlyExpenses !== null &&
    form.value.monthlyExpenses > 0 &&
    form.value.currentSavings !== null &&
    form.value.monthlySavings !== null
  )
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Reserva de Emergência</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Calcule sua meta de reserva de emergência e quanto falta para atingi-la
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Formulário -->
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <div class="space-y-4">
          <AppInput
            v-model="form.monthlyExpenses"
            label="Despesas mensais (R$)"
            type="number"
            :min="1"
            placeholder="5000"
            hint="Custos fixos mensais (aluguel, alimentação, etc.)"
          >
            <template #prefix>R$</template>
          </AppInput>

          <div>
            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Meses de cobertura
            </label>
            <div class="flex gap-2">
              <button
                v-for="m in [3, 6, 9, 12]"
                :key="m"
                :class="[
                  'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                  form.monthsCoverage === m
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-base)]',
                ]"
                @click="form.monthsCoverage = m"
              >
                {{ m }}m
              </button>
            </div>
            <p class="text-xs text-[var(--text-muted)] mt-1">Recomendado: 6 a 12 meses</p>
          </div>

          <AppInput
            v-model="form.currentSavings"
            label="Reserva atual (R$)"
            type="number"
            :min="0"
            placeholder="0"
            hint="Quanto você já tem reservado"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.monthlySavings"
            label="Aporte mensal (R$)"
            type="number"
            :min="0"
            placeholder="500"
            hint="Quanto você pode separar por mês"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.expectedAnnualReturn"
            label="Retorno esperado (%) — opcional"
            type="number"
            :min="0"
            :max="20"
            :step="0.1"
            placeholder="10"
            hint="Deixe vazio para cálculo sem rendimento"
          >
            <template #suffix>% a.a.</template>
          </AppInput>

          <AppButton
            full-width
            :loading="isPending"
            :disabled="!isValid()"
            class="mt-2"
            @click="() => mutate()"
          >
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </template>
            Calcular Reserva
          </AppButton>
        </div>
      </AppCard>

      <!-- Resultado -->
      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <!-- Banner de progresso -->
        <div
          :class="[
            'rounded-xl border p-5',
            result.targetReached
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-amber-500/30 bg-amber-500/10',
          ]"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{{ result.targetReached ? '✅' : '🛡️' }}</span>
            <div>
              <p :class="['font-bold text-lg', result.targetReached ? 'text-emerald-400' : 'text-amber-400']">
                {{ result.targetReached ? 'Reserva completa!' : `${formatNumber(result.progressPercent, 1)}% atingido` }}
              </p>
              <p class="text-sm text-[var(--text-secondary)]">
                Meta: {{ formatCurrency(result.targetAmount) }}
              </p>
            </div>
          </div>

          <!-- Barra de progresso -->
          <div class="h-3 bg-[var(--bg-base)] rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-700', result.targetReached ? 'bg-emerald-500' : 'bg-amber-500']"
              :style="{ width: `${Math.min(100, result.progressPercent)}%` }"
            />
          </div>
        </div>

        <!-- Métricas -->
        <div class="grid grid-cols-2 gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Meta total</p>
            <p class="text-xl font-bold text-indigo-400 mt-1">{{ formatCurrency(result.targetAmount) }}</p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Cobertura atual</p>
            <p class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ formatNumber(result.currentCoverageMonths, 1) }} meses</p>
          </AppCard>

          <AppCard v-if="!result.targetReached && result.monthsToComplete !== null">
            <p class="text-xs text-[var(--text-muted)]">Tempo para completar</p>
            <p class="text-lg font-bold text-amber-400 mt-1">
              {{ result.monthsToComplete }} {{ result.monthsToComplete === 1 ? 'mês' : 'meses' }}
            </p>
          </AppCard>

          <AppCard v-if="!result.targetReached && result.monthlyShortfall !== null">
            <p class="text-xs text-[var(--text-muted)]">Faltam</p>
            <p class="text-lg font-bold text-rose-400 mt-1">{{ formatCurrency(result.monthlyShortfall) }}</p>
          </AppCard>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--border-subtle)] mb-4">
          <svg class="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Preencha os parâmetros e calcule sua reserva</p>
      </div>
    </div>
  </div>
</template>
