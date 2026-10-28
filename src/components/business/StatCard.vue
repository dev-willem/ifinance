<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'

withDefaults(
  defineProps<{
    label: string
    value: string
    detail?: string
    tone?: 'default' | 'primary' | 'success' | 'danger' | 'warning'
  }>(),
  { tone: 'default', detail: undefined },
)

const TONES = {
  default: 'text-[var(--text-primary)]',
  primary: 'text-indigo-400',
  success: 'text-emerald-400',
  danger: 'text-rose-400',
  warning: 'text-amber-400',
}
</script>

<template>
  <AppCard>
    <p class="text-xs text-[var(--text-muted)]">{{ label }}</p>
    <p :class="['text-lg sm:text-xl font-bold mt-1 tabular-nums', TONES[tone]]">{{ value }}</p>
    <p v-if="detail" class="text-xs text-[var(--text-muted)] mt-1">{{ detail }}</p>
  </AppCard>
</template>
