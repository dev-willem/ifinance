<script setup lang="ts" generic="T extends object">
import { ref, computed } from 'vue'
import AppSkeleton from './AppSkeleton.vue'
import AppPagination from './AppPagination.vue'
import type { TableColumn, SortState } from '@/types'

interface Props {
  columns: TableColumn[]
  data: T[]
  loading?: boolean
  totalItems?: number
  currentPage?: number
  pageSize?: number
  selectable?: boolean
  selectedIds?: string[]
  rowKey?: string
  emptyTitle?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  totalItems: 0,
  currentPage: 0,
  pageSize: 10,
  selectable: false,
  selectedIds: () => [],
  rowKey: 'id',
  emptyTitle: 'Nenhum dado encontrado',
  emptyDescription: '',
})

const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [size: number]
  'sort': [sort: SortState]
  'row-click': [row: T]
  'select': [ids: string[]]
}>()

const sortState = ref<SortState | null>(null)

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize))

function handleSort(key: string) {
  if (!sortState.value || sortState.value.key !== key) {
    sortState.value = { key, direction: 'asc' }
  } else if (sortState.value.direction === 'asc') {
    sortState.value = { key, direction: 'desc' }
  } else {
    sortState.value = null
  }
  if (sortState.value) {
    emit('sort', sortState.value)
  }
}

function getSortIcon(key: string): string {
  if (!sortState.value || sortState.value.key !== key) return 'neutral'
  return sortState.value.direction
}

function handleSelect(id: string) {
  const ids = [...props.selectedIds]
  const idx = ids.indexOf(id)
  if (idx >= 0) {
    ids.splice(idx, 1)
  } else {
    ids.push(id)
  }
  emit('select', ids)
}

function rowId(row: T): string {
  return String((row as Record<string, unknown>)[props.rowKey ?? 'id'] ?? '')
}

function isSelected(row: T): boolean {
  return props.selectedIds.includes(rowId(row))
}

function cellValue(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

const skeletonRows = computed(() => Array.from({ length: props.pageSize }, (_, i) => i))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <th v-if="selectable" class="w-10 px-4 py-3">
              <span class="sr-only">Selecionar</span>
            </th>
            <th
              v-for="col in columns"
              :key="String(col.key)"
              :class="[
                'px-4 py-3 text-left font-medium text-[var(--text-muted)] whitespace-nowrap',
                col.sortable ? 'cursor-pointer hover:text-[var(--text-secondary)] select-none' : '',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
              ]"
              :style="col.width ? { width: col.width } : {}"
              @click="col.sortable ? handleSort(String(col.key)) : undefined"
            >
              <div class="flex items-center gap-1" :class="col.align === 'right' ? 'justify-end' : ''">
                {{ col.label }}
                <span v-if="col.sortable" class="flex flex-col -space-y-1">
                  <svg
                    class="w-3 h-3"
                    :class="getSortIcon(String(col.key)) === 'asc' ? 'text-indigo-400' : 'text-[var(--border-subtle)]'"
                    fill="currentColor" viewBox="0 0 24 24"
                  >
                    <path d="M7 14l5-5 5 5z" />
                  </svg>
                  <svg
                    class="w-3 h-3"
                    :class="getSortIcon(String(col.key)) === 'desc' ? 'text-indigo-400' : 'text-[var(--border-subtle)]'"
                    fill="currentColor" viewBox="0 0 24 24"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-[var(--border-subtle)]">
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="i" class="bg-[var(--bg-card)]">
              <td v-if="selectable" class="px-4 py-3">
                <AppSkeleton width="16px" height="16px" rounded="sm" />
              </td>
              <td v-for="col in columns" :key="String(col.key)" class="px-4 py-3">
                <AppSkeleton :width="col.width ?? '80%'" height="14px" />
              </td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else-if="data.length">
            <tr
              v-for="row in data"
              :key="rowId(row)"
              class="bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors duration-100 cursor-pointer"
              :class="isSelected(row) ? 'ring-1 ring-inset ring-indigo-500/40 bg-indigo-500/5' : ''"
              @click="emit('row-click', row)"
            >
              <td v-if="selectable" class="px-4 py-3" @click.stop>
                <input
                  type="checkbox"
                  :checked="isSelected(row)"
                  class="rounded border-[var(--border-subtle)] bg-[var(--bg-card)] text-indigo-500 focus:ring-indigo-500"
                  @change="handleSelect(rowId(row))"
                />
              </td>
              <td
                v-for="col in columns"
                :key="String(col.key)"
                :class="[
                  'px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
                ]"
              >
                <slot :name="col.key" :row="row" :value="cellValue(row, col.key)">
                  {{ col.formatter ? col.formatter(cellValue(row, col.key)) : String(cellValue(row, col.key) ?? '-') }}
                </slot>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-4 py-16 text-center">
              <slot name="empty">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-10 h-10 text-[var(--border-subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p class="font-medium text-[var(--text-secondary)]">{{ emptyTitle }}</p>
                  <p v-if="emptyDescription" class="text-sm text-[var(--text-muted)]">{{ emptyDescription }}</p>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <AppPagination
      v-if="totalItems > pageSize"
      :total-items="totalItems"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-pages="totalPages"
      @page-change="emit('page-change', $event)"
      @page-size-change="emit('page-size-change', $event)"
    />
  </div>
</template>
