import { NextResponse } from 'next/server'
import {
  processNotificationQueue,
  checkInactivityNotifications,
  checkExpirationNotifications,
} from '@/app/api/courses/lib/notifications'
import { unauthorizedResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

// GET /api/cron/course-notifications - Process notification queue and check for inactivity/expiration
// This endpoint should be called by a cron job every 5-15 minutes
// Example: curl -H "Authorization: Bearer $CRON_SECRET" https://nebiswera.com/api/cron/course-notifications
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return unauthorizedResponse()
  }

  try {
    const startTime = Date.now()

    // 1. Process the notification queue (send scheduled notifications)
    const queueStats = await processNotificationQueue()

    // 2. Check for inactive enrollments and queue inactivity notifications
    const inactivityQueued = await checkInactivityNotifications()

    // 3. Check for expiring enrollments and queue expiration notifications
    const expirationQueued = await checkExpirationNotifications()

    const duration = Date.now() - startTime

    logger.log(`Course notifications cron completed in ${duration}ms:`, {
      queue: queueStats,
      inactivityQueued,
      expirationQueued,
    })

    return successResponse({
      success: true,
      queue: queueStats,
      inactivity: {
        queued: inactivityQueued,
      },
      expiration: {
        queued: expirationQueued,
      },
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Course notifications cron job failed:', error)
    return errorResponse('Failed to process course notifications')
  }
}

// Also support POST for flexibility with external cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
