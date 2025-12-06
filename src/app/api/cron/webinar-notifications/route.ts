import type { NextRequest } from 'next/server'
import { processNotificationQueue } from '@/app/api/webinars/lib/notifications'
import { successResponse, errorResponse, logger } from '@/lib'
import { verifyCronSecret } from '@/lib/middleware/cron'

// GET /api/cron/webinar-notifications - Process notification queue
// This endpoint should be called by a cron job every minute
// Example: curl -H "Authorization: Bearer $CRON_SECRET" https://nebiswera.com/api/cron/webinar-notifications
export async function GET(request: NextRequest) {
  const auth = verifyCronSecret(request)
  if (!auth.success) return auth.response

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
