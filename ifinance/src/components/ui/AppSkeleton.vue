<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  width?: string
  height?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  rounded: 'md',
})

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-xl',
  full: 'rounded-full',
}
</script>

<template>
  <div
    :class="cn('animate-shimmer', roundedClasses[rounded], props.class)"
    :style="{
      width: width,
      height: height ?? '1rem',
    }"
  />
</template>
