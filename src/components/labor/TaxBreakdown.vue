<script setup lang="ts">
import { useFormatBR } from '@/composables/useFormatBR'
import type { InssResult, IrrfResult } from '@/types/labor'

defineProps<{
  inss: InssResult
  irrf: IrrfResult
  year: number
}>()

const { formatCurrency, formatPercent } = useFormatBR()
</script>

<template>
  <div class="space-y-5 text-sm">
    <section>
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        INSS progressivo ({{ year }})
      </h3>
      <div class="overflow-x-auto -mx-5 px-5">
        <table class="w-full min-w-[420px]">
          <thead>
            <tr class="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <th scope="col" class="py-1.5 pr-3 text-left font-medium">Faixa</th>
              <th scope="col" class="py-1.5 px-3 text-right font-medium">Alíquota</th>
              <th scope="col" class="py-1.5 px-3 text-right font-medium">Valor na faixa</th>
              <th scope="col" class="py-1.5 pl-3 text-right font-medium">Contribuição</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in inss.brackets" :key="b.upTo" class="border-b border-[var(--border-subtle)]/60">
              <td class="py-1.5 pr-3 text-[var(--text-secondary)] whitespace-nowrap">
                {{ b.from === 0 ? 'Até' : `${formatCurrency(b.from)} a` }} {{ formatCurrency(b.upTo) }}
              </td>
              <td class="py-1.5 px-3 text-right tabular-nums">{{ formatPercent(b.rate, true) }}</td>
              <td class="py-1.5 px-3 text-right tabular-nums">{{ formatCurrency(b.taxedAmount) }}</td>
              <td class="py-1.5 pl-3 text-right tabular-nums">{{ formatCurrency(b.contribution) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-medium text-[var(--text-primary)]">
              <th scope="row" colspan="3" class="pt-2 pr-3 text-left">
                Total (alíquota efetiva {{ formatPercent(inss.effectiveRate, true) }})
              </th>
              <td class="pt-2 pl-3 text-right tabular-nums">{{ formatCurrency(inss.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <section>
      <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">IRRF</h3>
      <dl class="space-y-1.5">
        <div class="flex justify-between gap-4">
          <dt class="text-[var(--text-secondary)]">Rendimento tributável</dt>
          <dd class="tabular-nums">{{ formatCurrency(irrf.taxableIncome) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-[var(--text-secondary)]">
            Deduções legais
            <span class="text-xs text-[var(--text-muted)]">
              (INSS {{ formatCurrency(irrf.inssDeduction) }}
              + dependentes {{ formatCurrency(irrf.dependentsDeduction) }}<template v-if="irrf.alimonyDeduction > 0">
                + pensão {{ formatCurrency(irrf.alimonyDeduction) }}</template>)
            </span>
          </dt>
          <dd :class="['tabular-nums', irrf.deductionMethod === 'LEGAL' ? 'text-indigo-400 font-medium' : 'text-[var(--text-muted)]']">
            {{ formatCurrency(irrf.legalDeductions) }}
          </dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-[var(--text-secondary)]">Desconto simplificado</dt>
          <dd :class="['tabular-nums', irrf.deductionMethod === 'SIMPLIFIED' ? 'text-indigo-400 font-medium' : 'text-[var(--text-muted)]']">
            {{ formatCurrency(irrf.simplifiedDiscount) }}
          </dd>
        </div>
        <p class="text-xs text-[var(--text-muted)]">
          Aplicado: {{ irrf.deductionMethod === 'LEGAL' ? 'deduções legais' : 'desconto simplificado' }} (o mais vantajoso).
        </p>
        <div class="flex justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5">
          <dt class="text-[var(--text-secondary)]">Base de cálculo</dt>
          <dd class="tabular-nums">{{ formatCurrency(irrf.base) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-[var(--text-secondary)]">Alíquota / parcela a deduzir</dt>
          <dd class="tabular-nums">{{ formatPercent(irrf.rate, true) }} / {{ formatCurrency(irrf.bracketDeduction) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-[var(--text-secondary)]">IR pela tabela</dt>
          <dd class="tabular-nums">{{ formatCurrency(irrf.taxBeforeReduction) }}</dd>
        </div>
        <div v-if="year >= 2026" class="flex justify-between gap-4">
          <dt class="text-[var(--text-secondary)]">Redução Lei 15.270/2025</dt>
          <dd class="tabular-nums text-emerald-400">− {{ formatCurrency(irrf.reduction) }}</dd>
        </div>
        <div class="flex justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 font-medium text-[var(--text-primary)]">
          <dt>IRRF devido</dt>
          <dd class="tabular-nums">{{ formatCurrency(irrf.tax) }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
