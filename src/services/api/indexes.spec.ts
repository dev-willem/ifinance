import { beforeEach, describe, expect, it, vi } from 'vitest'
import { indexesApi } from './indexes'
import { EconomicIndex } from '@/types'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../http/client', () => ({ default: http }))

function rate(index: string) {
  return { index, annualRate: 0.1, referenceDate: '2026-10-01', isProjection: false }
}

describe('indexesApi', () => {
  beforeEach(() => {
    http.get.mockReset()
    http.get.mockImplementation((url: string) => Promise.resolve({ data: rate(url.split('/')[4]) }))
  })

  it('getCurrent hits the index endpoint', async () => {
    await expect(indexesApi.getCurrent(EconomicIndex.IPCA)).resolves.toEqual(rate('IPCA'))
    expect(http.get).toHaveBeenCalledWith('/api/v1/indexes/IPCA/current')
  })

  it('getAllCurrent returns all five indexes in priority order', async () => {
    const all = await indexesApi.getAllCurrent()
    expect(all.map((r) => r.index)).toEqual(['CDI', 'IPCA', 'SELIC', 'TR', 'IGP_M'])
    expect(http.get).toHaveBeenCalledTimes(5)
  })

  it('getAllCurrent waits for the priority batch before requesting the secondary one', async () => {
    const pending: Array<() => void> = []
    http.get.mockImplementation(
      (url: string) => new Promise((resolve) => pending.push(() => resolve({ data: rate(url.split('/')[4]) }))),
    )

    const result = indexesApi.getAllCurrent()
    await Promise.resolve()
    expect(http.get.mock.calls.map(([url]) => url)).toEqual([
      '/api/v1/indexes/CDI/current',
      '/api/v1/indexes/IPCA/current',
      '/api/v1/indexes/SELIC/current',
    ])

    pending.splice(0).forEach((resolve) => resolve())
    await vi.waitFor(() => expect(http.get).toHaveBeenCalledTimes(5))
    pending.splice(0).forEach((resolve) => resolve())

    await expect(result).resolves.toHaveLength(5)
  })

  it('getAllCurrent rejects if any index fails', async () => {
    http.get.mockRejectedValueOnce(new Error('CDI indisponível'))
    await expect(indexesApi.getAllCurrent()).rejects.toThrow('CDI indisponível')
  })
})
