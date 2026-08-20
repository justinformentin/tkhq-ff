import type { OIDCUser } from '@/types/auth'

export function getUserDisplayName(user: OIDCUser): string {
  if (user.name) return user.name
  if (user.username) return user.username
  if (user.email) return user.email
  return 'User'
}
