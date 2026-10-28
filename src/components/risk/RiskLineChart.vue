<script setup lang="ts">
import { computed } from 'vue'
import { linePath, yDomain, yFor } from './chartScale'

interface Series {
  label: string
  values: (number | null)[]
  /** CSS color */
  color: string
}

interface Props {
  series: Series[]
  /** Reference line, e.g. 1 for wealth or 0 for drawdown */
  baseline: number
  /** Fill between the first series and the baseline (underwater chart) */
  area?: boolean
  label: string
  formatY: (v: number) => string
}

const props = withDefaults(defineProps<Props>(), { area: false })

const box = { width: 600, height: 220, padding: 12 }

const domain = computed(() => yDomain(props.series.map((s) => s.values), props.baseline))
const paths = computed(() => props.series.map((s) => linePath(s.values, domain.value, box)))
const baseY = computed(() => yFor(props.baseline, domain.value, box))

const areaPath = computed(() => {
  const first = props.series[0]
  const line = paths.value[0]
  if (!props.area || !first || !line || first.values.some((v) => v === null)) return ''
  const right = box.width - box.padding
  return `${line}L${right},${baseY.value}L${box.padding},${baseY.value}Z`
})
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${box.width} ${box.height}`"
      class="w-full h-48 sm:h-56"
      preserveAspectRatio="none"
      role="img"
      :aria-label="label"
    >
      <line
        :x1="box.padding"
        :x2="box.width - box.padding"
        :y1="baseY"
        :y2="baseY"
        stroke="var(--border-subtle)"
        stroke-dasharray="4 4"
        vector-effect="non-scaling-stroke"
      />
      <path v-if="areaPath" :d="areaPath" :fill="series[0]?.color" fill-opacity="0.18" stroke="none" />
      <path
        v-for="(d, i) in paths"
        :key="series[i]?.label"
        :d="d"
        fill="none"
        :stroke="series[i]?.color"
        stroke-width="2"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
      <div class="flex flex-wrap gap-3">
        <span v-for="s in series" :key="s.label" class="inline-flex items-center gap-1.5">
          <span class="inline-block h-2 w-3 rounded-sm" :style="{ background: s.color }" />
          {{ s.label }}
        </span>
      </div>
      <span class="tabular-nums">mín {{ formatY(domain[0]) }} · máx {{ formatY(domain[1]) }}</span>
    </div>
  </div>
</template>
