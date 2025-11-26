import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { TargetType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/campaigns/[id] - Get campaign details
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipients: true,
            links: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/campaigns/[id] - Update campaign
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if campaign exists and is editable
    const existing = await prisma.campaign.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Only allow editing DRAFT campaigns
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only edit draft campaigns' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      subject,
      previewText,
      htmlContent,
      textContent,
      designJson,
      fromName,
      fromEmail,
      replyTo,
      targetType,
      targetCriteria,
      scheduledAt,
      scheduledTz,
    } = body

    // Build update data - only include fields that were provided
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (subject !== undefined) updateData.subject = subject
    if (previewText !== undefined) updateData.previewText = previewText
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent
    if (textContent !== undefined) updateData.textContent = textContent
    if (designJson !== undefined) updateData.designJson = designJson
    if (fromName !== undefined) updateData.fromName = fromName
    if (fromEmail !== undefined) updateData.fromEmail = fromEmail
    if (replyTo !== undefined) updateData.replyTo = replyTo
    if (targetType !== undefined) {
      const validTargetTypes: TargetType[] = [
        'ALL_CONTACTS',
        'SEGMENT',
        'TAG',
        'REGISTERED_USERS',
        'CUSTOM_FILTER',
      ]
      if (!validTargetTypes.includes(targetType)) {
        return NextResponse.json(
          { error: 'Invalid target type' },
          { status: 400 }
        )
      }
      updateData.targetType = targetType
    }
    if (targetCriteria !== undefined) updateData.targetCriteria = targetCriteria
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    }
    if (scheduledTz !== undefined) updateData.scheduledTz = scheduledTz

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/campaigns/[id] - Delete campaign
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if campaign exists
    const existing = await prisma.campaign.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Only allow deleting DRAFT or CANCELLED campaigns
    if (!['DRAFT', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Can only delete draft or cancelled campaigns' },
        { status: 400 }
      )
    }

    await prisma.campaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
