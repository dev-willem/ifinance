import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import httpClient from '@/services/http/client'
import type { User } from '@/types'

// Module-level cache: survives re-renders, deduplicates concurrent calls
let _initPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const userName = computed(() => user.value?.name ?? '')
  const userEmail = computed(() => user.value?.email ?? '')
  const userPicture = computed(() => user.value?.picture ?? '')

  async function fetchCurrentUser(): Promise<void> {
    loading.value = true
    try {
      const res = await httpClient.get<User>('/api/v1/users/me')
      user.value = res.data
    } catch {
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  /**
   * Idempotent init — safe to call multiple times.
   * Returns the same in-flight promise if already running,
   * or resolves immediately if already initialized.
   * This prevents duplicate /users/me requests from the router guard.
   */
  function init(): Promise<void> {
    if (initialized.value) return Promise.resolve()
    if (_initPromise) return _initPromise
    _initPromise = fetchCurrentUser().finally(() => {
      _initPromise = null
    })
    return _initPromise
  }

  async function logout(): Promise<void> {
    try {
      await httpClient.post('/logout')
    } finally {
      user.value = null
      initialized.value = false
      _initPromise = null
    }
  }

  function setUser(u: User | null) {
    user.value = u
    initialized.value = true
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    userName,
    userEmail,
    userPicture,
    init,
    fetchCurrentUser,
    logout,
    setUser,
  }
})