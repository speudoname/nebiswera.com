import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/automation-rules - Get all automation rules for a webinar
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const rules = await prisma.webinarAutomationRule.findMany({
      where: { webinarId: id },
      orderBy: { createdAt: 'asc' },
    })

    // Get tag names for each rule
    const rulesWithTagNames = await Promise.all(
      rules.map(async (rule) => {
        const tags = await prisma.tag.findMany({
          where: { id: { in: rule.tagIds } },
          select: { id: true, name: true, color: true },
        })

        return {
          ...rule,
          tags,
        }
      })
    )

    return NextResponse.json({ rules: rulesWithTagNames })
  } catch (error) {
    console.error('Failed to fetch automation rules:', error)
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 })
  }
}

// POST /api/admin/webinars/[id]/automation-rules - Create new automation rule
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { trigger, tagIds, enabled } = body

    // Validate required fields
    if (!trigger || !tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'trigger and tagIds are required' },
        { status: 400 }
      )
    }

    // Validate trigger
    const validTriggers = ['REGISTERED', 'ATTENDED', 'COMPLETED', 'MISSED']
    if (!validTriggers.includes(trigger)) {
      return NextResponse.json(
        { error: 'Invalid trigger. Must be one of: REGISTERED, ATTENDED, COMPLETED, MISSED' },
        { status: 400 }
      )
    }

    // Validate tags exist
    const tags = await prisma.tag.findMany({
      where: { id: { in: tagIds } },
    })

    if (tags.length !== tagIds.length) {
      return NextResponse.json({ error: 'One or more tag IDs are invalid' }, { status: 400 })
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
    console.error('Failed to create automation rule:', error)
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 })
  }
}
