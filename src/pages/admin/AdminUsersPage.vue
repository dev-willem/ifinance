<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Users, ShieldCheck, Calculator, TrendingUp } from 'lucide-vue-next'
import { adminApi } from '@/services/api/admin'
import { AppError } from '@/services/http/interceptors/error'
import { useAuthStore } from '@/stores/auth'
import { useFormatBR } from '@/composables/useFormatBR'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/ui/AppButton.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import MetricCard from '@/components/data/MetricCard.vue'
import type { TableColumn } from '@/types'
import type { AdminUser, UserRole } from '@/types/admin'

const auth = useAuthStore()
const queryClient = useQueryClient()
const toast = useToast()
const { formatInt, formatDate } = useFormatBR()

const currentPage = ref(0)
const pageSize = ref(20)

const usersQuery = useQuery({
  queryKey: computed(() => ['admin', 'users', currentPage.value, pageSize.value]),
  queryFn: () => adminApi.listUsers(currentPage.value, pageSize.value),
})

const statsQuery = useQuery({
  queryKey: ['admin', 'stats'],
  queryFn: () => adminApi.stats(),
})

const PROVIDER_LABELS: Record<string, string> = { google: 'Google', github: 'GitHub', local: 'Local' }
const providerLabel = (provider: string) => PROVIDER_LABELS[provider] ?? provider

const columns: TableColumn[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'provider', label: 'Provedor', align: 'center' },
  { key: 'role', label: 'Perfil', align: 'center' },
  { key: 'createdAt', label: 'Cadastro', align: 'center' },
  { key: 'actions', label: 'Ações', align: 'center' },
]

const pending = ref<{ user: AdminUser; role: UserRole } | null>(null)

const isSelf = (user: AdminUser) => user.id === auth.user?.id
const isDemotionLocked = (user: AdminUser) => user.role === 'ADMIN' && (isSelf(user) || user.bootstrapAdmin)

function askRoleChange(user: AdminUser) {
  pending.value = { user, role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' }
}

const { mutate: changeRole, isPending: changing } = useMutation({
  mutationFn: (change: { user: AdminUser; role: UserRole }) => adminApi.changeRole(change.user.id, change.role),
  onSuccess: (updated) => {
    toast.success(
      updated.role === 'ADMIN' ? 'Usuário promovido a administrador' : 'Acesso de administrador removido',
      updated.name,
    )
    pending.value = null
    queryClient.invalidateQueries({ queryKey: ['admin'] })
  },
  onError: (err) => toast.error('Erro ao alterar perfil', err.message),
})

function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 0
}

const loadError = computed(() => {
  const err = usersQuery.error.value ?? statsQuery.error.value
  if (!err) return null
  if (err instanceof AppError && err.status === 403) {
    return 'Seu acesso de administrador não está ativo nesta sessão. Saia e entre novamente.'
  }
  return 'Erro ao carregar os dados administrativos. Tente novamente.'
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Usuários</h1>
      <p class="text-sm text-[var(--text-muted)]">Gerencie perfis de acesso e acompanhe o uso da plataforma</p>
    </div>

    <div
      v-if="loadError"
      role="alert"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400"
    >
      {{ loadError }}
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Usuários"
        :value="statsQuery.data.value ? formatInt(statsQuery.data.value.totalUsers) : null"
        :loading="statsQuery.isLoading.value"
        color="primary"
      >
        <template #icon><Users class="w-5 h-5" aria-hidden="true" /></template>
      </MetricCard>
      <MetricCard
        label="Administradores"
        :value="statsQuery.data.value ? formatInt(statsQuery.data.value.usersByRole.ADMIN ?? 0) : null"
        :loading="statsQuery.isLoading.value"
        color="warning"
      >
        <template #icon><ShieldCheck class="w-5 h-5" aria-hidden="true" /></template>
      </MetricCard>
      <MetricCard
        label="Simulações"
        :value="statsQuery.data.value ? formatInt(statsQuery.data.value.totalSimulations) : null"
        :loading="statsQuery.isLoading.value"
        color="default"
      >
        <template #icon><Calculator class="w-5 h-5" aria-hidden="true" /></template>
      </MetricCard>
      <MetricCard
        label="Investimentos"
        :value="statsQuery.data.value ? formatInt(statsQuery.data.value.totalInvestments) : null"
        :loading="statsQuery.isLoading.value"
        color="success"
      >
        <template #icon><TrendingUp class="w-5 h-5" aria-hidden="true" /></template>
      </MetricCard>
    </div>

    <div v-if="statsQuery.data.value" class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-[var(--text-muted)]">Por provedor:</span>
      <AppBadge
        v-for="(count, provider) in statsQuery.data.value.usersByProvider"
        :key="provider"
        tone="info"
      >
        {{ providerLabel(String(provider)) }} · {{ formatInt(count) }}
      </AppBadge>
    </div>

    <!-- Users -->
    <AppTable
      :columns="columns"
      :data="usersQuery.data.value?.users ?? []"
      :loading="usersQuery.isLoading.value"
      :total-items="usersQuery.data.value?.total ?? 0"
      :current-page="currentPage"
      :page-size="pageSize"
      empty-title="Nenhum usuário encontrado"
      @page-change="currentPage = $event"
      @page-size-change="onPageSizeChange"
    >
      <template #name="{ row }">
        <span class="font-medium text-[var(--text-primary)]">{{ row.name }}</span>
        <span v-if="isSelf(row)" class="ml-1 text-xs text-[var(--text-muted)]">(você)</span>
      </template>

      <template #provider="{ row }">
        {{ providerLabel(row.provider) }}
      </template>

      <template #role="{ row }">
        <AppBadge :tone="row.role === 'ADMIN' ? 'warning' : 'neutral'">
          {{ row.role === 'ADMIN' ? 'Administrador' : 'Usuário' }}
        </AppBadge>
        <span v-if="row.bootstrapAdmin" class="mt-1 block text-xs text-[var(--text-muted)]">
          fixo em APP_ADMIN_EMAILS
        </span>
      </template>

      <template #createdAt="{ row }">
        <span class="text-xs text-[var(--text-muted)]">{{ formatDate(row.createdAt) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex justify-center" @click.stop>
          <AppButton
            size="xs"
            :variant="row.role === 'ADMIN' ? 'ghost' : 'outline'"
            :disabled="isDemotionLocked(row)"
            @click="askRoleChange(row)"
          >
            {{ row.role === 'ADMIN' ? 'Remover admin' : 'Tornar admin' }}
          </AppButton>
        </div>
      </template>
    </AppTable>

    <AppModal
      :open="pending !== null"
      title="Alterar perfil de acesso"
      size="sm"
      @update:open="(open) => { if (!open) pending = null }"
    >
      <div v-if="pending" class="space-y-3 text-sm text-[var(--text-secondary)]">
        <p v-if="pending.role === 'ADMIN'">
          Tornar <strong class="text-[var(--text-primary)]">{{ pending.user.name }}</strong>
          ({{ pending.user.email }}) administrador?
        </p>
        <p v-else>
          Remover o acesso de administrador de
          <strong class="text-[var(--text-primary)]">{{ pending.user.name }}</strong> ({{ pending.user.email }})?
        </p>
        <p class="text-xs text-[var(--text-muted)]">
          {{
            pending.role === 'ADMIN'
              ? 'O novo acesso vale a partir do próximo login do usuário.'
              : 'O acesso administrativo é revogado imediatamente.'
          }}
        </p>
      </div>

      <template #footer>
        <AppButton variant="secondary" :disabled="changing" @click="pending = null">Cancelar</AppButton>
        <AppButton
          :variant="pending?.role === 'USER' ? 'destructive' : 'primary'"
          :loading="changing"
          @click="pending && changeRole(pending)"
        >
          Confirmar
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
