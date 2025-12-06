import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getCampaignsToProcess,
  processCampaignBatch,
} from '@/app/api/admin/campaigns/lib/campaign-sender'
import { logger } from '@/lib'
import { errorResponse } from '@/lib/api-response'
import { verifyCronSecret } from '@/lib/middleware/cron'

/**
 * POST /api/cron/process-campaigns
 *
 * Processes scheduled and sending campaigns.
 * Should be called by a cron job (server cron, or external service)
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
  const auth = verifyCronSecret(request)
  if (!auth.success) return auth.response

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
    logger.error('Campaign processing error:', error)
    return errorResponse('Campaign processing failed')
  }
}

/**
 * GET /api/cron/process-campaigns
 *
 * Returns status of campaigns that need processing (for monitoring)
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronSecret(request)
  if (!auth.success) return auth.response

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
    logger.error('Failed to get campaign status:', error)
    return errorResponse('Failed to get campaign status')
  }
}
