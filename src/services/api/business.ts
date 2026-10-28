import axios from 'axios'
import httpClient from '../http/client'
import type {
  IncomeStatementRequest,
  IncomeStatementResponse,
  BreakEvenRequest,
  BreakEvenResponse,
  MarkupRequest,
  MarkupResponse,
} from '@/types/business'

const BASE = '/api/v1/business'

export const businessApi = {
  async incomeStatement(data: IncomeStatementRequest): Promise<IncomeStatementResponse> {
    const res = await httpClient.post<IncomeStatementResponse>(`${BASE}/income-statement`, data)
    return res.data
  },

  async breakEven(data: BreakEvenRequest): Promise<BreakEvenResponse> {
    const res = await httpClient.post<BreakEvenResponse>(`${BASE}/break-even`, data)
    return res.data
  },

  async markup(data: MarkupRequest): Promise<MarkupResponse> {
    const res = await httpClient.post<MarkupResponse>(`${BASE}/markup`, data)
    return res.data
  },
}

/** Backend 400/422 bodies carry a pt-BR `message`; fall back for network/unknown errors. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}
