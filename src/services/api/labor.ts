import httpClient from '../http/client'
import type {
  NetSalaryRequest,
  NetSalaryResponse,
  VacationRequest,
  VacationResponse,
  ThirteenthRequest,
  ThirteenthResponse,
  TerminationRequest,
  TerminationResponse,
} from '@/types/labor'

const BASE = '/api/v1/labor'

export const laborApi = {
  async netSalary(data: NetSalaryRequest): Promise<NetSalaryResponse> {
    const res = await httpClient.post<NetSalaryResponse>(`${BASE}/net-salary`, data)
    return res.data
  },

  async vacation(data: VacationRequest): Promise<VacationResponse> {
    const res = await httpClient.post<VacationResponse>(`${BASE}/vacation`, data)
    return res.data
  },

  async thirteenth(data: ThirteenthRequest): Promise<ThirteenthResponse> {
    const res = await httpClient.post<ThirteenthResponse>(`${BASE}/thirteenth`, data)
    return res.data
  },

  async termination(data: TerminationRequest): Promise<TerminationResponse> {
    const res = await httpClient.post<TerminationResponse>(`${BASE}/termination`, data)
    return res.data
  },
}
