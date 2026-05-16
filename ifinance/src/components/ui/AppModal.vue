<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from 'reka-ui'

interface Props {
  open: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
}

function close() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
      />
      <DialogContent
        :class="[
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full',
          sizeClasses[size],
          'bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl',
          'data-[state=open]:animate-scale-in data-[state=closed]:animate-fade-out',
          'focus:outline-none',
        ]"
        @escape-key-down="close"
        @interact-outside="close"
      >
        <!-- Header -->
        <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <DialogTitle class="text-base font-semibold text-[var(--text-primary)]">
            <slot name="header">{{ title }}</slot>
          </DialogTitle>
          <DialogClose
            class="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
            @click="close"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DialogClose>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
