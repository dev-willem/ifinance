import httpClient from '../http/client'
import type { MonteCarloRequest, MonteCarloResponse } from '@/types/monteCarlo'

const BASE = '/api/v1'

export const monteCarloApi = {
  async simulate(data: MonteCarloRequest): Promise<MonteCarloResponse> {
    const res = await httpClient.post<MonteCarloResponse>(`${BASE}/risk/monte-carlo`, data)
    return res.data
  },
}
