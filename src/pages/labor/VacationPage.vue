<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { laborApi } from '@/services/api/labor'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import PayslipTable from '@/components/labor/PayslipTable.vue'
import TaxBreakdown from '@/components/labor/TaxBreakdown.vue'
import LaborDisclaimer from '@/components/labor/LaborDisclaimer.vue'
import { TABLE_YEAR_OPTIONS, apiErrorMessage, optional } from '@/components/labor/labor'
import type { VacationResponse } from '@/types/labor'

const { formatCurrency } = useFormatBR()
const toast = useToast()

const form = ref({
  monthlySalary: null as number | null,
  averageVariablePay: null as number | null,
  days: 30 as number | null,
  soldDays: 0 as number | null,
  dependents: 0 as number | null,
  year: TABLE_YEAR_OPTIONS[0].value as string | number | null,
})

const result = ref<VacationResponse | null>(null)

// CLT art. 143: abono up to 1/3 of the entitled days (taken + sold)
const abonoError = computed(() => {
  const days = form.value.days ?? 0
  const sold = form.value.soldDays ?? 0
  if (days + sold > 30) return 'Dias de férias + dias vendidos não podem passar de 30.'
  if (sold * 3 > days + sold) return 'O abono é limitado a 1/3 dos dias de direito (ex.: 20 + 10).'
  return undefined
})

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    laborApi.vacation({
      monthlySalary: form.value.monthlySalary!,
      averageVariablePay: optional(form.value.averageVariablePay),
      days: form.value.days!,
      soldDays: form.value.soldDays ?? 0,
      dependents: form.value.dependents ?? 0,
      year: Number(form.value.year),
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('Férias calculadas!')
  },
  onError: (err) => toast.error('Erro ao calcular férias.', apiErrorMessage(err)),
})

function isValid() {
  const { monthlySalary, days } = form.value
  return monthlySalary !== null && monthlySalary > 0 && days !== null && days >= 5 && days <= 30 && !abonoError.value
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Férias</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Férias + 1/3 constitucional, abono pecuniário (venda de até 1/3) e descontos de INSS e IRRF
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <form class="space-y-4" @submit.prevent="isValid() && mutate()">
          <AppInput v-model="form.monthlySalary" label="Salário mensal (R$)" type="number" :min="0" :step="0.01" placeholder="3000" required>
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.averageVariablePay"
            label="Média de variáveis (R$) — opcional"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="0"
            hint="Média de horas extras, comissões e adicionais dos últimos 12 meses"
          >
            <template #prefix>R$</template>
          </AppInput>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.days" label="Dias de férias" type="number" :min="5" :max="30" placeholder="30" hint="Entre 5 e 30" />
            <AppInput
              v-model="form.soldDays"
              label="Dias vendidos (abono)"
              type="number"
              :min="0"
              :max="10"
              placeholder="0"
              :error="abonoError"
              hint="Até 1/3 dos dias de direito"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.dependents" label="Dependentes (IR)" type="number" :min="0" :max="30" placeholder="0" />
            <AppSelect v-model="form.year" label="Tabela" :options="TABLE_YEAR_OPTIONS" />
          </div>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isValid()" class="mt-2">
            Calcular férias
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Líquido a receber</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCurrency(result.netTotal) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Bruto</p>
            <p class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ formatCurrency(result.grossTotal) }}</p>
          </AppCard>
          <AppCard v-if="result.soldDays > 0">
            <p class="text-xs text-[var(--text-muted)]">Abono + 1/3 (isento)</p>
            <p class="text-lg font-bold text-indigo-400 mt-1">
              {{ formatCurrency(result.allowance + result.allowanceBonus) }}
            </p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">INSS + IRRF</p>
            <p class="text-lg font-bold text-rose-400 mt-1">{{ formatCurrency(result.totalDeductions) }}</p>
          </AppCard>
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Recibo de férias</h2>
          </template>
          <PayslipTable :lines="result.lines" show-taxable />
        </AppCard>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Informe o salário e os dias de férias para ver o recibo estimado"
      />
    </div>

    <AppCard v-if="result">
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">
          Impostos sobre férias + 1/3 ({{ formatCurrency(result.taxableTotal) }})
        </h2>
      </template>
      <TaxBreakdown :inss="result.inss" :irrf="result.irrf" :year="result.year" />
    </AppCard>

    <LaborDisclaimer>
      Férias + 1/3 são tributadas separadamente do salário do mês; o INSS considera as férias como toda a
      remuneração da competência.
    </LaborDisclaimer>
  </div>
</template>
