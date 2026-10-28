<script setup lang="ts">
import { computed } from 'vue'
import type { DepreciationMethod, DepreciationResponse } from '@/types/depreciation'
import { useFormatBR } from '@/composables/useFormatBR'
import { bookValueSeries, scaleLinear, toPath, yearTicks } from './depreciationChart'

const props = defineProps<{
  schedules: DepreciationResponse[]
  labels: Record<DepreciationMethod, string>
}>()

const { formatLargeNumber } = useFormatBR()

const W = 640
const H = 260
const PAD = { top: 12, right: 16, bottom: 32, left: 72 }
const COLORS: Record<DepreciationMethod, string> = {
  STRAIGHT_LINE: '#6366f1',
  SUM_OF_YEARS_DIGITS: '#10b981',
  DECLINING_BALANCE: '#f59e0b',
  UNITS_OF_PRODUCTION: '#f43f5e',
}

const series = computed(() =>
  props.schedules.map((s) => ({ method: s.method, points: bookValueSeries(s) })),
)
const maxX = computed(() => Math.max(1, ...series.value.flatMap((s) => s.points.map((p) => p.x))))
const maxY = computed(() => Math.max(1, ...series.value.flatMap((s) => s.points.map((p) => p.y))))
const sx = computed(() => scaleLinear(0, maxX.value, PAD.left, W - PAD.right))
const sy = computed(() => scaleLinear(0, maxY.value, H - PAD.bottom, PAD.top))
const xTicks = computed(() => yearTicks(maxX.value))
const yTicks = computed(() => [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY.value))
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full h-auto"
      role="img"
      aria-label="Valor contábil ao longo do tempo por método de depreciação"
    >
      <g class="text-[var(--text-muted)]" fill="currentColor" font-size="11">
        <g v-for="t in yTicks" :key="`y${t}`">
          <line
            :x1="PAD.left" :x2="W - PAD.right" :y1="sy(t)" :y2="sy(t)"
            stroke="var(--border-subtle)" stroke-width="1"
          />
          <text :x="PAD.left - 8" :y="sy(t) + 4" text-anchor="end">{{ formatLargeNumber(t) }}</text>
        </g>
        <text
          v-for="t in xTicks" :key="`x${t}`"
          :x="sx(t)" :y="H - PAD.bottom + 18" text-anchor="middle"
        >{{ t }}a</text>
      </g>
      <path
        v-for="s in series" :key="s.method"
        :d="toPath(s.points, sx, sy)"
        fill="none" :stroke="COLORS[s.method]" stroke-width="2.5" stroke-linejoin="round"
      />
    </svg>
    <ul class="flex flex-wrap gap-4 mt-2 text-xs text-[var(--text-secondary)]">
      <li v-for="s in schedules" :key="s.method" class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-0.5 rounded" :style="{ backgroundColor: COLORS[s.method] }" />
        {{ labels[s.method] }}
      </li>
    </ul>
  </div>
</template>
