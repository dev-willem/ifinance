import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosAdapter } from 'axios'
import httpClient from '../client'
import { AppError, AuthError, NetworkError, ValidationError, setupInterceptors } from './error'

const originalAdapter = httpClient.defaults.adapter

function respondWith(adapter: AxiosAdapter) {
  httpClient.defaults.adapter = adapter
}

function failWithStatus(status: number, data?: unknown) {
  respondWith((config) =>
    Promise.reject(
      new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, {
        status,
        statusText: '',
        data,
        headers: {},
        config,
      }),
    ),
  )
}

function failWithoutResponse() {
  respondWith((config) => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config, {})))
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (e) {
    return e
  }
  throw new Error('expected request to fail')
}

describe('http error interceptor', () => {
  beforeAll(() => {
    setupInterceptors()
  })

  afterAll(() => {
    httpClient.defaults.adapter = originalAdapter
  })

  it('passes successful responses through untouched', async () => {
    respondWith((config) => Promise.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config }))
    const res = await httpClient.get('/api/v1/anything')
    expect(res.data).toEqual({ ok: true })
  })

  it('maps a missing response to NetworkError with a pt-BR message', async () => {
    failWithoutResponse()
    const err = await caught(httpClient.get('/api/v1/simulations'))
    expect(err).toBeInstanceOf(NetworkError)
    expect((err as NetworkError).message).toBe('Sem conexão com o servidor. Verifique sua internet.')
  })

  it('maps API error bodies to AppError keeping status, code, message and details', async () => {
    failWithStatus(400, { status: 400, code: 'BAD_INPUT', message: 'Prazo inválido', details: { term: 'obrigatório' } })
    const err = await caught(httpClient.post('/api/v1/simulations', {}))

    expect(err).toBeInstanceOf(AppError)
    expect(err).not.toBeInstanceOf(AuthError)
    expect(err).toMatchObject({
      name: 'AppError',
      status: 400,
      code: 'BAD_INPUT',
      message: 'Prazo inválido',
      details: { term: 'obrigatório' },
    })
  })

  it.each([
    [403, 'Acesso negado.'],
    [404, 'Recurso não encontrado.'],
    [409, 'Conflito de dados.'],
    [429, 'Muitas requisições. Aguarde um momento.'],
    [500, 'Erro interno do servidor.'],
    [503, 'Serviço temporariamente indisponível.'],
    [418, 'Erro 418'],
  ])('falls back to a default message for %i without body', async (status, message) => {
    failWithStatus(status)
    const err = await caught(httpClient.get('/api/v1/x'))
    expect(err).toBeInstanceOf(AppError)
    expect(err).toMatchObject({ status, code: 'UNKNOWN_ERROR', message })
  })

  it('maps 422 to ValidationError with field details', async () => {
    failWithStatus(422, { code: 'CALCULATION_ERROR', message: 'Taxa fora do intervalo', details: { rate: 'máx 100%' } })
    const err = await caught(httpClient.post('/api/v1/planning/emergency', {}))

    expect(err).toBeInstanceOf(ValidationError)
    expect(err).toBeInstanceOf(AppError)
    expect(err).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Taxa fora do intervalo',
      details: { rate: 'máx 100%' },
    })
  })

  describe('401 handling', () => {
    let logout: ReturnType<typeof vi.fn>

    beforeEach(() => {
      vi.useFakeTimers()
      logout = vi.fn()
      window.addEventListener('auth:logout', logout)
    })

    afterEach(() => {
      // lets the module-level redirect guard reset between tests
      vi.advanceTimersByTime(2000)
      vi.useRealTimers()
      window.removeEventListener('auth:logout', logout)
    })

    it('maps 401 to AuthError and dispatches auth:logout', async () => {
      failWithStatus(401)
      const err = await caught(httpClient.get('/api/v1/simulations'))

      expect(err).toBeInstanceOf(AuthError)
      expect(err).toMatchObject({ status: 401, code: 'UNAUTHORIZED', message: 'Não autorizado.' })
      expect(logout).toHaveBeenCalledTimes(1)
    })

    it('uses the API message on 401 when present', async () => {
      failWithStatus(401, { message: 'Token expirado' })
      const err = await caught(httpClient.get('/api/v1/simulations'))
      expect((err as AuthError).message).toBe('Token expirado')
    })

    it('does not dispatch auth:logout for the session check endpoint', async () => {
      failWithStatus(401)
      const err = await caught(httpClient.get('/api/v1/users/me'))

      expect(err).toBeInstanceOf(AuthError)
      expect(logout).not.toHaveBeenCalled()
    })

    it('dispatches auth:logout only once for concurrent 401s until the guard resets', async () => {
      failWithStatus(401)
      await Promise.all([
        caught(httpClient.get('/api/v1/a')),
        caught(httpClient.get('/api/v1/b')),
        caught(httpClient.get('/api/v1/c')),
      ])
      expect(logout).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(2000)
      await caught(httpClient.get('/api/v1/d'))
      expect(logout).toHaveBeenCalledTimes(2)
    })
  })
})
