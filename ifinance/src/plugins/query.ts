import { QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados considerados frescos por 2 minutos — sem refetch nesse período
      staleTime: 2 * 60 * 1000,
      // Cache mantido por 10 minutos após o componente desmontar
      // Permite navegação rápida de volta sem re-fetch
      gcTime: 10 * 60 * 1000,
      // Só 1 retry para não segurar o usuário em erros reais
      retry: 1,
      retryDelay: 1000,
      // Não refetch ao focar janela — evita requisições desnecessárias
      refetchOnWindowFocus: false,
      // Não refetch ao reconectar — usa cache existente
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
