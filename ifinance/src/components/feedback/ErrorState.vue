<script setup lang="ts">
interface Props {
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Algo deu errado',
  message: 'Não foi possível carregar os dados. Tente novamente.',
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
      <svg class="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>

    <div>
      <h3 class="text-base font-semibold text-[var(--text-primary)]">{{ title }}</h3>
      <p v-if="message" class="mt-1 text-sm text-[var(--text-muted)] max-w-xs mx-auto">{{ message }}</p>
    </div>

    <button
      class="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
      @click="emit('retry')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Tentar novamente
    </button>
  </div>
</template>
