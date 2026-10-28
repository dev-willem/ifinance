<script setup lang="ts">
import { computed } from 'vue'
import { useFormatBR } from '@/composables/useFormatBR'
import { linearScale, valueDomain, type WaterfallBar } from './helpers'

const props = defineProps<{ bars: WaterfallBar[] }>()

const { formatCurrency } = useFormatBR()

const W = 640
const H = 260
const TOP = 12
const BOTTOM = 32

const layout = computed(() => {
  const [min, max] = valueDomain(props.bars.flatMap((b) => [b.start, b.end]))
  const y = linearScale(min, max, H - BOTTOM, TOP)
  const slot = W / Math.max(props.bars.length, 1)
  return {
    zeroY: y(0),
    bars: props.bars.map((b, i) => {
      const y1 = y(Math.max(b.start, b.end))
      const y2 = y(Math.min(b.start, b.end))
      return {
        ...b,
        x: i * slot + slot * 0.18,
        cx: i * slot + slot / 2,
        width: slot * 0.64,
        y: y1,
        endY: y(b.end),
        height: Math.max(y2 - y1, 1),
        color:
          b.kind === 'increase'
            ? 'fill-emerald-500'
            : b.kind === 'decrease'
              ? 'fill-rose-500'
              : b.end < 0
                ? 'fill-rose-600'
                : 'fill-indigo-500',
      }
    }),
  }
})

const amount = (b: WaterfallBar) => (b.kind === 'total' ? b.end : b.end - b.start)

const summary = computed(() => props.bars.map((b) => `${b.label}: ${formatCurrency(amount(b))}`).join('; '))
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    class="w-full h-auto"
    role="img"
    :aria-label="`Cascata da DRE. ${summary}`"
  >
    <line :x1="0" :x2="W" :y1="layout.zeroY" :y2="layout.zeroY" class="stroke-[var(--border-subtle)]" stroke-width="1" />
    <g v-for="(b, i) in layout.bars" :key="b.label">
      <rect :x="b.x" :y="b.y" :width="b.width" :height="b.height" rx="3" :class="b.color">
        <title>{{ b.label }}: {{ formatCurrency(amount(b)) }}</title>
      </rect>
      <line
        v-if="i < layout.bars.length - 2"
        :x1="b.x + b.width"
        :x2="layout.bars[i + 1]!.x"
        :y1="b.endY"
        :y2="b.endY"
        class="stroke-[var(--text-muted)]"
        stroke-dasharray="2 2"
        stroke-width="1"
      />
      <text :x="b.cx" :y="H - 12" text-anchor="middle" class="fill-[var(--text-muted)]" font-size="12">
        {{ b.label }}
      </text>
    </g>
  </svg>
</template>
