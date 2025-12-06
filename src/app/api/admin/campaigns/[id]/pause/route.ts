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
    // Use transaction to ensure atomic check-and-update
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id },
        select: { status: true, sentCount: true, totalRecipients: true },
      })

      if (!campaign) {
        return { error: 'not_found' } as const
      }

      // Can only pause SENDING or SCHEDULED campaigns
      if (!['SENDING', 'SCHEDULED'].includes(campaign.status)) {
        return { error: 'invalid_status', status: campaign.status } as const
      }

      await tx.campaign.update({
        where: { id },
        data: { status: 'PAUSED' },
      })

      return { success: true, campaign } as const
    })

    if ('error' in result) {
      if (result.error === 'not_found') {
        return notFoundResponse('Campaign not found')
      }
      return badRequestResponse(`Cannot pause campaign in ${result.status} status`)
    }

    return NextResponse.json({
      success: true,
      status: 'PAUSED',
      sentCount: result.campaign.sentCount,
      totalRecipients: result.campaign.totalRecipients,
      message: `Campaign paused. ${result.campaign.sentCount}/${result.campaign.totalRecipients} sent.`,
    })
  } catch (error) {
    logger.error('Failed to pause campaign:', error)
    return errorResponse('Failed to pause campaign')
  }
}
