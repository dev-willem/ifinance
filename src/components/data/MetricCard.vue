<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue'

interface Props {
  label: string
  value?: string | number | null
  change?: number
  changeLabel?: string
  loading?: boolean
  color?: 'default' | 'primary' | 'success' | 'danger' | 'warning'
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  color: 'default',
})

const colorMap = {
  default: 'bg-[var(--border-subtle)] text-[var(--text-muted)]',
  primary: 'bg-indigo-500/15 text-indigo-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  danger: 'bg-rose-500/15 text-rose-400',
  warning: 'bg-amber-500/15 text-amber-400',
}

const isPositiveChange = props.change !== undefined && props.change > 0
const isNegativeChange = props.change !== undefined && props.change < 0
</script>

<template>
  <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm font-medium text-[var(--text-muted)]">{{ label }}</p>
        <AppSkeleton v-if="loading" width="120px" height="28px" class="mt-2" />
        <p v-else class="mt-1.5 text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {{ value ?? '-' }}
        </p>
      </div>

      <div v-if="$slots.icon || icon" :class="['flex h-10 w-10 items-center justify-center rounded-xl', colorMap[color]]">
        <slot name="icon" />
      </div>
    </div>

    <!-- Change indicator -->
    <div v-if="change !== undefined && !loading" class="flex items-center gap-1.5">
      <div
        :class="[
          'flex items-center gap-1 text-xs font-medium rounded px-1.5 py-0.5',
          isPositiveChange ? 'text-emerald-400 bg-emerald-500/10' : '',
          isNegativeChange ? 'text-rose-400 bg-rose-500/10' : '',
          !isPositiveChange && !isNegativeChange ? 'text-[var(--text-muted)] bg-[var(--border-subtle)]' : '',
        ]"
      >
        <svg v-if="isPositiveChange" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        <svg v-else-if="isNegativeChange" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {{ change > 0 ? '+' : '' }}{{ change.toFixed(1) }}%
      </div>
      <span v-if="changeLabel" class="text-xs text-[var(--text-muted)]">{{ changeLabel }}</span>
    </div>
  </div>
</template>
