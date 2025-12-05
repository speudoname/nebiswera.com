import { NextResponse } from 'next/server'
import { processNotificationQueue } from '@/app/api/webinars/lib/notifications'
import { unauthorizedResponse, successResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

// GET /api/cron/webinar-notifications - Process notification queue
// This endpoint should be called by a cron job every minute
// Example: curl -H "Authorization: Bearer $CRON_SECRET" https://nebiswera.com/api/cron/webinar-notifications
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return unauthorizedResponse()
  }

  try {
    const stats = await processNotificationQueue()

    return successResponse({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Cron job failed:', error)
    return errorResponse('Failed to process notification queue')
  }
}

// Also support POST for flexibility with external cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
