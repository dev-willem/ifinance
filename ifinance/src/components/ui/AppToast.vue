<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Toast } from '@/stores/notifications'
import { TOAST_DURATION } from '@/core/constants'

interface Props {
  toast: Toast
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: [id: string]
}>()

const progress = ref(100)
const intervalId = ref<ReturnType<typeof setInterval> | null>(null)

const config = computed(() => {
  const map = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: 'text-emerald-400',
      progress: 'bg-emerald-500',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/30',
      icon: 'text-rose-400',
      progress: 'bg-rose-500',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: 'text-amber-400',
      progress: 'bg-amber-500',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: 'text-blue-400',
      progress: 'bg-blue-500',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  }
  return map[props.toast.type]
})

onMounted(() => {
  if (!props.toast.persistent) {
    const duration = props.toast.duration ?? TOAST_DURATION
    const steps = 100
    const interval = duration / steps

    intervalId.value = setInterval(() => {
      progress.value -= 1
      if (progress.value <= 0) {
        if (intervalId.value) clearInterval(intervalId.value)
      }
    }, interval)
  }
})
</script>

<template>
  <div
    :class="[
      'relative flex items-start gap-3 rounded-xl border p-4 shadow-lg min-w-[320px] max-w-[420px]',
      'animate-slide-in-right',
      config.bg,
    ]"
  >
    <!-- Icon -->
    <div :class="['flex-shrink-0 mt-0.5', config.icon]">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" :d="config.iconPath" />
      </svg>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-[var(--text-primary)]">{{ toast.title }}</p>
      <p v-if="toast.message" class="mt-0.5 text-sm text-[var(--text-secondary)]">{{ toast.message }}</p>
    </div>

    <!-- Close -->
    <button
      class="flex-shrink-0 -mt-0.5 -mr-1 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
      @click="emit('close', toast.id)"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Progress bar -->
    <div
      v-if="!toast.persistent"
      class="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-all duration-100"
      :class="config.progress"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>
