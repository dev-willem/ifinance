import httpClient from '../http/client'
import type { AdminStats, AdminUser, AdminUsersPage, UserRole } from '@/types/admin'

const BASE = '/api/v1/admin'

export const adminApi = {
  async listUsers(page = 0, size = 20): Promise<AdminUsersPage> {
    const res = await httpClient.get<AdminUsersPage>(`${BASE}/users`, { params: { page, size } })
    return res.data
  },

  async changeRole(id: string, role: UserRole): Promise<AdminUser> {
    const res = await httpClient.patch<AdminUser>(`${BASE}/users/${id}/role`, { role })
    return res.data
  },

  async stats(): Promise<AdminStats> {
    const res = await httpClient.get<AdminStats>(`${BASE}/stats`)
    return res.data
  },
}
