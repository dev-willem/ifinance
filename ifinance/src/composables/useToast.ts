import { useNotificationsStore } from '@/stores/notifications'

export function useToast() {
  const notifications = useNotificationsStore()

  return {
    success: notifications.success.bind(notifications),
    error: notifications.error.bind(notifications),
    warning: notifications.warning.bind(notifications),
    info: notifications.info.bind(notifications),
    add: notifications.add.bind(notifications),
    remove: notifications.remove.bind(notifications),
    clear: notifications.clear.bind(notifications),
  }
}
