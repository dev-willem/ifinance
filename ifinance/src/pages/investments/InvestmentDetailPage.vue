<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { investmentApi } from '@/services/api/investment'
import { useFormatBR } from '@/composables/useFormatBR'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { TAX_EXEMPT_INVESTMENTS } from '@/core/constants'
import type { InvestmentType } from '@/types'

const route = useRoute()
const router = useRouter()
const { formatCurrency, formatPercent, formatDate } = useFormatBR()

const id = route.params['id'] as string

const { data: investment, isLoading, error } = useQuery({
  queryKey: ['investments', id],
  queryFn: () => investmentApi.getById(id),
})

const isExempt = (type: string) => TAX_EXEMPT_INVESTMENTS.includes(type as InvestmentType)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        class="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-colors"
        @click="router.back()"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <AppSkeleton v-if="isLoading" width="200px" height="28px" />
        <h1 v-else class="text-2xl font-bold text-[var(--text-primary)]">{{ investment?.name }}</h1>
        <AppSkeleton v-if="isLoading" width="120px" height="16px" class="mt-1" />
        <p v-else class="text-sm text-[var(--text-muted)]">Criado em {{ formatDate(investment?.createdAt) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppSkeleton v-for="i in 4" :key="i" height="80px" rounded="lg" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-sm text-rose-400">
      Erro ao carregar investimento.
    </div>

    <!-- Content -->
    <template v-else-if="investment">
      <!-- Key metrics -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Capital Investido</p>
          <p class="text-xl font-bold text-[var(--text-primary)] mt-1">{{ formatCurrency(investment.principal) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Rendimento Bruto</p>
          <p class="text-xl font-bold text-emerald-400 mt-1">+{{ formatCurrency(investment.grossReturn) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">Rendimento Líquido</p>
          <p class="text-xl font-bold text-emerald-500 mt-1">+{{ formatCurrency(investment.netReturn) }}</p>
        </AppCard>
        <AppCard>
          <p class="text-xs text-[var(--text-muted)]">IR Retido</p>
          <p class="text-xl font-bold text-amber-400 mt-1">{{ investment.isTaxExempt ? 'Isento' : formatCurrency(investment.irAmount) }}</p>
        </AppCard>
      </div>

      <!-- Details row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Parameters -->
        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Parâmetros</h2>
            <AppBadge tone="info" variant="subtle">{{ investment.investmentType }}</AppBadge>
          </template>
          <div class="divide-y divide-[var(--border-subtle)] -mx-5">
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Base da taxa</span>
              <span class="font-medium text-[var(--text-primary)]">{{ investment.rateBasis }}</span>
            </div>
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Taxa contratada</span>
              <span class="font-medium text-[var(--text-primary)]">{{ investment.rateValue }}%</span>
            </div>
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Prazo</span>
              <span class="font-medium text-[var(--text-primary)]">{{ investment.termDays }} dias</span>
            </div>
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">Data de início</span>
              <span class="font-medium text-[var(--text-primary)]">{{ formatDate(investment.startDate) }}</span>
            </div>
            <div class="flex justify-between px-5 py-2.5 text-sm">
              <span class="text-[var(--text-muted)]">IR</span>
              <AppBadge :tone="investment.isTaxExempt ? 'success' : 'warning'" variant="subtle">
                {{ investment.isTaxExempt ? 'Isento' : formatPercent(investment.irRate * 100) }}
              </AppBadge>
            </div>
          </div>
        </AppCard>

        <!-- Return breakdown -->
        <AppCard>
          <template #header>
            <h2 class="text-sm font-semibold text-[var(--text-secondary)]">Composição do Retorno</h2>
          </template>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1.5 text-sm">
                <span class="text-[var(--text-muted)]">Rendimento bruto</span>
                <span class="text-emerald-400 font-medium">{{ formatCurrency(investment.grossReturn) }}</span>
              </div>
              <div class="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" style="width: 100%" />
              </div>
            </div>
            <div v-if="!investment.isTaxExempt">
              <div class="flex justify-between mb-1.5 text-sm">
                <span class="text-[var(--text-muted)]">IR ({{ formatPercent(investment.irRate * 100) }})</span>
                <span class="text-amber-400 font-medium">-{{ formatCurrency(investment.irAmount) }}</span>
              </div>
              <div class="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  class="h-full bg-amber-500 rounded-full"
                  :style="{ width: `${(investment.irAmount / investment.grossReturn) * 100}%` }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-1.5 text-sm">
                <span class="text-[var(--text-muted)]">Rendimento líquido</span>
                <span class="text-emerald-500 font-bold">{{ formatCurrency(investment.netReturn) }}</span>
              </div>
              <div class="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  class="h-full bg-emerald-400 rounded-full"
                  :style="{ width: `${(investment.netReturn / investment.grossReturn) * 100}%` }"
                />
              </div>
            </div>

            <div class="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-[var(--text-muted)]">Taxa Bruta a.a.</p>
                <p class="text-base font-bold text-emerald-400">{{ formatPercent(investment.grossAnnualRate * 100) }}</p>
              </div>
              <div>
                <p class="text-xs text-[var(--text-muted)]">Taxa Líquida a.a.</p>
                <p class="text-base font-bold text-emerald-500">{{ formatPercent(investment.netAnnualRate * 100) }}</p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>
