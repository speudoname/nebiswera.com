import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { CampaignStatus, TargetType, Prisma } from '@prisma/client'

// GET /api/admin/campaigns - List campaigns with filters
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where: Prisma.CampaignWhereInput = {}

  if (status !== 'all') {
    where.status = status as CampaignStatus
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          subject: true,
          status: true,
          targetType: true,
          scheduledAt: true,
          sendingStartedAt: true,
          completedAt: true,
          totalRecipients: true,
          sentCount: true,
          deliveredCount: true,
          openedCount: true,
          clickedCount: true,
          bouncedCount: true,
          createdAt: true,
        },
      }),
      prisma.campaign.count({ where }),
    ])

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// POST /api/admin/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      subject,
      previewText,
      htmlContent,
      textContent,
      fromName,
      fromEmail,
      replyTo,
      targetType,
      targetCriteria,
      scheduledAt,
      scheduledTz,
    } = body

    // Validate required fields
    if (!name || !subject || !targetType) {
      return NextResponse.json(
        { error: 'Name, subject, and target type are required' },
        { status: 400 }
      )
    }

    // Validate target type
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

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        previewText: previewText || null,
        htmlContent: htmlContent || '',
        textContent: textContent || '',
        fromName: fromName || '',
        fromEmail: fromEmail || '',
        replyTo: replyTo || null,
        targetType,
        targetCriteria: targetCriteria || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        scheduledTz: scheduledTz || 'Asia/Tbilisi',
        createdBy: token.sub,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
