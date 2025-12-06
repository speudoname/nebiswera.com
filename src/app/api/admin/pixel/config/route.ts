/**
 * Admin Facebook Pixel Configuration API
 * Manage Pixel ID, Access Token, and settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getPixelConfig, updatePixelConfig } from '@/lib/pixel'
import type { PixelConfig } from '@/lib/pixel'

// GET - Fetch current pixel configuration
export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await getPixelConfig()

    // Mask the access token for security
    const maskedConfig = {
      ...config,
      fbAccessToken: config.fbAccessToken
        ? `${config.fbAccessToken.substring(0, 8)}${'*'.repeat(20)}`
        : null,
    }

    return NextResponse.json(maskedConfig)
  } catch (error) {
    console.error('[Pixel Config API] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pixel configuration' },
      { status: 500 }
    )
  }
}

// PUT - Update pixel configuration
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const updates: Partial<PixelConfig> = {}

    if ('fbPixelId' in body) {
      updates.fbPixelId = body.fbPixelId || null
    }

    if ('fbAccessToken' in body) {
      // Only update if it's a new value (not the masked version)
      if (body.fbAccessToken && !body.fbAccessToken.includes('*')) {
        updates.fbAccessToken = body.fbAccessToken
      }
    }

    if ('fbTestEventCode' in body) {
      updates.fbTestEventCode = body.fbTestEventCode || null
    }

    if ('fbPixelEnabled' in body) {
      updates.fbPixelEnabled = Boolean(body.fbPixelEnabled)
    }

    if ('fbTestMode' in body) {
      updates.fbTestMode = Boolean(body.fbTestMode)
    }

    // Update configuration
    const updatedConfig = await updatePixelConfig(updates)

    // Mask the access token in response
    const maskedConfig = {
      ...updatedConfig,
      fbAccessToken: updatedConfig.fbAccessToken
        ? `${updatedConfig.fbAccessToken.substring(0, 8)}${'*'.repeat(20)}`
        : null,
    }

    return NextResponse.json({
      success: true,
      config: maskedConfig,
    })
  } catch (error) {
    console.error('[Pixel Config API] PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update pixel configuration' },
      { status: 500 }
    )
  }
}

// POST - Test pixel connection
export async function POST() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await getPixelConfig()

    // Check if pixel is configured
    if (!config.fbPixelId) {
      return NextResponse.json({
        success: false,
        error: 'Pixel ID is not configured',
      })
    }

    if (!config.fbAccessToken) {
      return NextResponse.json({
        success: false,
        error: 'Access Token is not configured (required for server-side tracking)',
      })
    }

    // Test connection by sending a test event
    const testEventUrl = `https://graph.facebook.com/v18.0/${config.fbPixelId}/events`

    const testPayload = {
      data: [
        {
          event_name: 'TestEvent',
          event_time: Math.floor(Date.now() / 1000),
          event_id: `test-${Date.now()}`,
          event_source_url: 'https://example.com/test',
          action_source: 'website',
          user_data: {},
        },
      ],
      access_token: config.fbAccessToken,
      ...(config.fbTestEventCode && { test_event_code: config.fbTestEventCode }),
    }

    const response = await fetch(testEventUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: responseData.error?.message || 'Failed to connect to Facebook API',
        details: responseData.error,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      eventsReceived: responseData.events_received,
    })
  } catch (error) {
    console.error('[Pixel Config API] Test Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test pixel connection' },
      { status: 500 }
    )
  }
}
