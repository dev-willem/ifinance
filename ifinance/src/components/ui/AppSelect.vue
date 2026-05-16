<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface OptionGroup {
  label: string
  options: SelectOption[]
}

interface Props {
  modelValue?: string | number | null
  options?: SelectOption[]
  groups?: OptionGroup[]
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  class?: string
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  options: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  change: [value: string | number | null]
}>()

const inputId = computed(() => props.id ?? `select-${Math.random().toString(36).slice(2, 9)}`)
const hasError = computed(() => !!props.error)

const selectClasses = computed(() =>
  cn(
    'w-full rounded-lg border bg-[var(--bg-card)] text-[var(--text-primary)] text-sm h-9 px-3 py-2',
    'transition-all duration-150 focus:outline-none focus:ring-2 appearance-none cursor-pointer',
    hasError.value
      ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500'
      : 'border-[var(--border-subtle)] focus:ring-indigo-500/30 focus:border-indigo-500',
    props.disabled ? 'opacity-50 cursor-not-allowed' : '',
    props.class,
  ),
)

function handleChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const val = target.value
  emit('update:modelValue', val === '' ? null : val)
  emit('change', val === '' ? null : val)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      :for="inputId"
      class="text-sm font-medium text-[var(--text-secondary)]"
    >
      {{ label }}
      <span v-if="required" class="text-rose-400 ml-0.5">*</span>
    </label>

    <div class="relative">
      <select
        :id="inputId"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :required="required"
        :name="name"
        :class="selectClasses"
        @change="handleChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>

        <!-- Flat options -->
        <template v-if="!groups?.length">
          <option
            v-for="opt in options"
            :key="String(opt.value)"
            :value="opt.value"
            :disabled="opt.disabled"
          >
            {{ opt.label }}
          </option>
        </template>

        <!-- Grouped options -->
        <template v-else>
          <optgroup v-for="group in groups" :key="group.label" :label="group.label">
            <option
              v-for="opt in group.options"
              :key="String(opt.value)"
              :value="opt.value"
              :disabled="opt.disabled"
            >
              {{ opt.label }}
            </option>
          </optgroup>
        </template>
      </select>

      <!-- Chevron icon -->
      <div class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <p v-if="error" class="text-xs text-rose-400 flex items-center gap-1">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-[var(--text-muted)]">{{ hint }}</p>
  </div>
</template>
