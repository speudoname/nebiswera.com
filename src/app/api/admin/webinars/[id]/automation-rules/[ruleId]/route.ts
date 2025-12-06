import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string; ruleId: string }>
}

// PUT /api/admin/webinars/[id]/automation-rules/[ruleId] - Update automation rule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
        return badRequestResponse('Invalid trigger. Must be one of: REGISTERED, ATTENDED, COMPLETED, MISSED')
      }
      updateData.trigger = trigger
    }

    if (tagIds !== undefined) {
      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        return badRequestResponse('tagIds must be a non-empty array')
      }

      // Validate tags exist
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
      })

      if (tags.length !== tagIds.length) {
        return badRequestResponse('One or more tag IDs are invalid')
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
    logger.error('Failed to update automation rule:', error)
    return errorResponse('Failed to update automation rule')
  }
}

// DELETE /api/admin/webinars/[id]/automation-rules/[ruleId] - Delete automation rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id, ruleId } = await params

  try {
    await prisma.webinarAutomationRule.delete({
      where: { id: ruleId, webinarId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete automation rule:', error)
    return errorResponse('Failed to delete automation rule')
  }
}
