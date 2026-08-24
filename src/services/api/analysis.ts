import httpClient from '../http/client'
import type { AnalysisRequest, AnalysisResponse } from '@/types'

const BASE = '/api/v1/analysis'

export const analysisApi = {
  async analyze(data: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await httpClient.post<AnalysisResponse>(BASE, data)
    return res.data
  },
}
