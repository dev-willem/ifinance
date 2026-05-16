<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { cn } from '@/utils/cn'

type InputVariant = 'default' | 'currency' | 'percent' | 'number'

interface Props {
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  type?: string
  variant?: InputVariant
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  min?: number
  max?: number
  step?: number
  class?: string
  id?: string
  name?: string
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  variant: 'default',
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [event: Event]
}>()

const slots = useSlots()
const inputId = computed(() => props.id ?? `input-${Math.random().toString(36).slice(2, 9)}`)
const isFocused = ref(false)

const hasError = computed(() => !!props.error)
const hasPrefixSlot = computed(() => !!slots['prefix'])
const hasSuffixSlot = computed(() => !!slots['suffix'])

const inputValue = computed({
  get() {
    return props.modelValue ?? ''
  },
  set(val: string | number) {
    if (props.variant === 'number' || props.variant === 'currency' || props.variant === 'percent') {
      const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val
      emit('update:modelValue', isNaN(num) ? null : num)
    } else {
      emit('update:modelValue', val)
    }
  },
})

const inputClasses = computed(() =>
  cn(
    'w-full rounded-lg border bg-[var(--bg-card)] text-[var(--text-primary)] text-sm transition-all duration-150',
    'placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2',
    hasPrefixSlot.value ? 'pl-9' : 'pl-3',
    hasSuffixSlot.value ? 'pr-9' : 'pr-3',
    'py-2 h-9',
    hasError.value
      ? 'border-rose-500 focus:ring-rose-500/30 focus:border-rose-500'
      : 'border-[var(--border-subtle)] focus:ring-indigo-500/30 focus:border-indigo-500',
    props.disabled ? 'opacity-50 cursor-not-allowed' : '',
    props.class,
  ),
)
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
      <div
        v-if="$slots.prefix"
        class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      >
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        v-model="inputValue"
        :type="variant === 'currency' || variant === 'percent' || variant === 'number' ? 'number' : type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step ?? (variant === 'currency' ? 0.01 : variant === 'percent' ? 0.01 : 1)"
        :name="name"
        :autofocus="autofocus"
        :class="inputClasses"
        @blur="(e) => { isFocused = false; emit('blur', e) }"
        @focus="(e) => { isFocused = true; emit('focus', e) }"
        @change="emit('change', $event)"
      />

      <div
        v-if="$slots.suffix"
        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      >
        <slot name="suffix" />
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
