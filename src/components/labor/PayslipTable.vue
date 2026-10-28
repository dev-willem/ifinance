<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { useFormatBR } from '@/composables/useFormatBR'
import { payslipTotals } from './labor'
import type { PayslipLine } from '@/types/labor'

const props = withDefaults(
  defineProps<{
    lines: PayslipLine[]
    netLabel?: string
    /** Show the "isento" badge on exempt earnings. */
    showTaxable?: boolean
  }>(),
  { netLabel: 'Líquido a receber', showTaxable: false },
)

const { formatCurrency } = useFormatBR()
const totals = computed(() => payslipTotals(props.lines))
</script>

<template>
  <div class="overflow-x-auto -mx-5 px-5">
    <table class="w-full min-w-[460px] text-sm">
      <thead>
        <tr class="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
          <th scope="col" class="py-2 pr-3 text-left font-medium">Descrição</th>
          <th scope="col" class="py-2 px-3 text-left font-medium">Ref.</th>
          <th scope="col" class="py-2 px-3 text-right font-medium">Proventos</th>
          <th scope="col" class="py-2 pl-3 text-right font-medium">Descontos</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(line, i) in lines"
          :key="i"
          class="border-b border-[var(--border-subtle)]/60"
        >
          <td class="py-2 pr-3 text-[var(--text-primary)]">
            {{ line.description }}
            <AppBadge
              v-if="showTaxable && line.type === 'EARNING' && line.taxable === false"
              tone="success"
              class="ml-1.5"
            >
              isento
            </AppBadge>
          </td>
          <td class="py-2 px-3 text-[var(--text-muted)] whitespace-nowrap">{{ line.reference ?? '' }}</td>
          <td class="py-2 px-3 text-right tabular-nums text-emerald-400">
            {{ line.type === 'EARNING' ? formatCurrency(line.amount) : '' }}
          </td>
          <td class="py-2 pl-3 text-right tabular-nums text-rose-400">
            {{ line.type === 'DEDUCTION' ? formatCurrency(line.amount) : '' }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="text-[var(--text-secondary)]">
          <th scope="row" colspan="2" class="pt-3 pr-3 text-left font-medium">Totais</th>
          <td class="pt-3 px-3 text-right tabular-nums font-medium">{{ formatCurrency(totals.earnings) }}</td>
          <td class="pt-3 pl-3 text-right tabular-nums font-medium">{{ formatCurrency(totals.deductions) }}</td>
        </tr>
        <tr>
          <th scope="row" colspan="2" class="pt-2 pr-3 text-left font-semibold text-[var(--text-primary)]">
            {{ netLabel }}
          </th>
          <td colspan="2" class="pt-2 pl-3 text-right tabular-nums text-base font-bold text-indigo-400">
            {{ formatCurrency(totals.net) }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
