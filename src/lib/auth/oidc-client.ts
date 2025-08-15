import { getConfig } from '@/lib/config'
import type { TokenPayload, OIDCUser } from '@/types/auth'

interface OIDCEndpoints {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint: string
  jwks_uri: string
  issuer: string
}

let endpoints: OIDCEndpoints | null = null

/**
 * Get OIDC endpoints (hardcoded based on working Go implementation)
 */
async function discoverEndpoints(): Promise<OIDCEndpoints> {
  if (endpoints) {
    return endpoints
  }

  const config = getConfig()
  const baseUrl = config.auth.keycloak.issuer // https://keycloak.admin.turnkey.engineering/realms/staff
  
  // Construct endpoints based on the working URL pattern from Go implementation
  endpoints = {
    authorization_endpoint: `${baseUrl}/protocol/openid-connect/auth`,
    token_endpoint: `${baseUrl}/protocol/openid-connect/token`,
    userinfo_endpoint: `${baseUrl}/protocol/openid-connect/userinfo`,
    end_session_endpoint: `${baseUrl}/protocol/openid-connect/logout`,
    jwks_uri: `${baseUrl}/protocol/openid-connect/certs`,
    issuer: baseUrl
  }

  return endpoints
}

/**
 * Generate code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Generate code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(digest))
}

/**
 * Generate random state
 */
function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

/**
 * Base64 URL encode
 */
function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Generate authorization URL for OIDC flow
 * Similar to Go's server.GetToken browser handshake
 */
export async function generateAuthUrl(): Promise<{ url: string; codeVerifier: string; state: string }> {
  const endpoints = await discoverEndpoints()
  const config = getConfig()
  
  // Generate PKCE code verifier and challenge (security best practice)
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.auth.keycloak.clientId,
    redirect_uri: config.auth.keycloak.redirectUri,
    scope: config.auth.keycloak.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `${endpoints.authorization_endpoint}?${params.toString()}`

  return {
    url: authUrl,
    codeVerifier,
    state,
  }
}

interface TokenResponse {
  access_token: string
  id_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

/**
 * Exchange authorization code for tokens
 * Similar to Go's token exchange process
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const endpoints = await discoverEndpoints()
  const config = getConfig()

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.auth.keycloak.clientId,
    code,
    redirect_uri: config.auth.keycloak.redirectUri,
    code_verifier: codeVerifier,
  })

  try {
    const response = await fetch(endpoints.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`)
    }

    const tokenData = await response.json()
    return tokenData as TokenResponse
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error)
    throw new Error(`Token exchange failed: ${error}`)
  }
}

/**
 * Decode JWT token (basic decode without verification for now)
 * In production, you'd want to verify the signature using the JWKS endpoint
 */
export function decodeJWT(token: string): TokenPayload {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const payload = parts[1]
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decoded = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'))
    
    return JSON.parse(decoded) as TokenPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    throw new Error(`JWT decode failed: ${error}`)
  }
}

/**
 * Verify and decode ID token
 * Similar to Go's VerifyToken function
 */
export async function verifyAndDecodeToken(idToken: string): Promise<TokenPayload> {
  // For now, just decode without verification
  // In production, you'd want to verify the signature
  return decodeJWT(idToken)
}

/**
 * Extract user information from token payload
 * Similar to Go's user data extraction
 */
export function extractUserFromToken(payload: TokenPayload): OIDCUser {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    firstName: payload.given_name,
    lastName: payload.family_name,
    preferred_username: payload.preferred_username,
    groups: payload.groups || [],
    roles: payload.roles || [],
  }
}

/**
 * Refresh tokens using refresh token
 * Similar to Go's cached token refresh logic
 */
export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const endpoints = await discoverEndpoints()
  const config = getConfig()

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.auth.keycloak.clientId,
    refresh_token: refreshToken,
  })

  try {
    const response = await fetch(endpoints.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Token refresh failed: ${response.status} ${errorData}`)
    }

    const tokenData = await response.json()
    return tokenData as TokenResponse
  } catch (error) {
    console.error('Failed to refresh tokens:', error)
    throw new Error(`Token refresh failed: ${error}`)
  }
}
