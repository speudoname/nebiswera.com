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
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { status: true, sentCount: true, totalRecipients: true },
    })

    if (!campaign) {
      return notFoundResponse('Campaign not found')
    }

    // Cannot cancel completed campaigns
    if (campaign.status === 'COMPLETED') {
      return badRequestResponse('Cannot cancel completed campaign')
    }

    // Already cancelled
    if (campaign.status === 'CANCELLED') {
      return badRequestResponse('Campaign already cancelled')
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    // Mark all pending recipients as skipped
    await prisma.campaignRecipient.updateMany({
      where: {
        campaignId: id,
        status: 'PENDING',
      },
      data: {
        status: 'SKIPPED',
        error: 'Campaign cancelled',
      },
    })

    return NextResponse.json({
      success: true,
      status: 'CANCELLED',
      sentCount: campaign.sentCount,
      totalRecipients: campaign.totalRecipients,
      message: `Campaign cancelled. ${campaign.sentCount} emails were already sent.`,
    })
  } catch (error) {
    logger.error('Failed to cancel campaign:', error)
    return errorResponse('Failed to cancel campaign')
  }
}
