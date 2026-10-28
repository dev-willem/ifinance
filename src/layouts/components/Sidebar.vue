<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Activity,
  BarChart3,
  Calculator,
  Dices,
  FileSpreadsheet,
  Flame,
  Gift,
  GitCompare,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Palmtree,
  Percent,
  Plus,
  Receipt,
  Scale,
  Shield,
  ShieldCheck,
  Tags,
  TrendingDown,
  TrendingUp,
  UserMinus,
  Wallet,
  Zap,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { NAV_ITEMS } from '@/core/constants'

const NAV_ICONS: Record<string, Component> = {
  Activity,
  BarChart3,
  Calculator,
  Dices,
  FileSpreadsheet,
  Flame,
  Gift,
  GitCompare,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Palmtree,
  Percent,
  Plus,
  Receipt,
  Scale,
  Shield,
  ShieldCheck,
  Tags,
  TrendingDown,
  TrendingUp,
  UserMinus,
  Wallet,
  Zap,
}

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()

const collapsed = computed(() => ui.sidebarCollapsed)

const navSections = computed(() =>
  NAV_ITEMS.filter((s) => !('adminOnly' in s && s.adminOnly) || auth.isAdmin),
)

// Only the most specific matching item is highlighted (/simulations/new must not also light up /simulations)
const activePath = computed(() => {
  const paths = NAV_ITEMS.flatMap((s) => s.items.map((i) => i.path as string))
  const matches = paths.filter(
    (p) => route.path === p || (p !== '/' && route.path.startsWith(p + '/')),
  )
  return matches.sort((a, b) => b.length - a.length)[0] ?? null
})

function isActive(path: string): boolean {
  return activePath.value === path
}

async function handleLogout() {
  try {
    await auth.logout()
    router.push('/login')
  } catch {
    // erro já notificado via toast pela store
  }
}
</script>

<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300',
      'border-r border-[var(--border-subtle)] bg-[var(--bg-card)]',
      'lg:translate-x-0',
      ui.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      'w-[260px] max-w-[85vw]',
      collapsed ? 'lg:w-16' : 'lg:w-[260px]',
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
        <span :class="collapsed ? 'lg:hidden' : ''" class="text-base font-bold text-[var(--text-primary)] truncate">iFinance</span>
      </router-link>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <div v-for="section in navSections" :key="section.section" class="mb-6">
        <p
          :class="collapsed ? 'lg:hidden' : ''"
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
              collapsed ? 'lg:justify-center' : '',
            ]"
            @click="ui.closeMobileSidebar()"
          >
            <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <component :is="NAV_ICONS[item.icon]" class="w-[18px] h-[18px]" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <span :class="collapsed ? 'lg:hidden' : ''" class="truncate">{{ item.label }}</span>
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
          collapsed ? 'lg:justify-center' : '',
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
        <span :class="collapsed ? 'lg:hidden' : ''">{{ ui.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro' }}</span>
      </button>

      <!-- User info -->
      <div v-if="auth.isAuthenticated" :class="['flex items-center gap-3 rounded-lg px-2.5 py-2', collapsed ? 'lg:justify-center' : '']">
        <div class="h-7 w-7 flex-shrink-0 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
          {{ auth.userName.charAt(0).toUpperCase() }}
        </div>
        <div :class="collapsed ? 'lg:hidden' : ''" class="flex-1 min-w-0">
          <p class="text-xs font-medium text-[var(--text-secondary)] truncate">{{ auth.userName }}</p>
          <p class="text-xs text-[var(--text-muted)] truncate">{{ auth.userEmail }}</p>
        </div>
        <button
          :class="collapsed ? 'lg:hidden' : ''"
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
          collapsed ? 'lg:justify-center' : '',
        ]"
        @click="ui.toggleSidebar()"
      >
        <svg
          :class="['w-[18px] h-[18px] flex-shrink-0 transition-transform duration-300', collapsed ? 'lg:rotate-180' : '']"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span :class="collapsed ? 'lg:hidden' : ''">Recolher</span>
      </button>
    </div>
  </aside>
</template>
