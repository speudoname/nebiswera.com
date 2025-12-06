import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'
import type { PageEventType } from '@prisma/client'

/**
 * POST /api/analytics/event
 * Track a page event (click, scroll, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageViewId, eventType, elementId, elementText, targetUrl, metadata } = body

    if (!pageViewId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: pageViewId, eventType' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEventTypes: PageEventType[] = [
      'CLICK',
      'LINK_CLICK',
      'BUTTON_CLICK',
      'FORM_SUBMIT',
      'VIDEO_PLAY',
      'VIDEO_PAUSE',
      'SCROLL_MILESTONE',
      'CTA_CLICK',
      'SHARE',
      'COPY',
      'DOWNLOAD',
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Create event record
    const event = await prisma.pageEvent.create({
      data: {
        pageViewId,
        eventType,
        elementId: elementId || null,
        elementText: elementText ? elementText.substring(0, 100) : null, // Truncate long text
        targetUrl: targetUrl || null,
        metadata: metadata || null,
      },
    })

    return NextResponse.json({
      id: event.id,
      success: true,
    })
  } catch (error) {
    logger.error('Error tracking page event:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
