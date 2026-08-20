import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/error')({
  component: AuthErrorPage,
})

function AuthErrorPage() {
  const search = new URLSearchParams(window.location.search)
  const error = search.get('error') || 'unknown_error'
  const description = search.get('description') || 'An unknown authentication error occurred'

  const getErrorMessage = (err: string) => {
    switch (err) {
      case 'access_denied': return 'Access was denied. You may not have permission to access this application.'
      case 'invalid_request': return 'The authentication request was invalid.'
      case 'invalid_state': return 'The authentication session has expired or been tampered with.'
      case 'callback_failed': return 'Failed to complete the authentication process.'
      default: return 'An error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 px-4">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-card-foreground">Error Details</h3>
              <div className="mt-2 text-sm text-muted-foreground">
                <p><strong>Error:</strong> {error}</p>
                <p><strong>Description:</strong> {description}</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <a
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Try Again
              </a>
              <Link
                to="/"
                className="w-full flex justify-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-card-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
