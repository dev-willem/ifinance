<script setup lang="ts">
import { ref } from 'vue'
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
import type { ThirteenthResponse } from '@/types/labor'

const { formatCurrency } = useFormatBR()
const toast = useToast()

const form = ref({
  monthlySalary: null as number | null,
  averageVariablePay: null as number | null,
  monthsWorked: 12 as number | null,
  dependents: 0 as number | null,
  year: TABLE_YEAR_OPTIONS[0].value as string | number | null,
})

const result = ref<ThirteenthResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    laborApi.thirteenth({
      monthlySalary: form.value.monthlySalary!,
      averageVariablePay: optional(form.value.averageVariablePay),
      monthsWorked: form.value.monthsWorked!,
      dependents: form.value.dependents ?? 0,
      year: Number(form.value.year),
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('13º salário calculado!')
  },
  onError: (err) => toast.error('Erro ao calcular 13º salário.', apiErrorMessage(err)),
})

function isValid() {
  const { monthlySalary, monthsWorked } = form.value
  return monthlySalary !== null && monthlySalary > 0 && monthsWorked !== null && monthsWorked >= 1 && monthsWorked <= 12
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">13º Salário</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Primeira parcela sem descontos e segunda parcela com INSS e IRRF sobre o 13º integral
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
            hint="Média de horas extras, comissões e adicionais do ano"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.monthsWorked"
            label="Meses trabalhados no ano"
            type="number"
            :min="1"
            :max="12"
            placeholder="12"
            hint="Conta o mês com 15 dias ou mais de trabalho"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.dependents" label="Dependentes (IR)" type="number" :min="0" :max="30" placeholder="0" />
            <AppSelect v-model="form.year" label="Tabela" :options="TABLE_YEAR_OPTIONS" />
          </div>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isValid()" class="mt-2">
            Calcular 13º
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">1ª parcela (até 30/11)</p>
            <p class="text-xl font-bold text-indigo-400 mt-1">{{ formatCurrency(result.firstInstallment) }}</p>
            <p class="text-xs text-[var(--text-muted)]">Sem descontos</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">2ª parcela (até 20/12)</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCurrency(result.secondInstallment) }}</p>
            <p class="text-xs text-[var(--text-muted)]">Com INSS e IRRF</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">13º bruto</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">{{ formatCurrency(result.grossTotal) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Líquido total</p>
            <p class="text-lg font-bold text-emerald-400 mt-1">{{ formatCurrency(result.netTotal) }}</p>
          </AppCard>
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Holerite da 2ª parcela</h2>
          </template>
          <PayslipTable :lines="result.lines" net-label="Líquido da 2ª parcela" />
        </AppCard>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Informe o salário e os meses trabalhados para ver as parcelas"
      />
    </div>

    <AppCard v-if="result">
      <template #header>
        <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Impostos sobre o 13º (tributação exclusiva)</h2>
      </template>
      <TaxBreakdown :inss="result.inss" :irrf="result.irrf" :year="result.year" />
    </AppCard>

    <LaborDisclaimer />
  </div>
</template>
