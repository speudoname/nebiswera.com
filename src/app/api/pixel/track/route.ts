/**
 * Facebook Pixel Event Tracking API
 * Receives events from client and forwards to Conversions API
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { trackServerEvent, isPixelEnabled } from '@/lib/pixel'
import type { TrackEventRequest, PixelEventName, PageType } from '@/lib/pixel'

export async function POST(request: NextRequest) {
  try {
    // Check if pixel is enabled
    const enabled = await isPixelEnabled()
    if (!enabled) {
      return NextResponse.json(
        { success: false, error: 'Pixel tracking is disabled' },
        { status: 200 } // Return 200 to not break client
      )
    }

    // Parse request body
    const body: TrackEventRequest = await request.json()

    // Validate required fields
    if (!body.eventName) {
      return NextResponse.json(
        { success: false, error: 'eventName is required' },
        { status: 400 }
      )
    }

    if (!body.pageUrl) {
      return NextResponse.json(
        { success: false, error: 'pageUrl is required' },
        { status: 400 }
      )
    }

    // Get browser data from request
    const headersList = await headers()
    const clientIpAddress =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      undefined

    const clientUserAgent = headersList.get('user-agent') || undefined

    // Track the event server-side
    const result = await trackServerEvent({
      eventName: body.eventName as PixelEventName,
      eventId: body.eventId,
      pageType: (body.pageType || 'other') as PageType,
      pageUrl: body.pageUrl,
      params: body.params,
      userData: body.userData,
      browserData: {
        clientIpAddress,
        clientUserAgent,
        fbp: body.fbp,
        fbc: body.fbc,
      },
    })

    return NextResponse.json({
      success: result.success,
      eventId: result.eventId,
      error: result.error,
    })
  } catch (error) {
    console.error('[Pixel API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get pixel status and ID for client
export async function GET() {
  const enabled = await isPixelEnabled()
  let pixelId = null

  if (enabled) {
    const { getClientPixelId } = await import('@/lib/pixel')
    pixelId = await getClientPixelId()
  }

  return NextResponse.json({
    status: 'ok',
    pixelEnabled: enabled,
    pixelId,
  })
}
