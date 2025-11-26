import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getCampaignsToProcess,
  processCampaignBatch,
} from '@/lib/campaign-sender'

// Security: Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/process-campaigns
 *
 * Processes scheduled and sending campaigns.
 * Should be called by a cron job (Railway, Vercel Cron, or external service)
 *
 * Security:
 * - Requires CRON_SECRET header to prevent unauthorized access
 *
 * Behavior:
 * - Checks for SCHEDULED campaigns that are ready (scheduledAt <= now)
 * - Transitions them to SENDING status
 * - Processes one batch (500 emails) per campaign
 * - Multiple calls needed to fully send large campaigns
 *
 * Recommended: Call every 1-2 minutes for responsive sending
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = authHeader?.replace('Bearer ', '')

  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    console.warn('Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results: Array<{
      campaignId: string
      campaignName: string
      processed: boolean
      hasMore: boolean
      sent: number
      failed: number
    }> = []

    // Get campaigns that need processing
    const campaigns = await getCampaignsToProcess()

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No campaigns to process',
        results: [],
      })
    }

    // Process one batch from each campaign
    for (const campaign of campaigns) {
      const result = await processCampaignBatch(campaign.id)

      results.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        ...result,
      })
    }

    // Summary
    const totalSent = results.reduce((sum, r) => sum + r.sent, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
    const campaignsWithMore = results.filter((r) => r.hasMore).length

    return NextResponse.json({
      success: true,
      message: `Processed ${campaigns.length} campaigns. Sent: ${totalSent}, Failed: ${totalFailed}`,
      results,
      summary: {
        campaignsProcessed: campaigns.length,
        campaignsRemaining: campaignsWithMore,
        totalSent,
        totalFailed,
      },
    })
  } catch (error) {
    console.error('Campaign processing error:', error)
    return NextResponse.json(
      {
        error: 'Campaign processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/process-campaigns
 *
 * Returns status of campaigns that need processing (for monitoring)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = authHeader?.replace('Bearer ', '')

  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const campaigns = await getCampaignsToProcess()

    return NextResponse.json({
      pendingCampaigns: campaigns.length,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
    })
  } catch (error) {
    console.error('Failed to get campaign status:', error)
    return NextResponse.json(
      { error: 'Failed to get campaign status' },
      { status: 500 }
    )
  }
}
