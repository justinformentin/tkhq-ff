import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js middleware for route protection
 * Similar to Go's authentication interceptor pattern
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  try {
    // Check session validity
    const isAuthenticated = await checkAuthentication(request)
    
    if (!isAuthenticated) {
      // Store the originally requested URL for redirect after login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware authentication check failed:', error)
    
    // Redirect to login on any auth errors
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    
    return NextResponse.redirect(loginUrl)
  }
}

/**
 * Check if the route is public and doesn't require authentication
 */
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/', // Allow home page access for login prompt
    '/auth/login',
    '/auth/callback',
    '/auth/logout',
    '/auth/error',
    '/_next',
    '/favicon.ico',
    '/public',
  ]

  return publicRoutes.some(route => pathname === route || pathname.startsWith(route))
}

/**
 * Check if user is authenticated by validating session
 */
async function checkAuthentication(request: NextRequest): Promise<boolean> {
  try {
    // Get session from request cookies
    const cookieStore = request.cookies
    const environment = process.env.NEXT_PUBLIC_APP_ENV || 'local'
    const sessionCookie = cookieStore.get(`turnkey-admin-session-${environment}`)
    
    if (!sessionCookie?.value) {
      return false
    }

    // For now, we'll use a simpler approach - just check if session cookie exists
    // In a production app, you'd want to properly validate the session here
    
    return Boolean(sessionCookie?.value)
  } catch (error) {
    console.error('Session validation failed:', error)
    return false
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
