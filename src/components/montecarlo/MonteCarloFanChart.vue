<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useFormatBR } from '@/composables/useFormatBR'
import type { MonteCarloYearBand } from '@/types/monteCarlo'
import { bandPath, linePath, niceTicks, scaleLinear, yearTicks } from './chartScale'

const props = defineProps<{
  bands: MonteCarloYearBand[]
  target?: number
}>()

const { formatLargeNumber } = useFormatBR()

// viewBox width follows the rendered width so font-size 11 stays 11px on phones
const { width } = useElementSize(useTemplateRef<HTMLElement>('container'))
const W = computed(() => Math.round(width.value) || 640)
const H = 300
const M = { top: 12, right: 16, bottom: 32, left: 76 }

const chart = computed(() => {
  const bands = props.bands
  const years = bands[bands.length - 1]?.year ?? 0
  const maxValue = Math.max(...bands.map((b) => Math.max(b.p95, b.expected)), props.target ?? 0)
  const ticks = niceTicks(maxValue)
  const x = scaleLinear(0, years, M.left, W.value - M.right)
  const y = scaleLinear(0, ticks[ticks.length - 1]!, H - M.bottom, M.top)
  const xs = bands.map((b) => x(b.year))
  const ys = (key: keyof MonteCarloYearBand) => bands.map((b) => y(b[key]))
  return {
    x,
    y,
    yTicks: ticks,
    xTicks: yearTicks(years, Math.max(3, Math.floor((W.value - M.left - M.right) / 40))),
    outer: bandPath(xs, ys('p95'), ys('p5')),
    inner: bandPath(xs, ys('p75'), ys('p25')),
    median: linePath(xs, ys('p50')),
    expected: linePath(xs, ys('expected')),
    contributed: linePath(xs, ys('contributed')),
    targetY: props.target != null ? y(props.target) : null,
  }
})
</script>

<template>
  <div ref="container">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto"
      role="img"
      aria-label="Gráfico em leque com as faixas de percentis do patrimônio ao longo dos anos"
    >
      <g v-for="t in chart.yTicks" :key="`y${t}`">
        <line :x1="M.left" :x2="W - M.right" :y1="chart.y(t)" :y2="chart.y(t)" stroke="var(--border-subtle)" />
        <text :x="M.left - 8" :y="chart.y(t) + 4" text-anchor="end" font-size="11" style="fill: var(--text-muted)">
          {{ formatLargeNumber(t) }}
        </text>
      </g>
      <text
        v-for="t in chart.xTicks"
        :key="`x${t}`"
        :x="chart.x(t)"
        :y="H - M.bottom + 18"
        text-anchor="middle"
        font-size="11"
        style="fill: var(--text-muted)"
      >
        {{ t }}
      </text>

      <path :d="chart.outer" class="fill-indigo-500" fill-opacity="0.15" />
      <path :d="chart.inner" class="fill-indigo-500" fill-opacity="0.3" />
      <path :d="chart.contributed" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="2 4" />
      <path :d="chart.expected" fill="none" class="stroke-emerald-400" stroke-width="1.5" stroke-dasharray="6 4" />
      <path :d="chart.median" fill="none" class="stroke-indigo-400" stroke-width="2.5" />
      <line
        v-if="chart.targetY != null"
        :x1="M.left"
        :x2="W - M.right"
        :y1="chart.targetY"
        :y2="chart.targetY"
        class="stroke-amber-400"
        stroke-width="1.5"
        stroke-dasharray="8 4"
      />
    </svg>

    <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
      <li class="flex items-center gap-1.5"><span class="h-3 w-4 rounded-sm bg-indigo-500/15" />P5–P95</li>
      <li class="flex items-center gap-1.5"><span class="h-3 w-4 rounded-sm bg-indigo-500/30" />P25–P75</li>
      <li class="flex items-center gap-1.5"><span class="h-0.5 w-4 bg-indigo-400" />Mediana</li>
      <li class="flex items-center gap-1.5"><span class="h-0 w-4 border-t-2 border-dashed border-emerald-400" />Valor esperado</li>
      <li class="flex items-center gap-1.5"><span class="h-0 w-4 border-t-2 border-dotted border-[var(--text-muted)]" />Total aportado</li>
      <li v-if="target != null" class="flex items-center gap-1.5"><span class="h-0 w-4 border-t-2 border-dashed border-amber-400" />Meta</li>
      <li class="text-[var(--text-muted)]">Eixo X: anos</li>
    </ul>
  </div>
</template>
