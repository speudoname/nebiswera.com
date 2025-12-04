import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/app/api/webinars/lib/registration'
import { getAblyServerClient } from '@/lib/ably'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/webinars/[slug]/chat/auth - Generate Ably auth token for client
 *
 * This endpoint is called by Ably's client SDK to authenticate users.
 * It validates that the user has access to the webinar, then generates
 * a token with limited capabilities for that specific webinar's chat channel.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Access token required' }, { status: 401 })
  }

  try {
    // Find webinar
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true, chatEnabled: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    if (!webinar.chatEnabled) {
      return NextResponse.json({ error: 'Chat is disabled for this webinar' }, { status: 403 })
    }

    // Validate access token
    const validation = await validateAccessToken(webinar.id, token)
    if (!validation.valid || !validation.registration) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    const registration = validation.registration

    // Create Ably token request with limited capabilities
    const ably = getAblyServerClient()
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: registration.id, // Unique identifier for this user
      capability: {
        // Only allow subscribe, publish, and presence on this specific webinar's channel
        [`webinar:${webinar.id}:chat`]: ['subscribe', 'publish', 'presence', 'history'],
      },
      // Token expires after 2 hours (can be extended if needed)
      ttl: 2 * 60 * 60 * 1000,
    })

    return NextResponse.json(tokenRequest)
  } catch (error) {
    console.error('Failed to create Ably token:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    )
  }
}
