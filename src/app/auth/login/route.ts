import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl } from '@/lib/auth/oidc-client'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { getConfig } from '@/lib/config'

interface SessionData {
  codeVerifier?: string
  state?: string
  returnTo?: string
}

/**
 * GET /auth/login
 * Initiates OIDC authentication flow
 * Similar to Go's browser-based token acquisition initiation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const returnTo = searchParams.get('returnTo') || '/'

    // Generate OIDC authorization URL with PKCE
    const { url, codeVerifier, state } = await generateAuthUrl()

    // Store PKCE parameters and return URL in session for callback
    const config = getConfig()
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, {
      password: config.auth.session.secret,
      cookieName: 'turnkey-auth-temp',
      cookieOptions: {
        secure: config.environment === 'prod',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 10 * 60, // 10 minutes - short lived
      },
    })

    session.codeVerifier = codeVerifier
    session.state = state
    session.returnTo = returnTo
    await session.save()

    // Redirect to Keycloak for authentication
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Login initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    )
  }
}
