<script setup lang="ts">
import { computed } from 'vue'
import { useFormatBR } from '@/composables/useFormatBR'
import { barWidths } from './taxHelpers'

interface BarItem {
  key: string
  label: string
  value: number | null
  /** shown instead of the value when it is null */
  emptyText?: string
  highlight?: boolean
}

const props = defineProps<{ items: BarItem[]; ariaLabel: string }>()

const { formatCurrency } = useFormatBR()
const ROW_HEIGHT = 44
const widths = computed(() => barWidths(props.items.map((i) => i.value)))
</script>

<template>
  <svg
    width="100%"
    :height="items.length * ROW_HEIGHT"
    role="img"
    :aria-label="ariaLabel"
    class="block"
  >
    <g v-for="(item, i) in items" :key="item.key" :transform="`translate(0, ${i * ROW_HEIGHT})`">
      <text x="0" y="14" class="text-xs fill-[var(--text-secondary)]">{{ item.label }}</text>
      <text
        x="100%"
        y="14"
        text-anchor="end"
        :class="['text-xs font-semibold tabular-nums', item.highlight ? 'fill-emerald-400' : 'fill-[var(--text-primary)]']"
      >
        {{ item.value == null ? (item.emptyText ?? '—') : formatCurrency(item.value) }}
      </text>
      <rect x="0" y="22" width="100%" height="12" rx="6" class="fill-[var(--border-subtle)]" />
      <rect
        v-if="widths[i]"
        x="0"
        y="22"
        :width="`${widths[i]}%`"
        height="12"
        rx="6"
        :class="item.highlight ? 'fill-emerald-500' : 'fill-indigo-500'"
      />
    </g>
  </svg>
</template>
