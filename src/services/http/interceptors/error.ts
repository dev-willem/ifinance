import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'
import httpClient from '../client'

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Sem conexão com o servidor. Verifique sua internet.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthError extends AppError {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(401, 'UNAUTHORIZED', message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(422, 'VALIDATION_ERROR', message, details)
    this.name = 'ValidationError'
  }
}

function normalizeError(error: AxiosError): AppError | NetworkError {
  if (!error.response) {
    return new NetworkError()
  }

  const { status, data } = error.response as AxiosResponse<ApiError>
  const apiError = data as ApiError | undefined

  const message = apiError?.message ?? getDefaultMessage(status)
  const code = apiError?.code ?? 'UNKNOWN_ERROR'
  const details = apiError?.details

  switch (status) {
    case 401:
      return new AuthError(message)
    case 422:
      return new ValidationError(message, details)
    default:
      return new AppError(status, code, message, details)
  }
}

function getDefaultMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Requisição inválida.',
    401: 'Não autorizado.',
    403: 'Acesso negado.',
    404: 'Recurso não encontrado.',
    409: 'Conflito de dados.',
    422: 'Erro nos dados da simulação.',
    429: 'Muitas requisições. Aguarde um momento.',
    500: 'Erro interno do servidor.',
    502: 'Servidor indisponível.',
    503: 'Serviço temporariamente indisponível.',
  }
  return messages[status] ?? `Erro ${status}`
}

// Flag para evitar múltiplos redirects simultâneos
let _redirectingToLogin = false

export function setupInterceptors() {
  httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
    (error: unknown) => Promise.reject(error),
  )

  httpClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const normalized = normalizeError(error)

      if (normalized instanceof AuthError && !_redirectingToLogin) {
        const url = (error.config as InternalAxiosRequestConfig)?.url ?? ''
        // Não dispara auth:logout para o endpoint de verificação de sessão
        // (usuário simplesmente ainda não está logado — situação normal)
        const isSessionCheck = url.includes('/users/me')
        if (!isSessionCheck) {
          _redirectingToLogin = true
          window.dispatchEvent(new CustomEvent('auth:logout'))
          // Reset após navegação concluir
          setTimeout(() => { _redirectingToLogin = false }, 2000)
        }
      }

      return Promise.reject(normalized)
    },
  )
}
