import React, { createContext, useContext, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { OIDCUser, AuthSession } from '@/types/auth'
import { getUserDisplayName } from './utils'

interface AuthContextType {
  user: OIDCUser | null
  isAuthenticated: boolean
  isLoading: boolean
  displayName: string
  refreshUser: () => Promise<void>
  logout: (fullLogout?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchMe(): Promise<AuthSession> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  if (res.status === 401) {
    return { isAuthenticated: false, user: null }
  }
  if (!res.ok) throw new Error(`/api/auth/me failed: ${res.status}`)
  return res.json() as Promise<AuthSession>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }, [queryClient])

  const logout = useCallback(async (fullLogout = true) => {
    try {
      const res = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json() as { logoutUrl: string | null }
      queryClient.clear()

      if (fullLogout && result.logoutUrl) {
        window.location.href = result.logoutUrl
      } else {
        window.location.href = '/login'
      }
    } catch {
      window.location.href = '/login'
    }
  }, [queryClient])

  const user = data?.user ?? null
  const isAuthenticated = data?.isAuthenticated ?? false
  const displayName = user ? getUserDisplayName(user) : ''

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, displayName, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
