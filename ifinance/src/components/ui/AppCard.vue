<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  class?: string
  noBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  padding: 'md',
  noBorder: false,
})

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const cardClass = cn(
  'rounded-xl bg-[var(--bg-card)] transition-all duration-150',
  !props.noBorder && 'border border-[var(--border-subtle)]',
  props.hoverable && 'hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer',
)
</script>

<template>
  <div :class="cn(cardClass, props.class)">
    <div v-if="$slots.header" class="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
      <slot name="header" />
    </div>
    <div :class="$slots.header || $slots.footer ? paddingClasses[padding] : paddingClasses[padding]">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-5 py-4 border-t border-[var(--border-subtle)]">
      <slot name="footer" />
    </div>
  </div>
</template>
