import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib/logger'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/sms/campaigns/[id]
 * Get a single SMS campaign with details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const campaign = await prisma.smsCampaign.findUnique({
      where: { id },
      include: {
        recipients: {
          take: 100,
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: { recipients: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    logger.error('Failed to fetch SMS campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/sms/campaigns/[id]
 * Update an SMS campaign
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      message,
      brandId,
      targetType,
      targetCriteria,
      scheduledAt,
      scheduledTz,
      status,
    } = body

    // Verify campaign exists
    const existing = await prisma.smsCampaign.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only allow editing draft or scheduled campaigns
    if (!['DRAFT', 'SCHEDULED'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Cannot edit campaign in current status' },
        { status: 400 }
      )
    }

    const campaign = await prisma.smsCampaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(message && { message }),
        ...(brandId && { brandId }),
        ...(targetType && { targetType }),
        ...(targetCriteria !== undefined && { targetCriteria }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
        ...(scheduledTz && { scheduledTz }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    logger.error('Failed to update SMS campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/sms/campaigns/[id]
 * Delete an SMS campaign
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.smsCampaign.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only allow deleting draft campaigns
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete draft campaigns' },
        { status: 400 }
      )
    }

    await prisma.smsCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete SMS campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
