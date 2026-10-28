import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { User } from '@/types'

vi.mock('@/services/http/client', () => ({ default: { get: vi.fn() } }))
vi.mock('@/pages/HomePage.vue', () => ({ default: { render: () => null } }))
vi.mock('@/pages/admin/AdminUsersPage.vue', () => ({ default: { render: () => null } }))
vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) // jsdom doesn't implement it; router scrollBehavior calls it

const { default: router } = await import('@/router')
const { useAuthStore } = await import('@/stores/auth')

const user = (role: User['role']): User => ({ id: '1', name: 'Ana', email: 'a@x.com', role, provider: 'google' })

describe('router guard: requiresRole ADMIN', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('redirects a USER from /admin/users to /', async () => {
    useAuthStore().setUser(user('USER'))

    await router.push('/admin/users')

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('lets an ADMIN open /admin/users', async () => {
    useAuthStore().setUser(user('ADMIN'))

    await router.push('/admin/users')

    expect(router.currentRoute.value.name).toBe('admin-users')
  })
})
