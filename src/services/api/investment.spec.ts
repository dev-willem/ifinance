import { beforeEach, describe, expect, it, vi } from 'vitest'
import { investmentApi } from './investment'
import { InvestmentType, RateBasis, type InvestmentRequest } from '@/types'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../http/client', () => ({ default: http }))

const request: InvestmentRequest = {
  name: 'CDB 110%',
  investmentType: InvestmentType.CDB,
  rateBasis: RateBasis.CDI_PERCENT,
  rateValue: 110,
  principal: 10_000,
  termDays: 365,
  startDate: '2026-01-02',
}

describe('investmentApi', () => {
  beforeEach(() => {
    http.get.mockReset()
    http.post.mockReset()
  })

  it('create posts the request and unwraps data', async () => {
    http.post.mockResolvedValue({ data: { id: 'inv-1' } })
    await expect(investmentApi.create(request)).resolves.toEqual({ id: 'inv-1' })
    expect(http.post).toHaveBeenCalledWith('/api/v1/investments', request)
  })

  it('getById hits the resource url', async () => {
    http.get.mockResolvedValue({ data: { id: 'x' } })
    await investmentApi.getById('x')
    expect(http.get).toHaveBeenCalledWith('/api/v1/investments/x')
  })

  it('getHistory adapts the backend shape to PaginatedResponse', async () => {
    const items = [{ id: '1' }]
    http.get.mockResolvedValue({ data: { investments: items, total: 11, page: 0, size: 5 } })

    // 11 items / 5 per page = 3 pages
    await expect(investmentApi.getHistory(0, 5)).resolves.toEqual({
      content: items,
      totalElements: 11,
      totalPages: 3,
      number: 0,
      size: 5,
      first: true,
      last: false,
    })
    expect(http.get).toHaveBeenCalledWith('/api/v1/investments/history', { params: { page: 0, size: 5 } })
  })

  it('getHistory flags the last page', async () => {
    http.get.mockResolvedValue({ data: { investments: [], total: 11, page: 2, size: 5 } })
    await expect(investmentApi.getHistory(2, 5)).resolves.toMatchObject({ first: false, last: true })
  })

  it('compare joins ids into a comma-separated param', async () => {
    http.get.mockResolvedValue({ data: [] })
    await investmentApi.compare(['a', 'b'])
    expect(http.get).toHaveBeenCalledWith('/api/v1/investments/compare', { params: { ids: 'a,b' } })
  })
})
