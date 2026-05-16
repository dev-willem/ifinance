<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_SIZE_OPTIONS } from '@/core/constants'

interface Props {
  totalItems: number
  currentPage: number
  pageSize: number
  totalPages: number
  showPageSizeSelector?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPageSizeSelector: true,
})

const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [size: number]
}>()

const from = computed(() => props.currentPage * props.pageSize + 1)
const to = computed(() => Math.min((props.currentPage + 1) * props.pageSize, props.totalItems))

const visiblePages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const pages: (number | '...')[] = []

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }

  pages.push(0)
  if (current > 3) pages.push('...')

  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 4) pages.push('...')
  pages.push(total - 1)

  return pages
})
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
    <!-- Info -->
    <p class="text-[var(--text-muted)]">
      Exibindo {{ from }}-{{ to }} de {{ totalItems }} itens
    </p>

    <div class="flex items-center gap-3">
      <!-- Page size selector -->
      <div v-if="showPageSizeSelector" class="flex items-center gap-2 text-[var(--text-muted)]">
        <span>Por página:</span>
        <select
          :value="pageSize"
          class="h-7 rounded border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-xs px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          @change="emit('page-size-change', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>

      <!-- Pages -->
      <nav class="flex items-center gap-1">
        <button
          :disabled="currentPage === 0"
          class="flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-indigo-500/50 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="emit('page-change', currentPage - 1)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          :disabled="page === '...'"
          :class="[
            'flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-lg text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-indigo-500 text-white border border-indigo-500'
              : page === '...'
              ? 'text-[var(--text-muted)] cursor-default'
              : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-indigo-500/50 hover:text-indigo-400',
          ]"
          @click="typeof page === 'number' && emit('page-change', page)"
        >
          {{ page === '...' ? '…' : Number(page) + 1 }}
        </button>

        <button
          :disabled="currentPage >= totalPages - 1"
          class="flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-indigo-500/50 hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="emit('page-change', currentPage + 1)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>
