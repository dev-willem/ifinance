import httpClient from '../http/client'
import type {
  InvestmentRequest,
  InvestmentResponse,
  InvestmentListItem,
  PaginatedResponse,
} from '@/types'

const BASE = '/api/v1/investments'

interface InvestmentHistoryResponse {
  investments: InvestmentListItem[]
  total: number
  page: number
  size: number
}

export const investmentApi = {
  async create(data: InvestmentRequest): Promise<InvestmentResponse> {
    const res = await httpClient.post<InvestmentResponse>(BASE, data)
    return res.data
  },

  async getById(id: string): Promise<InvestmentResponse> {
    const res = await httpClient.get<InvestmentResponse>(`${BASE}/${id}`)
    return res.data
  },

  async getHistory(page = 0, size = 10): Promise<PaginatedResponse<InvestmentListItem>> {
    const res = await httpClient.get<InvestmentHistoryResponse>(
      `${BASE}/history`,
      { params: { page, size } },
    )
    const { investments, total, page: p, size: s } = res.data
    return {
      content: investments,
      totalElements: total,
      totalPages: Math.ceil(total / s),
      number: p,
      size: s,
      first: p === 0,
      last: p >= Math.ceil(total / s) - 1,
    }
  },

  async compare(ids: string[]): Promise<InvestmentResponse[]> {
    const res = await httpClient.get<InvestmentResponse[]>(`${BASE}/compare`, {
      params: { ids: ids.join(',') },
    })
    return res.data
  },
}
