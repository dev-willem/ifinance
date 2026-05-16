<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { setupInterceptors } from '@/services/http/interceptors/error'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppToast from '@/components/ui/AppToast.vue'
import type { Component } from 'vue'

const route = useRoute()
const router = useRouter()
const notifications = useNotificationsStore()
const auth = useAuthStore()

setupInterceptors()

const layout = computed(() => route.meta.layout ?? 'dashboard')

onMounted(() => {
  window.addEventListener('auth:logout', () => {
    auth.setUser(null)
    router.push('/login')
  })
})
</script>

<template>
  <!-- Toast notification stack -->
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 max-h-[calc(100vh-3rem)] overflow-hidden pointer-events-none">
    <div class="pointer-events-auto flex flex-col gap-3">
      <TransitionGroup
        enter-active-class="animate-slide-in-right"
        leave-active-class="animate-fade-out"
      >
        <AppToast
          v-for="toast in notifications.toasts"
          :key="toast.id"
          :toast="toast"
          @close="notifications.remove($event)"
        />
      </TransitionGroup>
    </div>
  </div>

  <!-- Layout router -->
  <RouterView v-slot="{ Component: PageComponent }">
    <template v-if="PageComponent">
      <Transition name="page" mode="out-in">
        <DashboardLayout v-if="layout === 'dashboard'" :key="route.path">
          <component :is="PageComponent as Component" />
        </DashboardLayout>
        <AuthLayout v-else-if="layout === 'auth'" :key="route.path">
          <component :is="PageComponent as Component" />
        </AuthLayout>
        <component :is="PageComponent as Component" v-else :key="route.path" />
      </Transition>
    </template>
  </RouterView>
</template>
