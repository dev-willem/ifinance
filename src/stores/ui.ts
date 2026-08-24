import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'

export type Theme = 'dark' | 'light'

export const useUiStore = defineStore('ui', () => {
  const theme = useStorage<Theme>('ifinance-theme', 'dark')
  const sidebarCollapsed = ref(false)
  const mobileSidebarOpen = ref(false)

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(t: Theme) {
    theme.value = t
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(val: boolean) {
    sidebarCollapsed.value = val
  }

  function toggleMobileSidebar() {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  function closeMobileSidebar() {
    mobileSidebarOpen.value = false
  }

  // Apply theme to document
  watch(
    theme,
    (newTheme) => {
      const html = document.documentElement
      if (newTheme === 'dark') {
        html.classList.add('dark')
        html.classList.remove('light')
      } else {
        html.classList.add('light')
        html.classList.remove('dark')
      }
    },
    { immediate: true },
  )

  return {
    theme,
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileSidebar,
    closeMobileSidebar,
  }
})
