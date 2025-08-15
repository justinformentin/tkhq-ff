import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getAuthSession } from '@/lib/auth/session-server'

/**
 * GET /api/auth/session
 * Returns current user session information
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    const session = await getAuthSession()
    
    if (!user || !session) {
      return NextResponse.json(
        { isAuthenticated: false, user: null },
        { status: 200 }
      )
    }
    
    return NextResponse.json({
      isAuthenticated: true,
      user: user,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
