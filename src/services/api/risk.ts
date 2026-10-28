import httpClient from '../http/client'
import type { RiskMetricsRequest, RiskMetricsResponse } from '@/types/risk'

const BASE = '/api/v1/risk'

export const riskApi = {
  async metrics(data: RiskMetricsRequest): Promise<RiskMetricsResponse> {
    const res = await httpClient.post<RiskMetricsResponse>(`${BASE}/metrics`, data)
    return res.data
  },
}
