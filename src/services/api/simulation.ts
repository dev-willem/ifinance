import httpClient from '../http/client'
import type {
  SimulationRequest,
  SimulationResponse,
  SimulationListItem,
  PaginatedResponse,
  PrepaymentInfo,
  SimulationSnapshot,
} from '@/types'

const BASE = '/api/v1/simulations'

interface SimulationHistoryResponse {
  simulations: SimulationListItem[]
  total: number
  page: number
  size: number
}

export const simulationApi = {
  async create(data: SimulationRequest): Promise<SimulationResponse> {
    const res = await httpClient.post<SimulationResponse>(BASE, data)
    return res.data
  },

  async getById(id: string): Promise<SimulationResponse> {
    const res = await httpClient.get<SimulationResponse>(`${BASE}/${id}`)
    return res.data
  },

  async getHistory(page = 0, size = 10): Promise<PaginatedResponse<SimulationListItem>> {
    const res = await httpClient.get<SimulationHistoryResponse>(
      `${BASE}/history`,
      { params: { page, size } },
    )
    const { simulations, total, page: p, size: s } = res.data
    return {
      content: simulations,
      totalElements: total,
      totalPages: Math.ceil(total / s),
      number: p,
      size: s,
      first: p === 0,
      last: p >= Math.ceil(total / s) - 1,
    }
  },

  async compare(ids: string[]): Promise<SimulationResponse[]> {
    const res = await httpClient.get<SimulationResponse[]>(`${BASE}/compare`, {
      params: { ids: ids.join(',') },
    })
    return res.data
  },

  async exportSimulation(id: string, format: 'pdf' | 'xlsx'): Promise<Blob> {
    const res = await httpClient.get<Blob>(`${BASE}/${id}/export`, {
      params: { format },
      responseType: 'blob',
    })
    return res.data
  },

  async getPrepayment(id: string, period: number): Promise<PrepaymentInfo> {
    const res = await httpClient.get<PrepaymentInfo>(`${BASE}/${id}/prepayment`, {
      params: { period },
    })
    return res.data
  },

  async getSnapshots(id: string): Promise<SimulationSnapshot[]> {
    const res = await httpClient.get<SimulationSnapshot[]>(`${BASE}/${id}/snapshots`)
    return res.data
  },

  async createSnapshot(id: string, name: string): Promise<SimulationSnapshot> {
    const res = await httpClient.post<SimulationSnapshot>(`${BASE}/${id}/snapshots`, { name })
    return res.data
  },
}
