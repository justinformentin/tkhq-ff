'use client'

import { useAuth } from '@/lib/auth/context'
import { Logo } from '@/components/ui/Logo'
import { getClientConfig } from '@/lib/config'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'

function EnvironmentBadge({ environment }: { environment: string }) {
  const badgeStyles = {
    local: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dev: 'bg-green-500/20 text-green-300 border-green-500/30', 
    preprod: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    prod: 'bg-red-500/20 text-red-300 border-red-500/30'
  }
  
  const safeEnvironment = environment || 'local'
  const style = badgeStyles[safeEnvironment as keyof typeof badgeStyles] || badgeStyles.local
  
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border', style)}>
      {safeEnvironment.toUpperCase()}
    </span>
  )
}

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const config = getClientConfig()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/banner-background.png"
          alt="Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      {/* Environment badge in top-right */}
      <div className="absolute top-6 right-6 z-20">
        <EnvironmentBadge environment={config.environment} />
      </div>

      {/* Content - Centered */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo variant="light" size="lg" className="mx-auto" />
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-card-foreground mb-2">
                🔐 Authentication Required
              </h2>
              <p className="text-muted-foreground">
                Please log in to access the admin dashboard.
              </p>
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
