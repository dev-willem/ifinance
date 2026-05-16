<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div class="flex items-start gap-3">
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      :class="[
        'relative flex-shrink-0 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        modelValue ? 'bg-indigo-500' : 'bg-[var(--border-subtle)]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="!disabled && emit('update:modelValue', !modelValue)"
    >
      <span
        :class="[
          'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
          size === 'sm' ? 'h-3.5 w-3.5 translate-y-[3px]' : 'h-4.5 w-4.5',
          'absolute top-[3px]',
          size === 'sm'
            ? modelValue ? 'translate-x-[18px]' : 'translate-x-[3px]'
            : modelValue ? 'translate-x-[22px]' : 'translate-x-[3px]',
          size === 'md' ? 'h-[18px] w-[18px]' : '',
        ]"
      />
    </button>

    <div v-if="label || description" class="flex flex-col">
      <span v-if="label" class="text-sm font-medium text-[var(--text-secondary)]">{{ label }}</span>
      <span v-if="description" class="text-xs text-[var(--text-muted)] mt-0.5">{{ description }}</span>
    </div>
  </div>
</template>
