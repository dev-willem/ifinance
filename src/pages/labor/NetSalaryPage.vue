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
import type { NetSalaryResponse } from '@/types/labor'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref({
  grossSalary: null as number | null,
  dependents: 0 as number | null,
  alimony: null as number | null,
  otherDiscounts: null as number | null,
  employerInssRate: 20 as number | null,
  year: TABLE_YEAR_OPTIONS[0].value as string | number | null,
})

const result = ref<NetSalaryResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    laborApi.netSalary({
      grossSalary: form.value.grossSalary!,
      dependents: form.value.dependents ?? 0,
      alimony: optional(form.value.alimony),
      otherDiscounts: optional(form.value.otherDiscounts),
      employerInssRate: optional(form.value.employerInssRate, 100),
      year: Number(form.value.year),
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('Salário líquido calculado!')
  },
  onError: (err) => toast.error('Erro ao calcular salário líquido.', apiErrorMessage(err)),
})

function isValid() {
  return form.value.grossSalary !== null && form.value.grossSalary > 0
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Salário Líquido CLT</h1>
      <p class="text-sm text-[var(--text-muted)]">
        INSS progressivo, IRRF com a redução da Lei 15.270/2025, FGTS e custo total para o empregador
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <form class="space-y-4" @submit.prevent="isValid() && mutate()">
          <AppInput v-model="form.grossSalary" label="Salário bruto mensal (R$)" type="number" :min="0" :step="0.01" placeholder="5000" required>
            <template #prefix>R$</template>
          </AppInput>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.dependents" label="Dependentes (IR)" type="number" :min="0" :max="30" placeholder="0" />
            <AppSelect v-model="form.year" label="Tabela" :options="TABLE_YEAR_OPTIONS" />
          </div>

          <AppInput
            v-model="form.alimony"
            label="Pensão alimentícia judicial (R$) — opcional"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="0"
            hint="Descontada do salário e dedutível da base do IRRF"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.otherDiscounts"
            label="Outros descontos (R$) — opcional"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="0"
            hint="Vale-transporte, plano de saúde etc. Não reduzem o IRRF"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.employerInssRate"
            label="Encargo patronal (%)"
            type="number"
            :min="0"
            :max="50"
            :step="0.1"
            placeholder="20"
            hint="INSS patronal 20% (use 0 para Simples Nacional); some RAT e terceiros se quiser"
          >
            <template #suffix>%</template>
          </AppInput>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isValid()" class="mt-2">
            Calcular salário líquido
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Salário líquido</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCurrency(result.netSalary) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">INSS + IRRF (efetivo)</p>
            <p class="text-xl font-bold text-rose-400 mt-1">{{ formatPercent(result.totalTaxEffectiveRate, true) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">FGTS depositado (8%)</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">{{ formatCurrency(result.fgts) }}</p>
            <p class="text-xs text-[var(--text-muted)]">Pago pelo empregador, não descontado</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Custo para o empregador</p>
            <p class="text-lg font-bold text-amber-400 mt-1">{{ formatCurrency(result.employerCost.total) }}</p>
            <p class="text-xs text-[var(--text-muted)]">
              {{ formatPercent(result.employerCost.costToSalaryRatio, true) }} do salário
            </p>
          </AppCard>
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Holerite</h2>
          </template>
          <PayslipTable :lines="result.lines" />
        </AppCard>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Informe o salário bruto para ver o holerite estimado"
      />
    </div>

    <div v-if="result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Como os impostos foram calculados</h2>
        </template>
        <TaxBreakdown :inss="result.inss" :irrf="result.irrf" :year="result.year" />
      </AppCard>

      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Custo mensal do empregador</h2>
        </template>
        <dl class="space-y-1.5 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">Salário</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.employerCost.salary) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">FGTS (8%)</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.employerCost.fgts) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">
              Encargo patronal ({{ formatPercent(result.employerCost.employerInssRate, true) }})
            </dt>
            <dd class="tabular-nums">{{ formatCurrency(result.employerCost.employerInss) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">Provisão de 13º (1/12)</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.employerCost.thirteenthProvision) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">Provisão de férias + 1/3 (1/9)</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.employerCost.vacationProvision) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">FGTS e encargo sobre provisões</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.employerCost.provisionCharges) }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 font-semibold text-[var(--text-primary)]">
            <dt>Custo total mensal</dt>
            <dd class="tabular-nums text-amber-400">{{ formatCurrency(result.employerCost.total) }}</dd>
          </div>
        </dl>
      </AppCard>
    </div>

    <LaborDisclaimer />
  </div>
</template>
