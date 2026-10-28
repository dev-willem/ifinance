import { beforeEach, describe, expect, it, vi } from 'vitest'
import { planningApi } from './planning'
import {
  InvestmentType,
  RateBasis,
  type DirectCompareRequest,
  type EmergencyRequest,
  type RetirementRequest,
} from '@/types'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../http/client', () => ({ default: http }))

describe('planningApi', () => {
  beforeEach(() => {
    http.post.mockReset()
  })

  it('retirement posts to planning/retirement', async () => {
    const req: RetirementRequest = {
      monthlyExpenses: 5000,
      currentSavings: 100_000,
      monthlySavings: 2000,
      expectedAnnualReturn: 0.08,
      withdrawalRate: 0.04,
    }
    http.post.mockResolvedValue({ data: { targetAmount: 1_500_000 } })

    await expect(planningApi.retirement(req)).resolves.toEqual({ targetAmount: 1_500_000 })
    expect(http.post).toHaveBeenCalledWith('/api/v1/planning/retirement', req)
  })

  it('emergency posts to planning/emergency', async () => {
    const req: EmergencyRequest = {
      monthlyExpenses: 4000,
      monthsCoverage: 6,
      currentSavings: 5000,
      monthlySavings: 1000,
      expectedAnnualReturn: 0.1,
    }
    http.post.mockResolvedValue({ data: { targetAmount: 24_000 } })

    await expect(planningApi.emergency(req)).resolves.toEqual({ targetAmount: 24_000 })
    expect(http.post).toHaveBeenCalledWith('/api/v1/planning/emergency', req)
  })

  it('compareDirect posts to investments/compare-direct', async () => {
    const req: DirectCompareRequest = {
      investments: [
        {
          name: 'LCI',
          investmentType: InvestmentType.LCI,
          rateBasis: RateBasis.CDI_PERCENT,
          rateValue: 95,
          principal: 1000,
          termDays: 720,
          startDate: '2026-01-02',
        },
      ],
    }
    http.post.mockResolvedValue({ data: [] })

    await expect(planningApi.compareDirect(req)).resolves.toEqual([])
    expect(http.post).toHaveBeenCalledWith('/api/v1/investments/compare-direct', req)
  })
})
