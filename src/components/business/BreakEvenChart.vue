<script setup lang="ts">
import { computed } from 'vue'
import { useFormatBR } from '@/composables/useFormatBR'
import { breakEvenChartData, linearScale } from './helpers'

const props = defineProps<{
  fixedCosts: number
  unitPrice: number
  unitVariableCost: number
  breakEvenQuantity: number
  currentQuantity?: number | null
}>()

const { formatLargeNumber, formatNumber } = useFormatBR()

const W = 640
const H = 300
const LEFT = 72
const RIGHT = 16
const TOP = 16
const BOTTOM = 36

const chart = computed(() => {
  const d = breakEvenChartData(
    props.fixedCosts,
    props.unitPrice,
    props.unitVariableCost,
    props.breakEvenQuantity,
    props.currentQuantity,
  )
  const x = linearScale(0, d.maxQuantity, LEFT, W - RIGHT)
  const y = linearScale(0, d.maxValue, H - BOTTOM, TOP)
  return {
    d,
    x,
    y,
    yTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => f * d.maxValue),
    xTicks: [0, d.maxQuantity / 2, d.maxQuantity],
  }
})
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto"
      role="img"
      :aria-label="`Gráfico de ponto de equilíbrio: receita e custo total se cruzam em ${formatNumber(breakEvenQuantity, 2)} unidades`"
    >
      <g v-for="t in chart.yTicks" :key="`y${t}`">
        <line :x1="LEFT" :x2="W - RIGHT" :y1="chart.y(t)" :y2="chart.y(t)" class="stroke-[var(--border-subtle)]" stroke-width="1" />
        <text :x="LEFT - 6" :y="chart.y(t) + 4" text-anchor="end" font-size="11" class="fill-[var(--text-muted)]">
          {{ formatLargeNumber(t) }}
        </text>
      </g>
      <text
        v-for="t in chart.xTicks"
        :key="`x${t}`"
        :x="chart.x(t)"
        :y="H - BOTTOM + 18"
        text-anchor="middle"
        font-size="11"
        class="fill-[var(--text-muted)]"
      >
        {{ formatNumber(t, 0) }} un
      </text>

      <!-- Fixed cost -->
      <line
        :x1="chart.x(0)"
        :x2="chart.x(chart.d.maxQuantity)"
        :y1="chart.y(fixedCosts)"
        :y2="chart.y(fixedCosts)"
        class="stroke-[var(--text-muted)]"
        stroke-dasharray="4 4"
        stroke-width="1.5"
      />
      <!-- Total cost -->
      <line
        :x1="chart.x(0)"
        :x2="chart.x(chart.d.maxQuantity)"
        :y1="chart.y(fixedCosts)"
        :y2="chart.y(chart.d.costAtMax)"
        class="stroke-rose-500"
        stroke-width="2.5"
      />
      <!-- Revenue -->
      <line
        :x1="chart.x(0)"
        :x2="chart.x(chart.d.maxQuantity)"
        :y1="chart.y(0)"
        :y2="chart.y(chart.d.revenueAtMax)"
        class="stroke-emerald-500"
        stroke-width="2.5"
      />

      <!-- Current quantity -->
      <g v-if="currentQuantity">
        <line
          :x1="chart.x(currentQuantity)"
          :x2="chart.x(currentQuantity)"
          :y1="TOP"
          :y2="H - BOTTOM"
          class="stroke-amber-500"
          stroke-dasharray="3 3"
          stroke-width="1.5"
        />
        <text :x="chart.x(currentQuantity) + 4" :y="TOP + 10" font-size="11" class="fill-amber-500">Atual</text>
      </g>

      <!-- Break-even point -->
      <line
        :x1="chart.x(breakEvenQuantity)"
        :x2="chart.x(breakEvenQuantity)"
        :y1="chart.y(chart.d.breakEvenRevenue)"
        :y2="H - BOTTOM"
        class="stroke-indigo-400"
        stroke-dasharray="2 3"
        stroke-width="1"
      />
      <circle
        :cx="chart.x(breakEvenQuantity)"
        :cy="chart.y(chart.d.breakEvenRevenue)"
        r="6"
        class="fill-indigo-500 stroke-[var(--bg-card)]"
        stroke-width="2"
      >
        <title>Ponto de equilíbrio: {{ formatNumber(breakEvenQuantity, 2) }} un</title>
      </circle>
      <text
        :x="chart.x(breakEvenQuantity) + 10"
        :y="chart.y(chart.d.breakEvenRevenue) + 16"
        font-size="12"
        font-weight="600"
        class="fill-indigo-400"
      >
        PE
      </text>
    </svg>

    <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
      <li class="flex items-center gap-1.5"><span class="h-0.5 w-4 bg-emerald-500" aria-hidden="true" />Receita</li>
      <li class="flex items-center gap-1.5"><span class="h-0.5 w-4 bg-rose-500" aria-hidden="true" />Custo total</li>
      <li class="flex items-center gap-1.5"><span class="h-0.5 w-4 border-t border-dashed border-[var(--text-muted)]" aria-hidden="true" />Custo fixo</li>
      <li class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-indigo-500" aria-hidden="true" />Ponto de equilíbrio contábil</li>
      <li v-if="currentQuantity" class="flex items-center gap-1.5"><span class="h-3 w-0.5 bg-amber-500" aria-hidden="true" />Quantidade atual</li>
    </ul>
  </div>
</template>
