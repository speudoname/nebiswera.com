import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/cancel - Cancel campaign
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

    // Cannot cancel completed campaigns
    if (campaign.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed campaign' },
        { status: 400 }
      )
    }

    // Already cancelled
    if (campaign.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Campaign already cancelled' },
        { status: 400 }
      )
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
    console.error('Failed to cancel campaign:', error)
    return NextResponse.json(
      { error: 'Failed to cancel campaign' },
      { status: 500 }
    )
  }
}
