import httpClient from '../http/client'
import type {
  AssetClass,
  DepreciationCompareRequest,
  DepreciationRequest,
  DepreciationResponse,
} from '@/types/depreciation'

const BASE = '/api/v1/business/depreciation'

export const depreciationApi = {
  async calculate(data: DepreciationRequest): Promise<DepreciationResponse> {
    const res = await httpClient.post<DepreciationResponse>(BASE, data)
    return res.data
  },

  async compare(data: DepreciationCompareRequest): Promise<DepreciationResponse[]> {
    const res = await httpClient.post<DepreciationResponse[]>(`${BASE}/compare`, data)
    return res.data
  },

  async assetClasses(): Promise<AssetClass[]> {
    const res = await httpClient.get<AssetClass[]>(`${BASE}/asset-classes`)
    return res.data
  },
}
