<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { planningApi } from '@/services/api/planning'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { RetirementResponse } from '@/types'

const { formatCurrency, formatPercent, formatNumber } = useFormatBR()
const toast = useToast()

const form = ref({
  monthlyExpenses: null as number | null,
  currentSavings: null as number | null,
  monthlySavings: null as number | null,
  expectedAnnualReturn: null as number | null,
  withdrawalRate: 4 as number,
})

const result = ref<RetirementResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    planningApi.retirement({
      monthlyExpenses: form.value.monthlyExpenses!,
      currentSavings: form.value.currentSavings!,
      monthlySavings: form.value.monthlySavings!,
      expectedAnnualReturn: form.value.expectedAnnualReturn! / 100,
      withdrawalRate: form.value.withdrawalRate / 100,
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('Planejamento calculado!')
  },
  onError: () => toast.error('Erro ao calcular planejamento.'),
})

function isValid() {
  return (
    form.value.monthlyExpenses !== null &&
    form.value.monthlyExpenses > 0 &&
    form.value.currentSavings !== null &&
    form.value.monthlySavings !== null &&
    form.value.expectedAnnualReturn !== null &&
    form.value.expectedAnnualReturn > 0
  )
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Planejamento de Aposentadoria (FIRE)</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Descubra quanto você precisa acumular para viver de renda — baseado na regra dos 4%
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
            hint="Quanto você gasta por mês atualmente"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.currentSavings"
            label="Patrimônio atual (R$)"
            type="number"
            :min="0"
            placeholder="100000"
            hint="Quanto você já tem investido hoje"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.monthlySavings"
            label="Aporte mensal (R$)"
            type="number"
            :min="0"
            placeholder="3000"
            hint="Quanto você investe por mês"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.expectedAnnualReturn"
            label="Retorno anual esperado (%)"
            type="number"
            :min="0.1"
            :max="30"
            :step="0.1"
            placeholder="10"
            hint="Rentabilidade anual estimada da carteira"
          >
            <template #suffix>% a.a.</template>
          </AppInput>

          <AppInput
            v-model="form.withdrawalRate"
            label="Taxa de retirada (%)"
            type="number"
            :min="1"
            :max="10"
            :step="0.5"
            placeholder="4"
            hint="Regra dos 4%: retire até 4% ao ano do patrimônio"
          >
            <template #suffix>%</template>
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
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </template>
            Calcular FIRE
          </AppButton>
        </div>
      </AppCard>

      <!-- Resultado -->
      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <!-- Banner principal -->
        <div
          :class="[
            'rounded-xl border p-5 flex items-center gap-4',
            result.alreadyFire
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-indigo-500/30 bg-indigo-500/10',
          ]"
        >
          <div :class="['flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl', result.alreadyFire ? 'bg-emerald-500/20' : 'bg-indigo-500/20']">
            {{ result.alreadyFire ? '🎉' : '🎯' }}
          </div>
          <div>
            <p :class="['text-lg font-bold', result.alreadyFire ? 'text-emerald-400' : 'text-indigo-400']">
              {{ result.alreadyFire ? 'Você já atingiu o FIRE!' : `${result.yearsToFire} anos e ${(result.monthsToFire! % 12)} meses para o FIRE` }}
            </p>
            <p class="text-sm text-[var(--text-secondary)] mt-0.5">
              Meta: {{ formatCurrency(result.targetAmount) }}
            </p>
          </div>
        </div>

        <!-- Métricas -->
        <div class="grid grid-cols-2 gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Patrimônio necessário</p>
            <p class="text-xl font-bold text-indigo-400 mt-1">{{ formatCurrency(result.targetAmount) }}</p>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">Regra dos {{ formatNumber((form.withdrawalRate) ) }}%</p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Despesa anual</p>
            <p class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ formatCurrency(result.annualExpenses) }}</p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Em 10 anos</p>
            <p class="text-lg font-bold text-emerald-400 mt-1">{{ formatCurrency(result.projectedAmountAt10Years) }}</p>
          </AppCard>

          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Em 20 anos</p>
            <p class="text-lg font-bold text-emerald-400 mt-1">{{ formatCurrency(result.projectedAmountAt20Years) }}</p>
          </AppCard>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--border-subtle)] mb-4">
          <svg class="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Preencha os parâmetros e calcule seu FIRE</p>
      </div>
    </div>
  </div>
</template>
