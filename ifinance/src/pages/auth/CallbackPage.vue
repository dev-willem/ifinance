<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  await auth.fetchCurrentUser()
  if (auth.isAuthenticated) {
    router.replace('/')
  } else {
    router.replace('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
    <div class="flex flex-col items-center gap-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary">
        <svg class="h-7 w-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p class="text-sm font-medium text-[var(--text-secondary)]">Autenticando...</p>
    </div>
  </div>
</template>
