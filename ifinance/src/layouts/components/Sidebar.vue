<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { NAV_ITEMS } from '@/core/constants'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()

const collapsed = computed(() => ui.sidebarCollapsed)

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300',
      'border-r border-[var(--border-subtle)] bg-[var(--bg-card)]',
      collapsed ? 'w-16' : 'w-[260px]',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center border-b border-[var(--border-subtle)] px-4">
      <router-link to="/" class="flex items-center gap-3 overflow-hidden">
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg gradient-primary">
          <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span v-if="!collapsed" class="text-base font-bold text-[var(--text-primary)] truncate">iFinance</span>
      </router-link>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <div v-for="section in NAV_ITEMS" :key="section.section" class="mb-6">
        <p
          v-if="!collapsed"
          class="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {{ section.section }}
        </p>
        <div class="flex flex-col gap-0.5">
          <router-link
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            :title="collapsed ? item.label : undefined"
            :class="[
              'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150',
              isActive(item.path)
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]',
              collapsed ? 'justify-center' : '',
            ]"
          >
            <!-- Icons using SVG paths based on icon name -->
            <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <!-- LayoutDashboard -->
              <svg v-if="item.icon === 'LayoutDashboard'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
              </svg>
              <!-- Calculator -->
              <svg v-else-if="item.icon === 'Calculator'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <!-- Plus -->
              <svg v-else-if="item.icon === 'Plus'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <!-- GitCompare -->
              <svg v-else-if="item.icon === 'GitCompare'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 21V9a9 9 0 009 9" />
              </svg>
              <!-- TrendingUp -->
              <svg v-else-if="item.icon === 'TrendingUp'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <!-- BarChart3 -->
              <svg v-else-if="item.icon === 'BarChart3'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M8 16V10m4 6V4m4 12V8" />
              </svg>
              <!-- Zap -->
              <svg v-else-if="item.icon === 'Zap'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <!-- Flame -->
              <svg v-else-if="item.icon === 'Flame'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
              <!-- Shield -->
              <svg v-else-if="item.icon === 'Shield'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" class="w-[18px] h-[18px]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Bottom section -->
    <div class="border-t border-[var(--border-subtle)] p-3 flex flex-col gap-2">
      <!-- Theme toggle -->
      <button
        :class="[
          'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all',
          collapsed ? 'justify-center' : '',
        ]"
        :title="collapsed ? (ui.theme === 'dark' ? 'Modo claro' : 'Modo escuro') : undefined"
        @click="ui.toggleTheme()"
      >
        <svg v-if="ui.theme === 'dark'" class="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span v-if="!collapsed">{{ ui.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro' }}</span>
      </button>

      <!-- User info -->
      <div v-if="auth.isAuthenticated" :class="['flex items-center gap-3 rounded-lg px-2.5 py-2', collapsed ? 'justify-center' : '']">
        <div class="h-7 w-7 flex-shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
          {{ auth.userName.charAt(0).toUpperCase() }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-xs font-medium text-[var(--text-secondary)] truncate">{{ auth.userName }}</p>
          <p class="text-xs text-[var(--text-muted)] truncate">{{ auth.userEmail }}</p>
        </div>
        <button
          v-if="!collapsed"
          class="flex-shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
          title="Sair"
          @click="handleLogout"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <!-- Collapse toggle -->
      <button
        :class="[
          'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-secondary)] transition-all',
          collapsed ? 'justify-center' : '',
        ]"
        @click="ui.toggleSidebar()"
      >
        <svg
          :class="['w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300', collapsed ? 'rotate-180' : '']"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span v-if="!collapsed">Recolher</span>
      </button>
    </div>
  </aside>
</template>
