import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/send - Start sending campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
      return notFoundResponse('Campaign not found')
    }

    // Validate campaign is in correct state
    if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status)) {
      return badRequestResponse(`Cannot send campaign in ${campaign.status} status`)
    }

    // Check recipients exist
    if (campaign._count.recipients === 0) {
      return badRequestResponse('No recipients prepared. Run prepare first.')
    }

    // Validate required fields
    if (!campaign.htmlContent || !campaign.textContent) {
      return badRequestResponse('Campaign content is incomplete')
    }

    if (!campaign.fromEmail || !campaign.fromName) {
      return badRequestResponse('Sender information is incomplete')
    }

    // Check for scheduled send
    const body = await request.json().catch(() => ({}))
    const { schedule } = body

    if (schedule) {
      // Schedule for later
      const scheduledAt = new Date(schedule.at)
      if (scheduledAt <= new Date()) {
        return badRequestResponse('Scheduled time must be in the future')
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
    logger.error('Failed to start campaign:', error)
    return errorResponse('Failed to start campaign')
  }
}
