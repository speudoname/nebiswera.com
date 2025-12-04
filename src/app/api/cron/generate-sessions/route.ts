import { NextResponse } from 'next/server'
import { generateAllIntervalSessions } from '@/lib/webinar/interval-session-generator'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

/**
 * Cron job to generate interval-based sessions for all webinars
 * Should be called daily (e.g., at midnight)
 *
 * Setup with cron service (e.g., cron-job.org, EasyCron, or DigitalOcean App Platform):
 * - URL: https://yourdomain.com/api/cron/generate-sessions
 * - Method: POST
 * - Header: Authorization: Bearer YOUR_CRON_SECRET
 * - Schedule: Daily at 00:00 UTC
 *
 * Set CRON_SECRET in your .env file for security
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    const providedSecret = authHeader?.replace('Bearer ', '')
    if (providedSecret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate sessions for all webinars
    logger.info('[CRON] Starting session generation...')
    const result = await generateAllIntervalSessions()

    logger.info(`[CRON] Processed ${result.processed} webinars`)
    if (result.errors.length > 0) {
      logger.error(`[CRON] Encountered ${result.errors.length} errors:`, result.errors)
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('[CRON] Session generation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing (only in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production. Use POST with Authorization header.' },
      { status: 405 }
    )
  }

  // In development, allow GET for testing
  return POST(request)
}
