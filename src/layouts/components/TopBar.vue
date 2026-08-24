<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import UserMenu from './UserMenu.vue'

const route = useRoute()
const ui = useUiStore()

const pageTitle = computed(() => route.meta.title ?? 'iFinance')
const collapsed = computed(() => ui.sidebarCollapsed)
</script>

<template>
  <header
    :class="[
      'fixed right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-md px-6 transition-all duration-300',
      collapsed ? 'left-16' : 'left-[260px]',
    ]"
  >
    <!-- Left: Mobile menu + breadcrumb -->
    <div class="flex items-center gap-4">
      <button
        class="lg:hidden rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        @click="ui.toggleMobileSidebar()"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="flex items-center gap-2">
        <h1 class="text-sm font-semibold text-[var(--text-primary)]">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-3">
      <!-- Notifications placeholder -->
      <button class="relative rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>

      <UserMenu />
    </div>
  </header>
</template>
