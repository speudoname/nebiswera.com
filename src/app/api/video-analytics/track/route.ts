import { NextRequest } from 'next/server'
import { successResponse, errorResponse } from '@/lib'
import { checkRateLimit } from '@/lib/rate-limit'

// UUID validation regex for Bunny video IDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Valid event types
const VALID_EVENT_TYPES = [
  'VIDEO_STARTED',
  'VIDEO_PROGRESS',
  'VIDEO_COMPLETED',
  'VIDEO_SEEKED',
  'VIDEO_PAUSED',
  'VIDEO_UNMUTED',
]

// POST /api/video-analytics/track - Track standalone video events
// Note: Standalone videos (home page, etc.) are not tracked in the database
// since CourseAnalyticsEvent requires a valid courseId foreign key.
// Course-related video tracking happens through the course analytics endpoints.
export async function POST(request: NextRequest) {
  // Rate limiting - using analytics limiter (100 events/min)
  const rateLimitResponse = await checkRateLimit(request, 'analytics')
  if (rateLimitResponse) return rateLimitResponse

  // Origin validation for CSRF protection
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin) {
    const allowedHosts = ['nebiswera.com', 'www.nebiswera.com', 'localhost']
    const isAllowed = allowedHosts.some(
      (allowed) => origin.includes(allowed) || (host && host.includes(allowed))
    )
    if (!isAllowed) {
      return errorResponse('Invalid origin', 403)
    }
  }

  try {
    const body = await request.json()
    const { bunnyVideoId, eventType } = body

    // Validate required fields
    if (!bunnyVideoId || !eventType) {
      return errorResponse('Missing required fields', 400)
    }

    // Validate bunnyVideoId format
    if (!UUID_REGEX.test(bunnyVideoId)) {
      return errorResponse('Invalid video ID format', 400)
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return errorResponse('Invalid event type', 400)
    }

    // Standalone videos are acknowledged but not stored in the database
    // The CourseAnalyticsEvent table requires a valid courseId FK
    // For course videos, use /api/courses/[slug]/analytics instead
    return successResponse({ tracked: true, standalone: true })
  } catch {
    // Silently succeed to avoid console errors on the frontend
    return successResponse({ tracked: false, error: 'parse_error' })
  }
}
