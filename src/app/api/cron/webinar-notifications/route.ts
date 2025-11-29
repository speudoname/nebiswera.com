import { NextResponse } from 'next/server'
import { processNotificationQueue } from '@/app/api/webinars/lib/notifications'
import type { NextRequest } from 'next/server'

// GET /api/cron/webinar-notifications - Process notification queue
// This endpoint should be called by a cron job every minute
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sentCount = await processNotificationQueue()

    return NextResponse.json({
      success: true,
      processed: sentCount,
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
