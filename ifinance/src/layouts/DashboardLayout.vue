<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import TopBar from './components/TopBar.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const collapsed = computed(() => ui.sidebarCollapsed)
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-base)]">
    <Sidebar />

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="ui.mobileSidebarOpen"
        class="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
        @click="ui.closeMobileSidebar()"
      />
    </Transition>

    <!-- Main content area -->
    <div
      :class="[
        'min-h-screen flex flex-col transition-all duration-300',
        collapsed ? 'lg:pl-16' : 'lg:pl-[260px]',
      ]"
    >
      <TopBar />

      <main class="flex-1 pt-16">
        <div class="px-6 py-6">
          <Transition name="page" mode="out-in">
            <slot />
          </Transition>
        </div>
      </main>
    </div>
  </div>
</template>
