<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

// "/" mostra o login para quem não está autenticado, sem mudar a URL
const DashboardPage = defineAsyncComponent(() => import('@/pages/dashboard/DashboardPage.vue'))
const LoginPage = defineAsyncComponent(() => import('@/pages/auth/LoginPage.vue'))

const auth = useAuthStore()
</script>

<template>
  <DashboardPage v-if="auth.isAuthenticated" />
  <LoginPage v-else />
</template>
