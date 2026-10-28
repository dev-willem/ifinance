<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { creditApi } from '@/services/api/credit'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { DISCOUNT_INFO, apiErrorMessage, isDiscountFormValid, toDiscountRequest, type DiscountForm } from '@/components/credit/credit'
import type { DiscountResponse } from '@/types/credit'

const { formatCurrency, formatPercent } = useFormatBR()
const toast = useToast()

const form = ref<DiscountForm>({ faceValue: null, ratePercent: null, periods: null })
const result = ref<DiscountResponse | null>(null)

const { mutate, isPending } = useMutation({
  mutationFn: () => creditApi.discount(toDiscountRequest(form.value)),
  onSuccess: (data) => {
    result.value = data
    toast.success('Descontos calculados!')
  },
  onError: (e) => toast.error(apiErrorMessage(e, 'Erro ao calcular descontos.')),
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Desconto de Títulos</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Compare desconto racional e comercial, simples e composto, de um mesmo título
      </p>
    </div>

    <AppCard>
      <form class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start" @submit.prevent="isDiscountFormValid(form) && mutate()">
        <AppInput v-model="form.faceValue" label="Valor nominal (R$)" type="number" :min="0" placeholder="10000" hint="Valor de face no vencimento">
          <template #prefix>R$</template>
        </AppInput>
        <AppInput v-model="form.ratePercent" label="Taxa de desconto por período (%)" type="number" :min="0" :step="0.01" placeholder="2">
          <template #suffix>%</template>
        </AppInput>
        <AppInput
          v-model="form.periods"
          label="Períodos até o vencimento"
          type="number"
          :min="0"
          :step="0.01"
          placeholder="3"
          hint="Aceita frações (ex.: 1,5)"
        />
        <AppButton type="submit" :loading="isPending" :disabled="!isDiscountFormValid(form)" class="sm:col-span-3">
          Calcular descontos
        </AppButton>
      </form>
    </AppCard>

    <div v-if="result" class="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-live="polite">
      <AppCard v-for="m in result.modalities" :key="m.modality">
        <div class="flex items-start justify-between gap-3 mb-1">
          <h2 class="font-semibold text-[var(--text-primary)]">{{ DISCOUNT_INFO[m.modality].title }}</h2>
          <AppBadge v-if="!m.valid" tone="danger" variant="subtle">Inválido</AppBadge>
        </div>
        <p class="font-mono text-xs text-indigo-400 mb-2">{{ DISCOUNT_INFO[m.modality].formula }}</p>
        <p class="text-xs text-[var(--text-muted)] mb-4">{{ DISCOUNT_INFO[m.modality].description }}</p>

        <p v-if="!m.valid" class="text-sm text-rose-400">{{ m.message }}</p>
        <dl v-else class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Valor presente (líquido)</dt>
            <dd class="text-lg font-bold text-emerald-400">{{ formatCurrency(m.presentValue) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Desconto</dt>
            <dd class="text-lg font-bold text-rose-400">{{ formatCurrency(m.discountAmount) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Taxa efetiva no prazo</dt>
            <dd class="font-semibold text-[var(--text-primary)]">{{ formatPercent(m.effectiveRateTotal, true) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-[var(--text-muted)]">Efetiva por período (simples / composta)</dt>
            <dd class="font-semibold text-[var(--text-primary)]">
              {{ formatPercent(m.effectiveSimpleRatePerPeriod, true) }} / {{ formatPercent(m.effectiveCompoundRatePerPeriod, true) }}
            </dd>
          </div>
        </dl>
      </AppCard>
      <p class="lg:col-span-2 text-xs text-[var(--text-muted)]">
        Taxa efetiva: o que o tomador realmente paga ao receber o valor presente hoje e pagar o valor nominal no vencimento.
        No prazo = N/A − 1; por período simples = (N/A − 1)/n; por período composta = (N/A)^(1/n) − 1.
      </p>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
      <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
      <p class="text-sm text-[var(--text-muted)] mt-1">Informe o valor nominal, a taxa e o prazo do título</p>
    </div>
  </div>
</template>
