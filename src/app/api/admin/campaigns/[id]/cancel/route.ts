import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/cancel - Cancel campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    // Use transaction to ensure atomic check-and-update
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id },
        select: { status: true, sentCount: true, totalRecipients: true },
      })

      if (!campaign) {
        return { error: 'not_found' } as const
      }

      // Cannot cancel completed campaigns
      if (campaign.status === 'COMPLETED') {
        return { error: 'completed' } as const
      }

      // Already cancelled
      if (campaign.status === 'CANCELLED') {
        return { error: 'already_cancelled' } as const
      }

      await tx.campaign.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      // Mark all pending recipients as skipped
      await tx.campaignRecipient.updateMany({
        where: {
          campaignId: id,
          status: 'PENDING',
        },
        data: {
          status: 'SKIPPED',
          error: 'Campaign cancelled',
        },
      })

      return { success: true, campaign } as const
    })

    if ('error' in result) {
      if (result.error === 'not_found') {
        return notFoundResponse('Campaign not found')
      }
      if (result.error === 'completed') {
        return badRequestResponse('Cannot cancel completed campaign')
      }
      return badRequestResponse('Campaign already cancelled')
    }

    return NextResponse.json({
      success: true,
      status: 'CANCELLED',
      sentCount: result.campaign.sentCount,
      totalRecipients: result.campaign.totalRecipients,
      message: `Campaign cancelled. ${result.campaign.sentCount} emails were already sent.`,
    })
  } catch (error) {
    logger.error('Failed to cancel campaign:', error)
    return errorResponse('Failed to cancel campaign')
  }
}
