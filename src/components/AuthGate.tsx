import { useAuth } from '@/lib/auth/context'
import { Navigate } from '@tanstack/react-router'

interface AuthGateProps {
  children: React.ReactNode
}

/**
 * Renders children if authenticated, otherwise redirects to /login.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
