<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-base)] flex">
    <!-- Left: Brand panel (hidden on mobile) -->
    <div class="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden">
      <!-- Background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-[var(--bg-base)] to-[var(--bg-base)]" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent" />

      <!-- Grid pattern overlay -->
      <div
        class="absolute inset-0 opacity-[0.03]"
        style="background-image: linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px); background-size: 32px 32px"
      />

      <!-- Content -->
      <div class="relative">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span class="text-xl font-bold text-[var(--text-primary)]">iFinance</span>
        </div>
      </div>

      <div class="relative space-y-6">
        <div>
          <h1 class="text-4xl font-bold text-[var(--text-primary)] leading-tight">
            Simulações financeiras<br />
            <span class="text-indigo-400">profissionais</span>
          </h1>
          <p class="mt-4 text-lg text-[var(--text-secondary)]">
            Plataforma completa para simulação de financiamentos, análise de investimentos e cálculo de indicadores financeiros.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/60 p-4">
            <div class="text-2xl font-bold text-indigo-400">5</div>
            <div class="text-sm text-[var(--text-muted)]">Sistemas de amortização</div>
          </div>
          <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/60 p-4">
            <div class="text-2xl font-bold text-emerald-400">7</div>
            <div class="text-sm text-[var(--text-muted)]">Tipos de investimentos</div>
          </div>
          <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/60 p-4">
            <div class="text-2xl font-bold text-amber-400">5</div>
            <div class="text-sm text-[var(--text-muted)]">Índices econômicos (BCB)</div>
          </div>
          <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/60 p-4">
            <div class="text-2xl font-bold text-rose-400">∞</div>
            <div class="text-sm text-[var(--text-muted)]">Simulações ilimitadas</div>
          </div>
        </div>
      </div>

      <div class="relative">
        <p class="text-sm text-[var(--text-muted)]">
          © {{ new Date().getFullYear() }} iFinance. Todos os direitos reservados.
        </p>
      </div>
    </div>

    <!-- Right: Auth form -->
    <div class="flex flex-1 items-center justify-center p-8">
      <div class="w-full max-w-sm">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8 justify-center">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span class="text-xl font-bold text-[var(--text-primary)]">iFinance</span>
        </div>

        <slot />
      </div>
    </div>
  </div>
</template>
