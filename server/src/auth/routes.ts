/**
 * Auth routes for the BFF server.
 * Mirrors tkhq-ff backend/src/routes/auth.ts.
 *
 * GET  /auth/login       — redirect to Keycloak
 * GET  /auth/callback    — exchange code, create session, redirect to app
 * POST /auth/logout      — destroy session, return Keycloak logout URL
 * GET  /api/auth/me      — return current user from session, or 401
 */
import { Router } from 'express'
import {
  authorizationUrl,
  claimsOf,
  exchangeCode,
  logoutUrl,
  startLogin,
} from './keycloak.js'
import {
  SESSION_COOKIE,
  consumePendingLogin,
  createSession,
  destroySession,
  getSession,
  rememberPendingLogin,
} from './session.js'
import { getServerConfig } from '../config.js'

const router = Router()

/** Only redirect within this app — prevents open-redirect phishing. */
function safePath(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/'
}

function cookieOptions(redirectUri: string) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: redirectUri.startsWith('https://'),
    path: '/',
  }
}

// GET /api/auth/me — who is signed in, or 401 with a login URL
router.get('/api/auth/me', (req, res) => {
  const { oidc } = getServerConfig()
  const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined
  const session = getSession(sessionId)

  if (session) {
    res.json({ isAuthenticated: true, user: session.user })
    return
  }

  res.status(401).json({
    isAuthenticated: false,
    error: 'Not signed in.',
    loginUrl: '/auth/login',
  })
})

// GET /auth/login — hand off to Keycloak
router.get('/auth/login', async (req, res) => {
  try {
    const { oidc } = getServerConfig()
    const returnTo = safePath(req.query.returnTo)

    const pending = startLogin(returnTo)
    rememberPendingLogin(pending.state, pending.codeVerifier, pending.returnTo)

    const url = await authorizationUrl(
      {
        issuer: oidc.issuer,
        clientId: oidc.clientId,
        clientSecret: oidc.clientSecret,
        redirectUri: oidc.redirectUri,
        scope: oidc.scope,
        idpHint: oidc.idpHint,
      },
      pending
    )

    res.redirect(url)
  } catch (err) {
    console.error('Login initiation failed:', err)
    res.status(500).json({ error: 'Failed to initiate authentication' })
  }
})

// GET /auth/callback — exchange code for tokens, create session
router.get('/auth/callback', async (req, res) => {
  try {
    const { oidc } = getServerConfig()

    if (req.query.error) {
      const desc = String(req.query.error_description || req.query.error)
      res.redirect(`/auth/error?error=${encodeURIComponent(String(req.query.error))}&description=${encodeURIComponent(desc)}`)
      return
    }

    const { code, state } = req.query
    if (typeof code !== 'string' || typeof state !== 'string') {
      res.redirect('/auth/error?error=invalid_request&description=Missing+required+parameters')
      return
    }

    const login = consumePendingLogin(state)
    if (!login) {
      res.redirect('/auth/error?error=invalid_state&description=Login+expired+or+invalid')
      return
    }

    const tokens = await exchangeCode(
      {
        issuer: oidc.issuer,
        clientId: oidc.clientId,
        clientSecret: oidc.clientSecret,
        redirectUri: oidc.redirectUri,
        scope: oidc.scope,
      },
      code,
      login.codeVerifier
    )

    const sessionId = createSession(tokens)
    res.cookie(SESSION_COOKIE, sessionId, cookieOptions(oidc.redirectUri))
    res.redirect(login.returnTo)
  } catch (err) {
    console.error('Auth callback failed:', err)
    const desc = encodeURIComponent(String(err))
    res.redirect(`/auth/error?error=callback_failed&description=${desc}`)
  }
})

// POST /auth/logout — destroy session, return Keycloak logout URL
router.post('/auth/logout', async (req, res) => {
  try {
    const { oidc } = getServerConfig()
    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined
    const session = destroySession(sessionId)

    res.clearCookie(SESSION_COOKIE, cookieOptions(oidc.redirectUri))

    if (!session) {
      res.json({ logoutUrl: null })
      return
    }

    const origin = new URL(oidc.redirectUri).origin
    const url = await logoutUrl(
      { issuer: oidc.issuer, clientId: oidc.clientId, redirectUri: oidc.redirectUri, scope: oidc.scope },
      session.tokens.idToken,
      origin
    )
    res.json({ logoutUrl: url })
  } catch (err) {
    console.error('Logout failed:', err)
    res.json({ logoutUrl: null })
  }
})

export default router
