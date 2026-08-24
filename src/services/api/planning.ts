import httpClient from '../http/client'
import type {
  RetirementRequest,
  RetirementResponse,
  EmergencyRequest,
  EmergencyResponse,
  DirectCompareRequest,
  DirectCompareItem,
} from '@/types'

const BASE = '/api/v1'

export const planningApi = {
  async retirement(data: RetirementRequest): Promise<RetirementResponse> {
    const res = await httpClient.post<RetirementResponse>(`${BASE}/planning/retirement`, data)
    return res.data
  },

  async emergency(data: EmergencyRequest): Promise<EmergencyResponse> {
    const res = await httpClient.post<EmergencyResponse>(`${BASE}/planning/emergency`, data)
    return res.data
  },

  async compareDirect(data: DirectCompareRequest): Promise<DirectCompareItem[]> {
    const res = await httpClient.post<DirectCompareItem[]>(`${BASE}/investments/compare-direct`, data)
    return res.data
  },
}
