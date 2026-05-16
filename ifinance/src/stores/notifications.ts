import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TOAST_DURATION } from '@/core/constants'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration: number
  persistent?: boolean
}

export const useNotificationsStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([])

  function add(toast: Omit<Toast, 'id'>): string {
    const id = crypto.randomUUID()
    toasts.value.push({ ...toast, id })

    if (!toast.persistent) {
      setTimeout(() => remove(id), toast.duration ?? TOAST_DURATION)
    }

    return id
  }

  function remove(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function clear() {
    toasts.value = []
  }

  function success(title: string, message?: string) {
    return add({ type: 'success', title, message, duration: TOAST_DURATION })
  }

  function error(title: string, message?: string) {
    return add({ type: 'error', title, message, duration: TOAST_DURATION + 2000 })
  }

  function warning(title: string, message?: string) {
    return add({ type: 'warning', title, message, duration: TOAST_DURATION })
  }

  function info(title: string, message?: string) {
    return add({ type: 'info', title, message, duration: TOAST_DURATION })
  }

  return {
    toasts,
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info,
  }
})
