<script setup lang="ts">
interface Tab {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  count?: number
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [key: string]
}>()
</script>

<template>
  <div class="border-b border-[var(--border-subtle)]">
    <nav class="flex gap-0 -mb-px overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :disabled="tab.disabled"
        :class="[
          'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2',
          modelValue === tab.key
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-subtle)]',
          tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ]"
        @click="!tab.disabled && emit('update:modelValue', tab.key)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          class="rounded-full bg-[var(--border-subtle)] px-1.5 py-0.5 text-xs"
          :class="modelValue === tab.key ? 'bg-indigo-500/20 text-indigo-400' : ''"
        >
          {{ tab.count }}
        </span>
      </button>
    </nav>
  </div>
</template>
