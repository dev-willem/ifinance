<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-medium text-xs px-2.5 py-0.5', {
  variants: {
    tone: {
      success: '',
      warning: '',
      danger: '',
      info: '',
      neutral: '',
      primary: '',
    },
    variant: {
      solid: '',
      outline: '',
      subtle: '',
    },
  },
  compoundVariants: [
    // Solid
    { tone: 'success', variant: 'solid', class: 'bg-emerald-500 text-white' },
    { tone: 'warning', variant: 'solid', class: 'bg-amber-500 text-white' },
    { tone: 'danger', variant: 'solid', class: 'bg-rose-500 text-white' },
    { tone: 'info', variant: 'solid', class: 'bg-blue-500 text-white' },
    { tone: 'neutral', variant: 'solid', class: 'bg-slate-500 text-white' },
    { tone: 'primary', variant: 'solid', class: 'bg-indigo-500 text-white' },
    // Outline
    { tone: 'success', variant: 'outline', class: 'border border-emerald-500 text-emerald-400' },
    { tone: 'warning', variant: 'outline', class: 'border border-amber-500 text-amber-400' },
    { tone: 'danger', variant: 'outline', class: 'border border-rose-500 text-rose-400' },
    { tone: 'info', variant: 'outline', class: 'border border-blue-500 text-blue-400' },
    { tone: 'neutral', variant: 'outline', class: 'border border-slate-500 text-slate-400' },
    { tone: 'primary', variant: 'outline', class: 'border border-indigo-500 text-indigo-400' },
    // Subtle
    { tone: 'success', variant: 'subtle', class: 'bg-emerald-500/15 text-emerald-400' },
    { tone: 'warning', variant: 'subtle', class: 'bg-amber-500/15 text-amber-400' },
    { tone: 'danger', variant: 'subtle', class: 'bg-rose-500/15 text-rose-400' },
    { tone: 'info', variant: 'subtle', class: 'bg-blue-500/15 text-blue-400' },
    { tone: 'neutral', variant: 'subtle', class: 'bg-slate-500/15 text-slate-400' },
    { tone: 'primary', variant: 'subtle', class: 'bg-indigo-500/15 text-indigo-400' },
  ],
  defaultVariants: {
    tone: 'neutral',
    variant: 'subtle',
  },
})

type BadgeVariants = VariantProps<typeof badgeVariants>

interface Props {
  tone?: BadgeVariants['tone']
  variant?: BadgeVariants['variant']
  dot?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'neutral',
  variant: 'subtle',
  dot: false,
})
</script>

<template>
  <span :class="cn(badgeVariants({ tone, variant }), props.class)">
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full bg-current"
    />
    <slot />
  </span>
</template>
