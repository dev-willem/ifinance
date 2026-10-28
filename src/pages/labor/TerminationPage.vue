<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { laborApi } from '@/services/api/labor'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import PayslipTable from '@/components/labor/PayslipTable.vue'
import TaxBreakdown from '@/components/labor/TaxBreakdown.vue'
import LaborDisclaimer from '@/components/labor/LaborDisclaimer.vue'
import {
  TABLE_YEAR_OPTIONS,
  TERMINATION_TYPE_OPTIONS,
  apiErrorMessage,
  noticeOptions,
  optional,
  tableYearOf,
} from '@/components/labor/labor'
import type { NoticeType, TerminationResponse, TerminationType } from '@/types/labor'

const { formatCurrency, formatDate, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref({
  monthlySalary: null as number | null,
  admissionDate: '' as string | number | null,
  terminationDate: new Date().toLocaleDateString('sv-SE') as string | number | null, // local YYYY-MM-DD
  terminationType: 'WITHOUT_CAUSE' as string | number | null,
  noticeType: 'INDEMNIFIED' as string | number | null,
  expiredVacationPeriods: 0 as number | null,
  fgtsBalance: null as number | null,
  dependents: 0 as number | null,
  year: TABLE_YEAR_OPTIONS[0].value as string | number | null,
})

// The tax table follows the termination year whenever a table exists for it.
watch(
  () => form.value.terminationDate,
  (date) => {
    const year = tableYearOf(date)
    if (year) form.value.year = year
  },
  { immediate: true },
)

const notices = computed(() => noticeOptions(form.value.terminationType as TerminationType))
watch(notices, (opts) => {
  form.value.noticeType = opts[0]?.value ?? null
})

const result = ref<TerminationResponse | null>(null)
const taxTab = ref('salary')
const taxTabs = computed(() => [
  { key: 'salary', label: 'Saldo de salário' },
  { key: 'thirteenth', label: '13º salário', disabled: !result.value?.thirteenthMonths },
])

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    laborApi.termination({
      monthlySalary: form.value.monthlySalary!,
      admissionDate: String(form.value.admissionDate),
      terminationDate: String(form.value.terminationDate),
      terminationType: form.value.terminationType as TerminationType,
      noticeType: notices.value.length ? (form.value.noticeType as NoticeType) : undefined,
      expiredVacationPeriods: form.value.expiredVacationPeriods ?? 0,
      fgtsBalance: optional(form.value.fgtsBalance),
      dependents: form.value.dependents ?? 0,
      year: Number(form.value.year),
    }),
  onSuccess: (data) => {
    result.value = data
    taxTab.value = 'salary'
    toast.success('Rescisão calculada!')
  },
  onError: (err) => toast.error('Erro ao calcular rescisão.', apiErrorMessage(err)),
})

const dateError = computed(() =>
  form.value.admissionDate && form.value.terminationDate && String(form.value.admissionDate) > String(form.value.terminationDate)
    ? 'A admissão deve ser anterior ao desligamento.'
    : undefined,
)

function isValid() {
  const f = form.value
  return f.monthlySalary !== null && f.monthlySalary > 0 && !!f.admissionDate && !!f.terminationDate && !dateError.value
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Rescisão Trabalhista</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Verbas rescisórias, aviso prévio proporcional, multa e saque do FGTS por tipo de desligamento
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <form class="space-y-4" @submit.prevent="isValid() && mutate()">
          <AppInput v-model="form.monthlySalary" label="Último salário (R$)" type="number" :min="0" :step="0.01" placeholder="3000" required>
            <template #prefix>R$</template>
          </AppInput>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput v-model="form.admissionDate" label="Data de admissão" type="date" required :error="dateError" />
            <AppInput
              v-model="form.terminationDate"
              label="Data de desligamento"
              type="date"
              required
              hint="Último dia trabalhado (com aviso trabalhado, o fim do aviso)"
            />
          </div>

          <AppSelect v-model="form.terminationType" label="Tipo de desligamento" :options="TERMINATION_TYPE_OPTIONS" />

          <AppSelect v-if="notices.length" v-model="form.noticeType" label="Aviso prévio" :options="notices" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="form.expiredVacationPeriods"
              label="Férias vencidas (períodos)"
              type="number"
              :min="0"
              :max="2"
              placeholder="0"
              hint="Períodos completos não gozados; com 2, o mais antigo é pago em dobro"
            />
            <AppInput v-model="form.dependents" label="Dependentes (IR)" type="number" :min="0" :max="30" placeholder="0" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-model="form.fgtsBalance"
              label="Saldo do FGTS (R$) — opcional"
              type="number"
              :min="0"
              :step="0.01"
              placeholder="Estimar"
              hint="Do extrato; vazio = estimativa"
            >
              <template #prefix>R$</template>
            </AppInput>
            <AppSelect v-model="form.year" label="Tabela" :options="TABLE_YEAR_OPTIONS" />
          </div>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isValid()" class="mt-2">
            Calcular rescisão
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Líquido da rescisão</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">{{ formatCurrency(result.netTotal) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">FGTS para saque ({{ formatPercent(result.fgts.withdrawalRate, true) }})</p>
            <p class="text-xl font-bold text-indigo-400 mt-1">{{ formatCurrency(result.fgts.withdrawableAmount) }}</p>
            <p v-if="result.fgts.balanceEstimated" class="text-xs text-[var(--text-muted)]">Saldo estimado</p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Aviso prévio</p>
            <p class="text-lg font-bold text-[var(--text-primary)] mt-1">
              {{ result.noticeDays ? `${result.noticeDays} dias` : 'Não se aplica' }}
            </p>
            <p v-if="result.indemnifiedNoticeDays" class="text-xs text-[var(--text-muted)]">
              Projeção até {{ formatDate(result.projectedEndDate + 'T00:00:00') }}
            </p>
          </AppCard>
          <AppCard>
            <p class="text-xs text-[var(--text-muted)]">Seguro-desemprego</p>
            <AppBadge :tone="result.unemploymentInsuranceEligible ? 'success' : 'neutral'" class="mt-2">
              {{ result.unemploymentInsuranceEligible ? 'Pode ter direito' : 'Sem direito' }}
            </AppBadge>
          </AppCard>
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Termo de rescisão (estimado)</h2>
          </template>
          <PayslipTable :lines="result.lines" show-taxable net-label="Líquido da rescisão" />
        </AppCard>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Informe salário, datas e tipo de desligamento para ver as verbas"
      />
    </div>

    <div v-if="result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Impostos</h2>
        </template>
        <AppTabs v-model="taxTab" :tabs="taxTabs" class="mb-4" />
        <TaxBreakdown
          v-if="taxTab === 'salary'"
          :inss="result.salaryInss"
          :irrf="result.salaryIrrf"
          :year="result.year"
        />
        <TaxBreakdown v-else :inss="result.thirteenthInss" :irrf="result.thirteenthIrrf" :year="result.year" />
      </AppCard>

      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">FGTS e observações</h2>
        </template>
        <dl class="space-y-1.5 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">Saldo {{ result.fgts.balanceEstimated ? '(estimado)' : 'informado' }}</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.fgts.balance) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">Depósito sobre verbas rescisórias</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.fgts.terminationDeposit) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-[var(--text-secondary)]">Multa rescisória ({{ formatPercent(result.fgts.fineRate, true) }}), depositada no FGTS</dt>
            <dd class="tabular-nums">{{ formatCurrency(result.fgts.fine) }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 font-medium text-[var(--text-primary)]">
            <dt>Saque, multa incluída ({{ formatPercent(result.fgts.withdrawalRate, true) }})</dt>
            <dd class="tabular-nums text-indigo-400">{{ formatCurrency(result.fgts.withdrawableAmount) }}</dd>
          </div>
        </dl>
        <ul class="mt-4 space-y-2 text-xs text-[var(--text-secondary)] list-disc pl-4">
          <li v-for="note in result.notes" :key="note">{{ note }}</li>
        </ul>
      </AppCard>
    </div>

    <LaborDisclaimer>
      Não inclui adicionais, horas extras, médias de variáveis nem descontos de adiantamentos.
    </LaborDisclaimer>
  </div>
</template>
