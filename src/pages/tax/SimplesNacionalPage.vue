<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { taxApi } from '@/services/api/tax'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import TaxBars from '@/components/tax/TaxBars.vue'
import { ANNEX_OPTIONS, DEFAULT_DISCLAIMER, TAX_LABELS } from '@/components/tax/taxHelpers'
import type { SimplesAnnex, SimplesResponse } from '@/types/tax'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref({
  rbt12: null as number | null,
  monthlyRevenue: null as number | null,
  annex: 'III' as SimplesAnnex,
  payroll12: null as number | null,
})

const result = ref<SimplesResponse | null>(null)

const usesFatorR = computed(() => form.value.annex === 'III' || form.value.annex === 'V')

const isValid = computed(
  () =>
    form.value.rbt12 !== null &&
    form.value.rbt12 > 0 &&
    form.value.monthlyRevenue !== null &&
    form.value.monthlyRevenue >= 0,
)

const { mutate, isPending } = useMutation({
  mutationFn: () =>
    taxApi.simples({
      rbt12: form.value.rbt12!,
      monthlyRevenue: form.value.monthlyRevenue!,
      annex: form.value.annex,
      payroll12: usesFatorR.value ? form.value.payroll12 : null,
    }),
  onSuccess: (data) => {
    result.value = data
    toast.success('DAS calculado!')
  },
  onError: () => toast.error('Erro ao calcular o DAS.'),
})

const bars = computed(() =>
  (result.value?.shares ?? []).map((s) => ({ key: s.tax, label: TAX_LABELS[s.tax], value: s.amount })),
)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Simples Nacional</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Calcule a alíquota efetiva, o valor do DAS e a repartição dos tributos do mês
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
        </template>

        <form class="space-y-4" @submit.prevent="isValid && mutate()">
          <AppInput
            v-model="form.rbt12"
            label="Receita bruta dos últimos 12 meses — RBT12 (R$)"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="300000"
            hint="Soma do faturamento dos 12 meses anteriores ao mês de apuração"
            required
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppInput
            v-model="form.monthlyRevenue"
            label="Receita do mês (R$)"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="25000"
            required
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppSelect v-model="form.annex" label="Anexo" :options="ANNEX_OPTIONS" required />

          <AppInput
            v-if="usesFatorR"
            v-model="form.payroll12"
            label="Folha de salários dos últimos 12 meses (R$) — opcional"
            type="number"
            :min="0"
            :step="0.01"
            placeholder="90000"
            hint="Salários, pró-labore, CPP e FGTS. Informe para aplicar o Fator R (≥ 28% → Anexo III; abaixo → Anexo V)"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppButton type="submit" full-width :loading="isPending" :disabled="!isValid" class="mt-2">
            Calcular DAS
          </AppButton>
        </form>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div
          v-if="!result.eligible"
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5"
          role="alert"
        >
          <p class="font-bold text-lg text-rose-400">Fora do Simples Nacional</p>
          <ul class="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            <li v-for="note in result.notes" :key="note">{{ note }}</li>
          </ul>
        </div>

        <template v-else>
          <div class="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5">
            <div class="flex flex-wrap items-center gap-2">
              <AppBadge tone="primary">Anexo {{ result.appliedAnnex }}</AppBadge>
              <AppBadge tone="neutral">{{ result.bracket }}ª faixa</AppBadge>
              <AppBadge v-if="result.fatorR != null" tone="info">
                Fator R {{ formatPercent(result.fatorR, true) }}
              </AppBadge>
              <AppBadge v-if="result.aboveSublimit" tone="warning">Acima do sublimite</AppBadge>
            </div>
            <p class="mt-3 text-xs text-[var(--text-muted)]">DAS do mês</p>
            <p class="text-3xl font-bold text-indigo-400 tabular-nums">{{ formatCurrency(result.dasAmount) }}</p>
          </div>

          <div class="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
            <AppCard>
              <p class="text-xs text-[var(--text-muted)]">Alíquota nominal</p>
              <p class="text-lg font-bold text-[var(--text-primary)] mt-1 tabular-nums">
                {{ formatPercent(result.nominalRate, true) }}
              </p>
            </AppCard>
            <AppCard>
              <p class="text-xs text-[var(--text-muted)]">Parcela a deduzir</p>
              <p class="text-lg font-bold text-[var(--text-primary)] mt-1 tabular-nums">
                {{ formatCurrency(result.deduction) }}
              </p>
            </AppCard>
            <AppCard>
              <p class="text-xs text-[var(--text-muted)]">Alíquota efetiva</p>
              <p class="text-lg font-bold text-emerald-400 mt-1 tabular-nums">
                {{ formatPercent(result.effectiveRate, true) }}
              </p>
            </AppCard>
          </div>

          <AppCard>
            <template #header>
              <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Repartição dos tributos</h2>
            </template>
            <TaxBars :items="bars" aria-label="Valor de cada tributo dentro do DAS" />
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                    <th scope="col" class="py-2 font-medium">Tributo</th>
                    <th scope="col" class="py-2 font-medium text-right">% do DAS</th>
                    <th scope="col" class="py-2 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in result.shares" :key="s.tax" class="border-b border-[var(--border-subtle)] last:border-0">
                    <td class="py-2 text-[var(--text-secondary)]">{{ TAX_LABELS[s.tax] }}</td>
                    <td class="py-2 text-right tabular-nums text-[var(--text-secondary)]">{{ formatPercent(s.share, true) }}</td>
                    <td class="py-2 text-right tabular-nums text-[var(--text-primary)]">{{ formatCurrency(s.amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AppCard>

          <ul v-if="result.notes.length" class="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <li v-for="note in result.notes" :key="note">{{ note }}</li>
          </ul>
        </template>
      </div>

      <EmptyState
        v-else
        title="Resultados aparecerão aqui"
        description="Informe a RBT12, a receita do mês e o anexo para calcular o DAS"
      />
    </div>

    <p class="text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-4" role="note">
      {{ result?.disclaimer ?? DEFAULT_DISCLAIMER }}
    </p>
  </div>
</template>
