import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, verifyAndDecodeToken, extractUserFromToken } from '@/lib/auth/oidc-client'
import { createSession } from '@/lib/auth/session-server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { getConfig } from '@/lib/config'

interface TempSessionData {
  codeVerifier?: string
  state?: string
  returnTo?: string
}

/**
 * GET /auth/callback
 * Handles OIDC callback and creates user session
 * Similar to Go's token exchange and session creation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle authentication errors
    if (error) {
      console.error('OIDC authentication error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, request.url)
      )
    }

    if (!code || !state) {
      console.error('Missing code or state parameter in callback')
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_request&description=Missing required parameters', request.url)
      )
    }

    // Retrieve temporary session data
    const config = getConfig()
    const cookieStore = await cookies()
    const tempSession = await getIronSession<TempSessionData>(cookieStore, {
      password: config.auth.session.secret,
      cookieName: 'turnkey-auth-temp',
      cookieOptions: {
        secure: config.environment === 'prod',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 10 * 60,
      },
    })

    const { codeVerifier, state: expectedState, returnTo } = tempSession

    if (!codeVerifier || !expectedState) {
      console.error('Missing PKCE parameters in session')
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_state&description=Session expired or invalid', request.url)
      )
    }

    if (state !== expectedState) {
      console.error('State parameter mismatch')
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_state&description=State parameter mismatch', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(code, codeVerifier)

    if (!tokenResponse.access_token || !tokenResponse.id_token) {
      throw new Error('Missing required tokens in response')
    }

    // Verify and decode ID token
    const tokenPayload = await verifyAndDecodeToken(tokenResponse.id_token)
    
    // Extract user information
    const user = extractUserFromToken(tokenPayload)

    // Create authenticated session
    await createSession(
      user,
      tokenResponse.access_token,
      tokenResponse.id_token,
      tokenResponse.refresh_token
    )

    // Clear temporary session
    tempSession.codeVerifier = undefined
    tempSession.state = undefined
    tempSession.returnTo = undefined
    await tempSession.save()

    // Redirect to original destination or home
    const redirectUrl = returnTo && returnTo.startsWith('/') ? returnTo : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error('Authentication callback failed:', error)
    return NextResponse.redirect(
      new URL(`/auth/error?error=callback_failed&description=${encodeURIComponent(String(error))}`, request.url)
    )
  }
}
