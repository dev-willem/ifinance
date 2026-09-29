<script setup lang="ts">
import { computed } from 'vue'
import { useVirtualList } from '@vueuse/core'
import { useFormatBR } from '@/composables/useFormatBR'
import type { Installment } from '@/types'

interface Props {
  installments: Installment[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const { formatCurrency } = useFormatBR()

const { list, containerProps, wrapperProps } = useVirtualList(
  computed(() => props.installments),
  {
    itemHeight: 44,
    overscan: 10,
  },
)

const columns = [
  { key: 'periodNumber', label: 'Per.', width: '8%', align: 'center' },
  { key: 'principalBalanceBefore', label: 'Saldo Anterior', width: '16%', align: 'right' },
  { key: 'amortization', label: 'Amortização', width: '15%', align: 'right' },
  { key: 'interest', label: 'Juros', width: '15%', align: 'right' },
  { key: 'additionalCharges', label: 'Encargos', width: '14%', align: 'right' },
  { key: 'total', label: 'Parcela Total', width: '16%', align: 'right' },
  { key: 'principalBalanceAfter', label: 'Saldo Final', width: '16%', align: 'right' },
] as const
</script>

<template>
  <div class="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
    <!-- Header -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm" style="table-layout: fixed">
        <colgroup>
          <col v-for="col in columns" :key="col.key" :style="{ width: col.width }" />
        </colgroup>
        <thead>
          <tr class="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-4 py-3 font-medium text-[var(--text-muted)] whitespace-nowrap',
                col.align === 'right' ? 'text-right' : 'text-center',
              ]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- Virtual scrolling body (containerProps já carrega o ref usado pelo useVirtualList) -->
    <div
      v-if="!loading && installments.length > 0"
      v-bind="containerProps"
      class="overflow-auto"
      style="height: 440px"
    >
      <div v-bind="wrapperProps">
        <table class="w-full text-sm" style="table-layout: fixed">
          <colgroup>
            <col v-for="col in columns" :key="col.key" :style="{ width: col.width }" />
          </colgroup>
          <tbody>
            <tr
              v-for="{ data: row, index } in list"
              :key="row.periodNumber"
              :class="[
                'border-b border-[var(--border-subtle)] transition-colors duration-75',
                index % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-base)]',
                'hover:bg-[var(--bg-card-hover)]',
              ]"
            >
              <td class="px-4 py-2.5 text-center text-[var(--text-muted)] font-mono text-xs">
                {{ row.periodNumber }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-[var(--text-secondary)]">
                {{ formatCurrency(row.principalBalanceBefore) }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-indigo-400">
                {{ formatCurrency(row.amortization) }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-rose-400">
                {{ formatCurrency(row.interest) }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-amber-400">
                {{ formatCurrency(row.additionalCharges) }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono text-xs font-semibold text-[var(--text-primary)]">
                {{ formatCurrency(row.total) }}
              </td>
              <td class="px-4 py-2.5 text-right font-mono text-xs text-emerald-400">
                {{ formatCurrency(row.principalBalanceAfter) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3 text-[var(--text-muted)]">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Carregando tabela...
      </div>
    </div>

    <!-- Footer summary -->
    <div v-if="installments.length > 0" class="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 flex items-center gap-4 text-xs text-[var(--text-muted)]">
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-500/50 inline-block" />
        Amortização
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-500/50 inline-block" />
        Juros
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500/50 inline-block" />
        Encargos
      </span>
      <span class="ml-auto text-[var(--text-muted)]">
        {{ installments.length }} parcelas
      </span>
    </div>
  </div>
</template>
