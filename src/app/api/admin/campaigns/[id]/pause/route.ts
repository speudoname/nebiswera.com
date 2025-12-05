import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/pause - Pause sending campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { status: true, sentCount: true, totalRecipients: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Can only pause SENDING or SCHEDULED campaigns
    if (!['SENDING', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: `Cannot pause campaign in ${campaign.status} status` },
        { status: 400 }
      )
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
    return NextResponse.json(
      { error: 'Failed to pause campaign' },
      { status: 500 }
    )
  }
}
