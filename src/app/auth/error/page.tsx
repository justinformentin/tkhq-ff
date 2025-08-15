'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'unknown_error'
  const description = searchParams.get('description') || 'An unknown authentication error occurred'

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'access_denied':
        return 'Access was denied. You may not have permission to access this application.'
      case 'invalid_request':
        return 'The authentication request was invalid.'
      case 'invalid_state':
        return 'The authentication session has expired or been tampered with.'
      case 'callback_failed':
        return 'Failed to complete the authentication process.'
      default:
        return 'An error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Error Details</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p><strong>Error:</strong> {error}</p>
                <p><strong>Description:</strong> {description}</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </Link>
              <Link 
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
