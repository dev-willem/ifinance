<script setup lang="ts">
import { computed } from 'vue'
import { useFormatBR } from '@/composables/useFormatBR'
import { commitmentBar } from './credit'

const props = defineProps<{
  currentPercent: number
  resultingPercent?: number
  limitPercent: number
  approved?: boolean
}>()

const { formatPercent } = useFormatBR()
const bar = computed(() =>
  commitmentBar(props.currentPercent, props.resultingPercent, props.limitPercent, props.approved),
)
const shown = computed(() => props.resultingPercent ?? props.currentPercent)
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between mb-2">
      <span class="text-xs text-[var(--text-muted)]">Comprometimento da renda</span>
      <span :class="['text-sm font-semibold', bar.overLimit ? 'text-rose-400' : 'text-emerald-400']">
        {{ formatPercent(shown) }}
      </span>
    </div>
    <div
      class="relative h-3 rounded-full bg-[var(--bg-base)]"
      role="meter"
      aria-label="Comprometimento da renda"
      :aria-valuenow="shown"
      aria-valuemin="0"
      :aria-valuemax="Math.max(100, shown)"
    >
      <div class="absolute inset-0 flex overflow-hidden rounded-full">
        <div class="h-full bg-amber-500 transition-all duration-700" :style="{ width: `${bar.currentWidth}%` }" />
        <div
          :class="['h-full transition-all duration-700', bar.overLimit ? 'bg-rose-500' : 'bg-indigo-500']"
          :style="{ width: `${bar.newWidth}%` }"
        />
      </div>
      <div
        class="absolute -top-1 -bottom-1 w-0.5 bg-[var(--text-primary)]"
        :style="{ left: `${bar.limitPosition}%` }"
        :title="`Limite: ${formatPercent(limitPercent)}`"
      />
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-muted)]">
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-500" />Dívidas atuais</span>
      <span v-if="resultingPercent !== undefined" class="flex items-center gap-1.5">
        <span :class="['h-2 w-2 rounded-full', bar.overLimit ? 'bg-rose-500' : 'bg-indigo-500']" />Nova parcela
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-2 w-0.5 bg-[var(--text-primary)]" />Limite {{ formatPercent(limitPercent) }}
      </span>
    </div>
  </div>
</template>
