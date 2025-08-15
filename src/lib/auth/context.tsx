'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { OIDCUser } from '@/types/auth'
import { getUserDisplayName } from './utils'

interface AuthContextType {
  user: OIDCUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  displayName: string
  refreshUser: () => Promise<void>
  logout: (keycloakLogout?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialUser?: OIDCUser | null
}

/**
 * Authentication context provider
 * Manages user authentication state on the client side
 */
export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<OIDCUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(true) // Always start loading to avoid hydration mismatch
  const [error, setError] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (response.ok) {
        const sessionData = await response.json()
        setUser(sessionData.isAuthenticated ? sessionData.user : null)
      } else {
        setUser(null)
        setError('Failed to fetch session information')
      }
    } catch (err) {
      console.error('Failed to refresh user:', err)
      setError('Failed to refresh user information')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (keycloakLogout = true) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keycloakLogout,
          returnTo: '/',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Clear local state
        setUser(null)
        setError(null)
        
        // Redirect to logout URL (may include Keycloak logout)
        window.location.href = result.redirectUrl
      } else {
        throw new Error('Logout request failed')
      }
    } catch (err) {
      console.error('Logout failed:', err)
      setError('Failed to logout')
      
      // Still clear local state and redirect to home
      setUser(null)
      window.location.href = '/'
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load user on mount and set initial loading state
  useEffect(() => {
    if (initialUser) {
      // If we have an initial user, we're not loading
      setIsLoading(false)
    } else if (!user) {
      // If no initial user and no current user, fetch from server
      refreshUser()
    } else {
      // If we already have a user, we're not loading
      setIsLoading(false)
    }
  }, [initialUser, user, refreshUser])

  // Auto-refresh user every 5 minutes to handle token refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refreshUser()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, refreshUser])

  const displayName = user ? getUserDisplayName(user) : ''
  const isAuthenticated = Boolean(user)

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    displayName,
    refreshUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to access current user
 */
export function useUser(): OIDCUser | null {
  const { user } = useAuth()
  return user
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook to access user roles
 */
export function useUserRoles(): string[] {
  const { user } = useAuth()
  return user?.roles || []
}

/**
 * Hook to access user groups
 */
export function useUserGroups(): string[] {
  const { user } = useAuth()
  return user?.groups || []
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: string): boolean {
  const roles = useUserRoles()
  return roles.includes(role)
}

/**
 * Hook to check if user belongs to specific group
 */
export function useHasGroup(group: string): boolean {
  const groups = useUserGroups()
  return groups.includes(group)
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const userRoles = useUserRoles()
  return roles.some(role => userRoles.includes(role))
}

/**
 * Hook to check if user belongs to any of the specified groups
 */
export function useHasAnyGroup(groups: string[]): boolean {
  const userGroups = useUserGroups()
  return groups.some(group => userGroups.includes(group))
}
