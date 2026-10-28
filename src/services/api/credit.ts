import httpClient from '../http/client'
import type {
  CreditCapacityRequest,
  CreditCapacityResponse,
  DiscountRequest,
  DiscountResponse,
} from '@/types/credit'

const BASE = '/api/v1/credit'

export const creditApi = {
  async capacity(data: CreditCapacityRequest): Promise<CreditCapacityResponse> {
    const res = await httpClient.post<CreditCapacityResponse>(`${BASE}/capacity`, data)
    return res.data
  },

  async discount(data: DiscountRequest): Promise<DiscountResponse> {
    const res = await httpClient.post<DiscountResponse>(`${BASE}/discount`, data)
    return res.data
  },
}
