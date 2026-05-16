<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

onClickOutside(menuRef, () => {
  open.value = false
})

async function handleLogout() {
  open.value = false
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--bg-card-hover)] transition-colors"
      @click="open = !open"
    >
      <div
        v-if="auth.userPicture"
        class="h-7 w-7 rounded-full overflow-hidden ring-2 ring-[var(--border-subtle)]"
      >
        <img :src="auth.userPicture" :alt="auth.userName" class="h-full w-full object-cover" />
      </div>
      <div
        v-else
        class="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-[var(--border-subtle)]"
      >
        {{ auth.userName.charAt(0).toUpperCase() || 'U' }}
      </div>
      <svg
        class="w-4 h-4 text-[var(--text-muted)] transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="scale">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl py-1 z-50"
      >
        <div class="px-4 py-3 border-b border-[var(--border-subtle)]">
          <p class="text-sm font-medium text-[var(--text-primary)] truncate">{{ auth.userName }}</p>
          <p class="text-xs text-[var(--text-muted)] truncate">{{ auth.userEmail }}</p>
        </div>

        <div class="py-1">
          <button
            class="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
            @click="handleLogout"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
