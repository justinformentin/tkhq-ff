import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth/context'
import { Logo } from '@/components/ui/Logo'
import { getConfig } from '@/lib/config'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function EnvironmentBadge({ environment }: { environment: string }) {
  const badgeStyles: Record<string, string> = {
    local: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dev: 'bg-green-500/20 text-green-300 border-green-500/30',
    preprod: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    prod: 'bg-red-500/20 text-red-300 border-red-500/30',
  }
  const safeEnv = environment || 'local'
  const style = badgeStyles[safeEnv] || badgeStyles.local
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border', style)}>
      {safeEnv.toUpperCase()}
    </span>
  )
}

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const config = getConfig()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" />
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/banner-background.png"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      {/* Environment badge */}
      <div className="absolute top-6 right-6 z-20">
        <EnvironmentBadge environment={config.environment} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo variant="light" size="lg" className="mx-auto" />
          </div>

          <div className="bg-card border border-border rounded-lg p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                🔐 Authentication Required
              </h2>
              <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
            </div>

            <a
              href="/auth/login"
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Sign In with Keycloak
            </a>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Secure OIDC authentication powered by Keycloak
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
