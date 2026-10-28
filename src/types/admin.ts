import type { User } from './models'

export type UserRole = User['role']

export interface AdminUser {
  id: string
  email: string
  name: string
  provider: string
  role: UserRole
  createdAt: string
  /** E-mail em APP_ADMIN_EMAILS: volta a ser admin a cada login, então não pode ser rebaixado. */
  bootstrapAdmin: boolean
}

export interface AdminUsersPage {
  users: AdminUser[]
  total: number
  page: number
  size: number
}

export interface AdminStats {
  totalUsers: number
  usersByRole: Record<UserRole, number>
  usersByProvider: Record<string, number>
  totalSimulations: number
  totalInvestments: number
}
