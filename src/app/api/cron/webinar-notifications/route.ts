import { NextResponse } from 'next/server'
import { processNotificationQueue } from '@/app/api/webinars/lib/notifications'
import type { NextRequest } from 'next/server'

// GET /api/cron/webinar-notifications - Process notification queue
// This endpoint should be called by a cron job every minute
// Example: curl -H "Authorization: Bearer $CRON_SECRET" https://nebiswera.com/api/cron/webinar-notifications
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await processNotificationQueue()

    return NextResponse.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: 'Failed to process notification queue' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility with external cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
