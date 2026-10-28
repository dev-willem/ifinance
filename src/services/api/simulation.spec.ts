import { beforeEach, describe, expect, it, vi } from 'vitest'
import { simulationApi } from './simulation'
import { AmortizationSystem, Periodicity, RateType, type SimulationRequest } from '@/types'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../http/client', () => ({ default: http }))

const request: SimulationRequest = {
  name: 'Financiamento',
  amortizationSystem: AmortizationSystem.SAC,
  principal: 100_000,
  interestRate: 0.01,
  rateType: RateType.EFFECTIVE,
  term: 120,
  periodicity: Periodicity.MONTHLY,
  cetEnabled: false,
  inflationCorrectionEnabled: false,
}

describe('simulationApi', () => {
  beforeEach(() => {
    http.get.mockReset()
    http.post.mockReset()
  })

  it('create posts the request and unwraps data', async () => {
    http.post.mockResolvedValue({ data: { id: 'sim-1' } })
    await expect(simulationApi.create(request)).resolves.toEqual({ id: 'sim-1' })
    expect(http.post).toHaveBeenCalledWith('/api/v1/simulations', request)
  })

  it('getById hits the resource url', async () => {
    http.get.mockResolvedValue({ data: { id: 'abc' } })
    await expect(simulationApi.getById('abc')).resolves.toEqual({ id: 'abc' })
    expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/abc')
  })

  describe('getHistory', () => {
    it('sends default paging params', async () => {
      http.get.mockResolvedValue({ data: { simulations: [], total: 0, page: 0, size: 10 } })
      await simulationApi.getHistory()
      expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/history', { params: { page: 0, size: 10 } })
    })

    it('adapts the backend shape to PaginatedResponse', async () => {
      const items = [{ id: '1' }, { id: '2' }]
      http.get.mockResolvedValue({ data: { simulations: items, total: 25, page: 1, size: 10 } })

      // 25 items / 10 per page = 3 pages; page 1 is the middle one
      await expect(simulationApi.getHistory(1, 10)).resolves.toEqual({
        content: items,
        totalElements: 25,
        totalPages: 3,
        number: 1,
        size: 10,
        first: false,
        last: false,
      })
      expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/history', { params: { page: 1, size: 10 } })
    })

    it('flags first and last pages', async () => {
      http.get.mockResolvedValue({ data: { simulations: [], total: 20, page: 1, size: 10 } })
      const last = await simulationApi.getHistory(1, 10)
      expect(last).toMatchObject({ totalPages: 2, first: false, last: true })

      http.get.mockResolvedValue({ data: { simulations: [], total: 0, page: 0, size: 10 } })
      const empty = await simulationApi.getHistory(0, 10)
      expect(empty).toMatchObject({ totalPages: 0, first: true, last: true })
    })
  })

  it('compare joins ids into a comma-separated param', async () => {
    http.get.mockResolvedValue({ data: [] })
    await simulationApi.compare(['a', 'b', 'c'])
    expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/compare', { params: { ids: 'a,b,c' } })
  })

  it('exportSimulation requests a blob in the given format', async () => {
    const blob = new Blob(['pdf'])
    http.get.mockResolvedValue({ data: blob })
    await expect(simulationApi.exportSimulation('abc', 'xlsx')).resolves.toBe(blob)
    expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/abc/export', {
      params: { format: 'xlsx' },
      responseType: 'blob',
    })
  })

  it('getPrepayment sends the period param', async () => {
    http.get.mockResolvedValue({ data: {} })
    await simulationApi.getPrepayment('abc', 12)
    expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/abc/prepayment', { params: { period: 12 } })
  })

  it('snapshots are listed and created under the simulation', async () => {
    http.get.mockResolvedValue({ data: [] })
    http.post.mockResolvedValue({ data: { id: 's1', name: 'v1' } })

    await simulationApi.getSnapshots('abc')
    expect(http.get).toHaveBeenCalledWith('/api/v1/simulations/abc/snapshots')

    await expect(simulationApi.createSnapshot('abc', 'v1')).resolves.toEqual({ id: 's1', name: 'v1' })
    expect(http.post).toHaveBeenCalledWith('/api/v1/simulations/abc/snapshots', { name: 'v1' })
  })

  it('propagates http errors', async () => {
    const err = new Error('boom')
    http.get.mockRejectedValue(err)
    await expect(simulationApi.getById('x')).rejects.toBe(err)
  })
})
