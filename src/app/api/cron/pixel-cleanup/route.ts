/**
 * Cron job to cleanup old pixel event logs
 * Deletes logs older than 7 days
 *
 * This endpoint should be called by a cron scheduler (e.g., cron-job.org)
 * Endpoint: GET /api/cron/pixel-cleanup
 *
 * Add to crontab or external cron service:
 * 0 3 * * * curl -X GET https://yourdomain.com/api/cron/pixel-cleanup?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldEventLogs } from '@/lib/pixel'

const CRON_SECRET = process.env.CRON_SECRET || 'pixel-cleanup-secret'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    // Allow internal calls without secret (from same server)
    const isInternal = request.headers.get('x-forwarded-for') === null

    if (!isInternal && secret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete logs older than 7 days
    const deletedCount = await cleanupOldEventLogs(7)

    console.log(`[Pixel Cleanup] Deleted ${deletedCount} old event logs`)

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} logs older than 7 days`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Pixel Cleanup] Error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
