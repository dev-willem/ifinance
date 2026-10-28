<template>
  <p class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-[var(--text-secondary)]">
    <strong class="text-amber-400">Estimativa.</strong>
    Valores calculados com as tabelas oficiais de INSS e IRRF do ano selecionado, sem considerar convenções
    coletivas, adicionais, faltas ou outras verbas. Confira sempre com o holerite ou o TRCT do empregador.
    <slot />
  </p>
</template>
