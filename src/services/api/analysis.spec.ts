import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analysisApi } from './analysis'
import type { AnalysisRequest } from '@/types'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../http/client', () => ({ default: http }))

describe('analysisApi', () => {
  beforeEach(() => {
    http.post.mockReset()
  })

  it('analyze posts cash flows and unwraps data', async () => {
    const req: AnalysisRequest = { cashFlows: [-1000, 500, 600], discountRate: 0.1 }
    http.post.mockResolvedValue({ data: { npv: 41.32 } })

    await expect(analysisApi.analyze(req)).resolves.toEqual({ npv: 41.32 })
    expect(http.post).toHaveBeenCalledWith('/api/v1/analysis', req)
  })
})
