import type { OIDCUser } from '@/types/auth'

/**
 * Get user display name
 */
export function getUserDisplayName(user: OIDCUser): string {
  if (user.name) {
    return user.name
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  
  if (user.firstName) {
    return user.firstName
  }
  
  if (user.preferred_username) {
    return user.preferred_username
  }
  
  return user.email
}

/**
 * Format user groups for display
 */
export function formatUserGroups(groups: string[]): string[] {
  return groups.map(group => {
    // Convert kebab-case to title case
    return group
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  })
}

/**
 * Format user roles for display
 */
export function formatUserRoles(roles: string[]): string[] {
  return roles.map(role => {
    // Convert snake_case or kebab-case to title case
    return role
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  })
}
