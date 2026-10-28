<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useFormatBR } from '@/composables/useFormatBR'
import type { MonteCarloHistogramBin } from '@/types/monteCarlo'
import { scaleLinear } from './chartScale'

const props = defineProps<{
  bins: MonteCarloHistogramBin[]
  iterations: number
  overflowCount: number
  target?: number
}>()

const { formatCurrency, formatLargeNumber, formatInt } = useFormatBR()

// viewBox width follows the rendered width so font-size 11 stays 11px on phones
const { width } = useElementSize(useTemplateRef<HTMLElement>('container'))
const W = computed(() => Math.round(width.value) || 640)
const H = 220
const M = { top: 8, right: 8, bottom: 28, left: 8 }

const chart = computed(() => {
  const maxCount = Math.max(1, ...props.bins.map((b) => b.count))
  const barW = (W.value - M.left - M.right) / Math.max(1, props.bins.length)
  const y = scaleLinear(0, maxCount, H - M.bottom, M.top)
  const last = props.bins[props.bins.length - 1]
  return {
    bars: props.bins.map((b, i) => ({
      ...b,
      x: M.left + i * barW,
      y: y(b.count),
      h: H - M.bottom - y(b.count),
      w: Math.max(1, barW - 2),
      hitsTarget: props.target != null && b.lower >= props.target,
    })),
    minLabel: props.bins[0] ? formatLargeNumber(props.bins[0].lower) : '',
    maxLabel: last ? formatLargeNumber(last.upper) : '',
  }
})
</script>

<template>
  <div ref="container">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto"
      role="img"
      aria-label="Histograma da distribuição do patrimônio final simulado"
    >
      <rect
        v-for="(bar, i) in chart.bars"
        :key="i"
        :x="bar.x + 1"
        :y="bar.y"
        :width="bar.w"
        :height="bar.h"
        rx="2"
        :class="bar.hitsTarget ? 'fill-emerald-500' : 'fill-indigo-500'"
        fill-opacity="0.75"
      >
        <title>
          {{ formatCurrency(bar.lower) }} – {{ formatCurrency(bar.upper) }}: {{ formatInt(bar.count) }} simulações
          ({{ ((bar.count / iterations) * 100).toFixed(1).replace('.', ',') }}%)
        </title>
      </rect>
      <line :x1="M.left" :x2="W - M.right" :y1="H - M.bottom" :y2="H - M.bottom" stroke="var(--border-subtle)" />
      <text :x="M.left" :y="H - 8" font-size="11" style="fill: var(--text-muted)">{{ chart.minLabel }}</text>
      <text :x="W - M.right" :y="H - 8" text-anchor="end" font-size="11" style="fill: var(--text-muted)">
        {{ chart.maxLabel }}
      </text>
    </svg>
    <p class="mt-2 text-xs text-[var(--text-muted)]">
      Patrimônio final em {{ formatInt(iterations) }} simulações.
      <template v-if="overflowCount > 0">
        {{ formatInt(overflowCount) }} cenários acima do percentil 99 foram omitidos para manter a escala legível.
      </template>
      <template v-if="target != null"> Barras em verde: faixas que atingem a meta.</template>
    </p>
  </div>
</template>
