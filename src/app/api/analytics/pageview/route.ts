import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'
import {
  getPageTypeFromPath,
  getLocaleFromPath,
  getDeviceType,
  parseBrowserInfo,
  parseOS,
  extractReferrerDomain,
  parseUTMParams,
} from '@/lib/analytics'

/**
 * POST /api/analytics/pageview
 * Track a new page view
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, pageId, referrer, sessionId, visitorId, userId, fullUrl } = body

    if (!path || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: path, sessionId' },
        { status: 400 }
      )
    }

    // Get user agent and parse device info
    const userAgent = request.headers.get('user-agent') || ''
    const deviceType = getDeviceType(userAgent)
    const { browser, version: browserVersion } = parseBrowserInfo(userAgent)
    const os = parseOS(userAgent)

    // Parse page info
    const pageType = getPageTypeFromPath(path)
    const locale = getLocaleFromPath(path)

    // Parse referrer
    const referrerDomain = extractReferrerDomain(referrer)

    // Parse UTM parameters from full URL
    const utmParams = fullUrl ? parseUTMParams(fullUrl) : {}

    // Create page view record
    const pageView = await prisma.pageView.create({
      data: {
        path,
        pageType,
        pageId: pageId || null,
        locale,
        userId: userId || null,
        sessionId,
        visitorId: visitorId || null,
        referrer: referrer || null,
        referrerDomain,
        utmSource: utmParams.utmSource,
        utmMedium: utmParams.utmMedium,
        utmCampaign: utmParams.utmCampaign,
        utmContent: utmParams.utmContent,
        utmTerm: utmParams.utmTerm,
        userAgent,
        deviceType,
        browser,
        browserVersion,
        os,
        duration: 0,
        scrollDepth: 0,
        engaged: false,
        bounced: true,
      },
    })

    return NextResponse.json({
      id: pageView.id,
      success: true,
    })
  } catch (error) {
    logger.error('Error tracking page view:', error)
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/analytics/pageview
 * Update engagement metrics for an existing page view
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, duration, scrollDepth, engaged, bounced } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing page view ID' }, { status: 400 })
    }

    // Update page view with engagement data
    await prisma.pageView.update({
      where: { id },
      data: {
        duration: duration || 0,
        scrollDepth: scrollDepth || 0,
        engaged: engaged ?? false,
        bounced: bounced ?? true,
        exitedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error updating page view:', error)
    return NextResponse.json(
      { error: 'Failed to update page view' },
      { status: 500 }
    )
  }
}
