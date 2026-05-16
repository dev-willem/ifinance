<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
  ctaLabel?: string
  ctaTo?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Nenhum dado encontrado',
})

const emit = defineEmits<{
  cta: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--border-subtle)]">
      <slot name="icon">
        <svg class="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </slot>
    </div>

    <div>
      <h3 class="text-base font-semibold text-[var(--text-primary)]">{{ title }}</h3>
      <p v-if="description" class="mt-1 text-sm text-[var(--text-muted)] max-w-xs mx-auto">{{ description }}</p>
    </div>

    <slot name="action">
      <button
        v-if="ctaLabel"
        class="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        @click="emit('cta')"
      >
        {{ ctaLabel }}
      </button>
    </slot>
  </div>
</template>
