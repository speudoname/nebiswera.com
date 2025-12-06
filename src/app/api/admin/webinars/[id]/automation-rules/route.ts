import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/automation-rules - Get all automation rules for a webinar
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const rules = await prisma.webinarAutomationRule.findMany({
      where: { webinarId: id },
      orderBy: { createdAt: 'asc' },
    })

    // Batch-fetch all tags at once to avoid N+1 queries
    const allTagIds = Array.from(new Set(rules.flatMap((rule) => rule.tagIds)))
    const allTags = allTagIds.length > 0
      ? await prisma.tag.findMany({
          where: { id: { in: allTagIds } },
          select: { id: true, name: true, color: true },
        })
      : []

    // Create a map for quick lookup
    const tagMap = new Map(allTags.map((tag) => [tag.id, tag]))

    // Map tags to each rule
    const rulesWithTagNames = rules.map((rule) => ({
      ...rule,
      tags: rule.tagIds.map((tagId) => tagMap.get(tagId)).filter(Boolean),
    }))

    return NextResponse.json({ rules: rulesWithTagNames })
  } catch (error) {
    logger.error('Failed to fetch automation rules:', error)
    return errorResponse('Failed to fetch automation rules')
  }
}

// POST /api/admin/webinars/[id]/automation-rules - Create new automation rule
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { trigger, tagIds, enabled } = body

    // Validate required fields
    if (!trigger || !tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return badRequestResponse('trigger and tagIds are required')
    }

    // Validate trigger
    const validTriggers = ['REGISTERED', 'ATTENDED', 'COMPLETED', 'MISSED']
    if (!validTriggers.includes(trigger)) {
      return badRequestResponse('Invalid trigger. Must be one of: REGISTERED, ATTENDED, COMPLETED, MISSED')
    }

    // Validate tags exist
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    })

    if (tags.length !== tagIds.length) {
      return badRequestResponse('One or more tag IDs are invalid')
    }

    // Create rule
    const rule = await prisma.webinarAutomationRule.create({
      data: {
        webinarId: id,
        trigger,
        tagIds,
        enabled: enabled !== undefined ? enabled : true,
      },
    })

    return NextResponse.json({ rule })
  } catch (error) {
    logger.error('Failed to create automation rule:', error)
    return errorResponse('Failed to create automation rule')
  }
}
