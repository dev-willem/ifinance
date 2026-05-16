<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
    <div class="text-center space-y-6 px-8">
      <div class="text-8xl font-black text-[var(--border-subtle)]">404</div>
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-primary)]">Página não encontrada</h1>
        <p class="mt-2 text-[var(--text-muted)]">A página que você procura não existe ou foi movida.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        @click="router.push('/')"
      >
        Voltar ao Dashboard
      </button>
    </div>
  </div>
</template>
