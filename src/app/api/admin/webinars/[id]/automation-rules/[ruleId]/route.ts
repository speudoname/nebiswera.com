import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string; ruleId: string }>
}

// PUT /api/admin/webinars/[id]/automation-rules/[ruleId] - Update automation rule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, ruleId } = await params

  try {
    const body = await request.json()
    const { trigger, tagIds, enabled } = body

    // Build update data
    const updateData: any = {}

    if (trigger !== undefined) {
      const validTriggers = ['REGISTERED', 'ATTENDED', 'COMPLETED', 'MISSED']
      if (!validTriggers.includes(trigger)) {
        return NextResponse.json(
          { error: 'Invalid trigger. Must be one of: REGISTERED, ATTENDED, COMPLETED, MISSED' },
          { status: 400 }
        )
      }
      updateData.trigger = trigger
    }

    if (tagIds !== undefined) {
      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        return NextResponse.json({ error: 'tagIds must be a non-empty array' }, { status: 400 })
      }

      // Validate tags exist
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
      })

      if (tags.length !== tagIds.length) {
        return NextResponse.json({ error: 'One or more tag IDs are invalid' }, { status: 400 })
      }

      updateData.tagIds = tagIds
    }

    if (enabled !== undefined) {
      updateData.enabled = enabled
    }

    // Update rule
    const rule = await prisma.webinarAutomationRule.update({
      where: { id: ruleId, webinarId: id },
      data: updateData,
    })

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Failed to update automation rule:', error)
    return NextResponse.json({ error: 'Failed to update automation rule' }, { status: 500 })
  }
}

// DELETE /api/admin/webinars/[id]/automation-rules/[ruleId] - Delete automation rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, ruleId } = await params

  try {
    await prisma.webinarAutomationRule.delete({
      where: { id: ruleId, webinarId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete automation rule:', error)
    return NextResponse.json({ error: 'Failed to delete automation rule' }, { status: 500 })
  }
}
