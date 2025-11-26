import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/send - Start sending campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: { recipients: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Validate campaign is in correct state
    if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: `Cannot send campaign in ${campaign.status} status` },
        { status: 400 }
      )
    }

    // Check recipients exist
    if (campaign._count.recipients === 0) {
      return NextResponse.json(
        { error: 'No recipients prepared. Run prepare first.' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!campaign.htmlContent || !campaign.textContent) {
      return NextResponse.json(
        { error: 'Campaign content is incomplete' },
        { status: 400 }
      )
    }

    if (!campaign.fromEmail || !campaign.fromName) {
      return NextResponse.json(
        { error: 'Sender information is incomplete' },
        { status: 400 }
      )
    }

    // Check for scheduled send
    const body = await request.json().catch(() => ({}))
    const { schedule } = body

    if (schedule) {
      // Schedule for later
      const scheduledAt = new Date(schedule.at)
      if (scheduledAt <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }

      await prisma.campaign.update({
        where: { id },
        data: {
          status: 'SCHEDULED',
          scheduledAt,
          scheduledTz: schedule.timezone || 'Asia/Tbilisi',
        },
      })

      return NextResponse.json({
        success: true,
        status: 'SCHEDULED',
        scheduledAt,
        message: `Campaign scheduled for ${scheduledAt.toISOString()}`,
      })
    }

    // Start sending immediately
    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'SENDING',
        sendingStartedAt: new Date(),
      },
    })

    // Trigger background processing
    // In production, this would be handled by a cron job or queue
    // For now, we'll process synchronously in smaller batches
    // The actual sending logic will be in a separate service

    return NextResponse.json({
      success: true,
      status: 'SENDING',
      totalRecipients: campaign._count.recipients,
      message: 'Campaign sending started. Check stats for progress.',
    })
  } catch (error) {
    console.error('Failed to start campaign:', error)
    return NextResponse.json(
      { error: 'Failed to start campaign' },
      { status: 500 }
    )
  }
}
