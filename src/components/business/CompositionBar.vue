<script setup lang="ts">
import { computed } from 'vue'
import { useFormatBR } from '@/composables/useFormatBR'
import type { PriceComponent, PriceComponentKey } from '@/types/business'
import { compositionSegments } from './helpers'

const props = defineProps<{ composition: PriceComponent[]; price: number }>()

const { formatCurrency, formatPercent } = useFormatBR()

const COLORS: Record<PriceComponentKey, string> = {
  COST: 'bg-slate-500',
  SALES_TAX: 'bg-rose-500',
  COMMISSION: 'bg-amber-500',
  CARD_FEE: 'bg-orange-400',
  FIXED_EXPENSE: 'bg-sky-500',
  EXTRA: 'bg-violet-500',
  PROFIT: 'bg-emerald-500',
}

const segments = computed(() => compositionSegments(props.composition))
</script>

<template>
  <div>
    <div
      class="flex h-9 w-full overflow-hidden rounded-lg"
      role="img"
      :aria-label="`Composição do preço de ${formatCurrency(price)}: ${segments.map((s) => `${s.label} ${formatCurrency(s.amount)}`).join(', ')}`"
    >
      <div
        v-for="(s, i) in segments"
        v-show="s.width > 0"
        :key="`${s.key}-${i}`"
        :class="['h-full transition-all duration-500', COLORS[s.key]]"
        :style="{ width: `${s.width * 100}%` }"
        :title="`${s.label}: ${formatCurrency(s.amount)}`"
      />
    </div>

    <ul class="mt-4 divide-y divide-[var(--border-subtle)]">
      <li v-for="(s, i) in segments" :key="`${s.key}-${i}`" class="flex items-center justify-between gap-3 py-2 text-sm">
        <span class="flex items-center gap-2 min-w-0">
          <span :class="['h-3 w-3 flex-shrink-0 rounded-sm', COLORS[s.key]]" aria-hidden="true" />
          <span class="truncate text-[var(--text-secondary)]">{{ s.label }}</span>
        </span>
        <span class="flex items-baseline gap-3 tabular-nums">
          <span class="text-xs text-[var(--text-muted)]">{{ formatPercent(s.amount / price, true) }}</span>
          <span :class="['font-medium', s.amount < 0 ? 'text-rose-400' : 'text-[var(--text-primary)]']">
            {{ formatCurrency(s.amount) }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>
