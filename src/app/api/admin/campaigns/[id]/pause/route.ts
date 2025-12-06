import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/pause - Pause sending campaign
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

    // Can only pause SENDING or SCHEDULED campaigns
    if (!['SENDING', 'SCHEDULED'].includes(campaign.status)) {
      return badRequestResponse(`Cannot pause campaign in ${campaign.status} status`)
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    })

    return NextResponse.json({
      success: true,
      status: 'PAUSED',
      sentCount: campaign.sentCount,
      totalRecipients: campaign.totalRecipients,
      message: `Campaign paused. ${campaign.sentCount}/${campaign.totalRecipients} sent.`,
    })
  } catch (error) {
    logger.error('Failed to pause campaign:', error)
    return errorResponse('Failed to pause campaign')
  }
}
