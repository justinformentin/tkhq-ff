import { createFileRoute } from '@tanstack/react-router'

/**
 * /auth/callback — The Express BFF handles this route directly.
 * This file exists only so TanStack Router doesn't 404 on the path
 * if the browser somehow lands here before the server redirect.
 */
export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
    </div>
  )
}
