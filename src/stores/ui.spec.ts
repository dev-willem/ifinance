import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useUiStore } from './ui'

const html = document.documentElement

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    html.className = ''
    setActivePinia(createPinia())
  })

  describe('theme', () => {
    it('defaults to dark and applies the class immediately', () => {
      const ui = useUiStore()
      expect(ui.theme).toBe('dark')
      expect(html.classList.contains('dark')).toBe(true)
      expect(html.classList.contains('light')).toBe(false)
    })

    it('restores the persisted theme', () => {
      localStorage.setItem('ifinance-theme', 'light')
      const ui = useUiStore()
      expect(ui.theme).toBe('light')
      expect(html.classList.contains('light')).toBe(true)
      expect(html.classList.contains('dark')).toBe(false)
    })

    it('toggles, persists and swaps the document class', async () => {
      const ui = useUiStore()
      ui.toggleTheme()
      await nextTick()

      expect(ui.theme).toBe('light')
      expect(localStorage.getItem('ifinance-theme')).toBe('light')
      expect(html.classList.contains('light')).toBe(true)
      expect(html.classList.contains('dark')).toBe(false)

      ui.toggleTheme()
      await nextTick()
      expect(ui.theme).toBe('dark')
      expect(localStorage.getItem('ifinance-theme')).toBe('dark')
      expect(html.classList.contains('dark')).toBe(true)
      expect(html.classList.contains('light')).toBe(false)
    })

    it('setTheme sets an explicit theme', async () => {
      const ui = useUiStore()
      ui.setTheme('light')
      await nextTick()
      expect(ui.theme).toBe('light')
      expect(localStorage.getItem('ifinance-theme')).toBe('light')
    })

    it('new store instances pick up the theme persisted by a previous one', async () => {
      useUiStore().setTheme('light')
      await nextTick()

      setActivePinia(createPinia())
      expect(useUiStore().theme).toBe('light')
    })
  })

  describe('sidebar', () => {
    it('starts expanded and with the mobile drawer closed', () => {
      const ui = useUiStore()
      expect(ui.sidebarCollapsed).toBe(false)
      expect(ui.mobileSidebarOpen).toBe(false)
    })

    it('toggles and sets the collapsed state', () => {
      const ui = useUiStore()
      ui.toggleSidebar()
      expect(ui.sidebarCollapsed).toBe(true)
      ui.toggleSidebar()
      expect(ui.sidebarCollapsed).toBe(false)
      ui.setSidebarCollapsed(true)
      expect(ui.sidebarCollapsed).toBe(true)
    })

    it('toggles and closes the mobile drawer', () => {
      const ui = useUiStore()
      ui.toggleMobileSidebar()
      expect(ui.mobileSidebarOpen).toBe(true)
      ui.closeMobileSidebar()
      expect(ui.mobileSidebarOpen).toBe(false)
      ui.closeMobileSidebar()
      expect(ui.mobileSidebarOpen).toBe(false)
    })
  })
})
