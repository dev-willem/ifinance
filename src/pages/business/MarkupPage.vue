<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { businessApi, apiErrorMessage } from '@/services/api/business'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import StatCard from '@/components/business/StatCard.vue'
import CompositionBar from '@/components/business/CompositionBar.vue'
import { percentToRate as pct } from '@/components/business/helpers'
import type { MarkupResponse } from '@/types/business'

const { formatCurrency, formatPercent, formatNumber } = useFormatBR()
const toast = useToast()

const MAX_EXTRAS = 20

const form = ref({
  unitCost: null as number | null,
  salesTaxRate: null as number | null,
  commissionRate: null as number | null,
  cardFeeRate: null as number | null,
  fixedExpenseRate: null as number | null,
  desiredProfitRate: null as number | null,
  currentPrice: null as number | null,
  extras: [] as { name: string; rate: number | null }[],
})

const rateFields = [
  { key: 'salesTaxRate', label: 'Impostos sobre vendas (%)', placeholder: '6', hint: 'Ex.: alíquota do Simples Nacional, ICMS, PIS/COFINS' },
  { key: 'commissionRate', label: 'Comissão (%)', placeholder: '5' },
  { key: 'cardFeeRate', label: 'Taxa de cartão / gateway (%)', placeholder: '3' },
  { key: 'fixedExpenseRate', label: 'Despesas fixas (%)', placeholder: '15', hint: 'Despesas fixas mensais ÷ faturamento mensal' },
  { key: 'desiredProfitRate', label: 'Lucro desejado (%)', placeholder: '10', hint: 'Margem líquida sobre o preço de venda' },
] as const

const result = ref<MarkupResponse | null>(null)

// A rate without a name would be dropped from the request, so it must block submission instead.
const extraNameError = (e: { name: string; rate: number | null }) =>
  e.rate != null && !e.name.trim() ? 'Informe o nome deste percentual' : undefined

const totalPercent = computed(() => {
  const f = form.value
  return rateFields.reduce((sum, r) => sum + (f[r.key] ?? 0), 0) + f.extras.reduce((sum, e) => sum + (e.rate ?? 0), 0)
})

const { mutate, isPending } = useMutation({
  mutationFn: () => {
    const f = form.value
    return businessApi.markup({
      unitCost: f.unitCost!,
      salesTaxRate: pct(f.salesTaxRate),
      commissionRate: pct(f.commissionRate),
      cardFeeRate: pct(f.cardFeeRate),
      fixedExpenseRate: pct(f.fixedExpenseRate),
      desiredProfitRate: pct(f.desiredProfitRate),
      extraRates: f.extras
        .filter((e) => e.name.trim() && e.rate != null)
        .map((e) => ({ name: e.name.trim(), rate: pct(e.rate)! })),
      currentPrice: f.currentPrice ? f.currentPrice : undefined,
    })
  },
  onSuccess: (data) => {
    result.value = data
    toast.success('Preço calculado!')
  },
  onError: (err) => toast.error(apiErrorMessage(err, 'Erro ao calcular o markup.')),
})

function isValid() {
  const f = form.value
  return f.unitCost !== null && f.unitCost >= 0.01 && totalPercent.value < 100 && f.extras.every((e) => !extraNameError(e))
}

function addExtra() {
  if (form.value.extras.length < MAX_EXTRAS) form.value.extras.push({ name: '', rate: null })
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-primary)]">Markup e Preço de Venda</h1>
      <p class="text-sm text-[var(--text-muted)]">
        Calcule o preço pelo markup divisor: todos os percentuais incidem sobre o preço de venda
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard>
        <template #header>
          <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Custos e percentuais</h2>
        </template>

        <div class="space-y-4">
          <AppInput
            v-model="form.unitCost"
            label="Custo unitário (R$)"
            variant="currency"
            :min="0.01"
            placeholder="60"
            hint="Custo de aquisição ou produção de uma unidade"
            required
          >
            <template #prefix>R$</template>
          </AppInput>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppInput
              v-for="field in rateFields"
              :key="field.key"
              v-model="form[field.key]"
              :label="field.label"
              variant="percent"
              :min="0"
              :max="100"
              :placeholder="field.placeholder"
              :hint="'hint' in field ? field.hint : undefined"
            >
              <template #suffix>%</template>
            </AppInput>
          </div>

          <fieldset class="space-y-3">
            <legend class="text-sm font-medium text-[var(--text-secondary)]">Outros percentuais sobre o preço</legend>
            <div v-for="(extra, i) in form.extras" :key="i" class="flex items-end gap-2">
              <div class="flex-1">
                <AppInput v-model="extra.name" :label="`Nome ${i + 1}`" placeholder="Frete" :error="extraNameError(extra)" />
              </div>
              <div class="w-28">
                <AppInput v-model="extra.rate" :label="`% ${i + 1}`" variant="percent" :min="0" :max="100" placeholder="2">
                  <template #suffix>%</template>
                </AppInput>
              </div>
              <AppButton variant="ghost" size="icon" :aria-label="`Remover percentual ${i + 1}`" @click="form.extras.splice(i, 1)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </AppButton>
            </div>
            <AppButton variant="secondary" size="sm" :disabled="form.extras.length >= MAX_EXTRAS" @click="addExtra">
              + Adicionar percentual
            </AppButton>
          </fieldset>

          <div
            :class="[
              'flex items-center justify-between rounded-lg border px-4 py-2 text-sm',
              totalPercent >= 100 ? 'border-rose-500/40 bg-rose-500/10 text-rose-400' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]',
            ]"
            role="status"
          >
            <span>Soma dos percentuais</span>
            <span class="font-semibold tabular-nums">{{ formatNumber(totalPercent, 2) }}%</span>
          </div>
          <p v-if="totalPercent >= 100" class="text-xs text-rose-400">
            A soma precisa ficar abaixo de 100% — caso contrário nenhum preço cobre os percentuais.
          </p>

          <AppInput
            v-model="form.currentPrice"
            label="Preço praticado hoje (R$) — opcional"
            variant="currency"
            :min="0"
            placeholder="90"
            hint="Para ver a margem real que esse preço entrega"
          >
            <template #prefix>R$</template>
          </AppInput>

          <AppButton full-width :loading="isPending" :disabled="!isValid()" @click="() => mutate()">
            Calcular preço
          </AppButton>
        </div>
      </AppCard>

      <div v-if="result" class="space-y-4 animate-slide-in-right">
        <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p class="text-sm text-[var(--text-secondary)]">Preço de venda sugerido</p>
          <p class="text-3xl font-bold text-emerald-400 tabular-nums">{{ formatCurrency(result.suggestedPrice) }}</p>
        </div>

        <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
          <StatCard
            label="Markup multiplicador"
            :value="`${formatNumber(result.markupMultiplier, 4)}x`"
            :detail="`Custo × ${formatNumber(result.markupMultiplier, 4)} = preço`"
            tone="primary"
          />
          <StatCard
            label="Markup divisor"
            :value="formatNumber(result.markupDivisor, 4)"
            :detail="`1 − ${formatPercent(result.totalRate, true)} de percentuais`"
          />
          <template v-if="result.actualProfitMargin != null && result.currentPrice != null">
            <StatCard
              :label="`Margem real a ${formatCurrency(result.currentPrice)}`"
              :value="formatPercent(result.actualProfitMargin, true)"
              :tone="result.actualProfitMargin < 0 ? 'danger' : 'success'"
            />
            <StatCard
              label="Lucro por unidade nesse preço"
              :value="formatCurrency(result.actualProfitAmount)"
              :tone="(result.actualProfitAmount ?? 0) < 0 ? 'danger' : 'success'"
            />
          </template>
        </div>

        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Composição do preço</h2>
          </template>
          <CompositionBar :composition="result.composition" :price="result.suggestedPrice" />
        </AppCard>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <p class="font-medium text-[var(--text-secondary)]">Resultados aparecerão aqui</p>
        <p class="text-sm text-[var(--text-muted)] mt-1">Informe o custo unitário e os percentuais sobre o preço</p>
      </div>
    </div>
  </div>
</template>
