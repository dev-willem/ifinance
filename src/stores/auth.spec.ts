import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { User } from '@/types'

const get = vi.fn()
vi.mock('@/services/http/client', () => ({ default: { get: (...args: unknown[]) => get(...args) } }))

const { useAuthStore } = await import('./auth')

const user = (role: User['role']): User => ({
  id: '1',
  name: 'Ana',
  email: 'ana@example.com',
  role,
  provider: 'github',
})

describe('auth store role', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    get.mockReset()
  })

  it('exposes ADMIN role from /users/me', async () => {
    get.mockResolvedValue({ data: user('ADMIN') })
    const auth = useAuthStore()

    await auth.fetchCurrentUser()

    expect(get).toHaveBeenCalledWith('/api/v1/users/me')
    expect(auth.role).toBe('ADMIN')
    expect(auth.isAdmin).toBe(true)
  })

  it('a USER is not admin', () => {
    const auth = useAuthStore()
    auth.setUser(user('USER'))

    expect(auth.role).toBe('USER')
    expect(auth.isAdmin).toBe(false)
  })

  it('anonymous (401 on /users/me) has no role', async () => {
    get.mockRejectedValue(new Error('401'))
    const auth = useAuthStore()

    await auth.fetchCurrentUser()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.role).toBeNull()
    expect(auth.isAdmin).toBe(false)
  })
})
