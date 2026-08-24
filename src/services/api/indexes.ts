import httpClient from '../http/client'
import type { EconomicIndex, IndexRate } from '@/types'

const BASE = '/api/v1/indexes'

export const indexesApi = {
  async getCurrent(index: EconomicIndex): Promise<IndexRate> {
    const res = await httpClient.get<IndexRate>(`${BASE}/${index}/current`)
    return res.data
  },

  /**
   * Busca os índices em dois lotes para não saturar o browser.
   * Prioridade 1: CDI, IPCA, SELIC (mais usados).
   * Prioridade 2: TR, IGP-M (busca após o primeiro lote resolver).
   * Resultado final: todos os 5 índices, mas com impacto de rede escalonado.
   */
  async getAllCurrent(): Promise<IndexRate[]> {
    const priority: EconomicIndex[] = ['CDI', 'IPCA', 'SELIC'] as EconomicIndex[]
    const secondary: EconomicIndex[] = ['TR', 'IGP_M'] as EconomicIndex[]

    const priorityRates = await Promise.all(priority.map((i) => this.getCurrent(i)))
    const secondaryRates = await Promise.all(secondary.map((i) => this.getCurrent(i)))

    return [...priorityRates, ...secondaryRates]
  },
}
