import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth/session-server'
import { getConfig } from '@/lib/config'

/**
 * GET /auth/logout
 * Clears user session and optionally redirects to Keycloak logout
 * Similar to Go's session cleanup
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keycloakLogout = searchParams.get('keycloak') === 'true'
    const returnTo = searchParams.get('returnTo') || '/'

    // Clear local session
    await clearSession()

    if (keycloakLogout) {
      // Redirect to Keycloak logout endpoint to clear SSO session
      const config = getConfig()
      const keycloakLogoutUrl = new URL('/protocol/openid-connect/logout', config.auth.keycloak.issuer)
      keycloakLogoutUrl.searchParams.set('post_logout_redirect_uri', new URL(returnTo, request.url).toString())
      keycloakLogoutUrl.searchParams.set('client_id', config.auth.keycloak.clientId)

      return NextResponse.redirect(keycloakLogoutUrl.toString())
    } else {
      // Just redirect to return URL without Keycloak logout
      const redirectUrl = returnTo && returnTo.startsWith('/') ? returnTo : '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  } catch (error) {
    console.error('Logout failed:', error)
    // Even if logout fails, redirect to home to clear client state
    return NextResponse.redirect(new URL('/', request.url))
  }
}

/**
 * POST /auth/logout
 * Handle logout from client-side JavaScript
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keycloakLogout = false, returnTo = '/' } = body

    // Clear local session
    await clearSession()

    if (keycloakLogout) {
      const config = getConfig()
      const keycloakLogoutUrl = new URL('/protocol/openid-connect/logout', config.auth.keycloak.issuer)
      keycloakLogoutUrl.searchParams.set('post_logout_redirect_uri', new URL(returnTo, request.url).toString())
      keycloakLogoutUrl.searchParams.set('client_id', config.auth.keycloak.clientId)

      return NextResponse.json({ 
        success: true, 
        redirectUrl: keycloakLogoutUrl.toString() 
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        redirectUrl: returnTo 
      })
    }
  } catch (error) {
    console.error('Logout failed:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
