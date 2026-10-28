import httpClient from '../http/client'
import type { SimplesRequest, SimplesResponse, TaxCompareRequest, TaxCompareResponse } from '@/types/tax'

const BASE = '/api/v1/tax'

export const taxApi = {
  async simples(data: SimplesRequest): Promise<SimplesResponse> {
    const res = await httpClient.post<SimplesResponse>(`${BASE}/simples`, data)
    return res.data
  },

  async compare(data: TaxCompareRequest): Promise<TaxCompareResponse> {
    const res = await httpClient.post<TaxCompareResponse>(`${BASE}/compare`, data)
    return res.data
  },
}
