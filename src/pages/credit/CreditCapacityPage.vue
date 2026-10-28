<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { creditApi } from '@/services/api/credit'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import CommitmentBar from '@/components/credit/CommitmentBar.vue'
import { apiErrorMessage, isCapacityFormValid, toCapacityRequest, type CapacityForm } from '@/components/credit/credit'
import type { CreditCapacityResponse } from '@/types/credit'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref<CapacityForm>({
  monthlyIncome: null,
  existingMonthlyDebts: 0,
  maxCommitmentPercent: 30,
  annualRatePercent: null,
  termMonths: 60,
  amortizationSystem: 'PRICE',
  desiredLoanAmount: null,
})

const systemOptions = [
  { value: 'PRICE', label: 'PRICE (parcelas fixas)' },
  { value: 'SAC', label: 'SAC (parcelas decrescentes)' },
]

const result = ref<CreditCapacityResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () => creditApi.capacity(toCapacityRequest(form.value)),
  onSuccess: (data) => {
    result.value = data
    toast.success('Capacidade de crédito calculada!')
  },
  onError: (e) => toast.error(apiErrorMessage(e, 'Erro ao calcular capacidade de crédito.')),
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Capacidade de Crédito</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Descubra a parcela e o valor máximo de empréstimo que cabem na sua renda
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <form class="space-y-4" @submit.prevent="isCapacityFormValid(form) && mutate()">
          <AppInput v-model="form.monthlyIncome" label="Renda mensal líquida (R$)" type="number" :min="0" placeholder="8000">
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.existingMonthlyDebts"
            label="Parcelas de dívidas atuais (R$)"
            type="number"
            :min="0"
            placeholder="0"
            hint="Soma das parcelas mensais que você já paga"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.maxCommitmentPercent"
            label="Comprometimento máximo da renda (%)"
            type="number"
            :min="5"
            :max="70"
            :step="1"
            placeholder="30"
            hint="Entre 5% e 70%. Referência usual: 30%"
          >
            <template #suffix>%</template>
          </AppInput>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="form.annualRatePercent"
              label="Taxa de juros efetiva (%)"
              type="number"
              :min="0"
              :step="0.01"
              placeholder="24"
            >
              <template #suffix>% a.a.</template>
            </AppInput>

            <AppInput v-model="form.termMonths" label="Prazo (meses)" type="number" :min="1" :max="480" :step="1" placeholder="60" />
          </div>

          <AppSelect v-model="form.amortizationSystem" label="Sistema de amortização" :options="systemOptions" />

          <AppInput
            v-model="form.desiredLoanAmount"
            label="Valor desejado (R$) — opcional"
            type="number"
            :min="0"
            placeholder="50000"
            hint="Informe para saber se o empréstimo cabe no orçamento"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isCapacityFormValid(form)" class="mt-2">
            Analisar crédito
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right" aria-live="polite">
        <div
          :class="[
            'rounded-xl border p-5',
            result.approved === undefined
              ? 'border-indigo-500/30 bg-indigo-500/10'
              : result.approved
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-rose-500/30 bg-rose-500/10',
          ]"
        >
          <p
            v-if="result.approved !== undefined"
            :class="['font-bold text-lg mb-1', result.approved ? 'text-emerald-400' : 'text-rose-400']"
          >
            {{ result.approved ? 'Cabe no orçamento' : 'Não cabe no orçamento' }}
          </p>
          <p class="text-sm text-[var(--text-secondary)]">{{ result.statusMessage }}</p>
        </div>

        <AppCard>
          <CommitmentBar
            :current-percent="result.currentCommitmentPercent"
            :resulting-percent="result.resultingCommitmentPercent"
            :limit-percent="result.maxCommitmentRate * 100"
            :approved="result.approved"
          />
        </AppCard>

        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Parcela máxima</p>
            <p class="text-xl font-bold text-indigo-400 mt-1">{{ formatCurrency(result.maxInstallment) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Empréstimo máximo ({{ result.amortizationSystem }})</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCurrency(result.maxLoanAmount) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Comprometimento atual</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">{{ formatPercent(result.currentCommitmentPercent) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Taxa mensal equivalente</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">{{ formatPercent(result.monthlyRate, true) }} a.m.</p>
          </AppCard>

          <template v-if="result.desiredFirstInstallment !== undefined">
            <AppCard>
              <p class="text-xs text-[var(--text-muted)]">
                {{ result.amortizationSystem === 'SAC' ? 'Primeira parcela (maior)' : 'Parcela do valor desejado' }}
              </p>
              <p :class="['text-lg font-bold mt-1', result.approved ? 'text-emerald-400' : 'text-rose-400']">
                {{ formatCurrency(result.desiredFirstInstallment) }}
              </p>
            </AppCard>
            <AppCard>
              <p class="text-xs text-[var(--text-muted)]">Prazo mínimo que cabe</p>
              <p class="text-lg font-bold text-amber-400 mt-1">
                {{
                  result.minimumTermMonths !== undefined
                    ? `${result.minimumTermMonths} ${result.minimumTermMonths === 1 ? 'mês' : 'meses'}`
                    : 'Nenhum até 480 meses'
                }}
              </p>
            </AppCard>
          </template>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Preencha sua renda e as condições do crédito</p>
      </div>
    </div>
  </div>
</template>
