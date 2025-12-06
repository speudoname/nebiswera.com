import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { CampaignStatus, TargetType, Prisma } from '@prisma/client'

// GET /api/admin/campaigns - List campaigns with filters
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
    logger.error('Failed to fetch campaigns:', error)
    return errorResponse('Failed to fetch campaigns')
  }
}

// POST /api/admin/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const token = await getAuthToken(request)
    if (!token?.sub) {
      return unauthorizedResponse()
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

    // Validate required fields
    if (!name || !subject || !targetType) {
      return badRequestResponse('Name, subject, and target type are required')
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
      return badRequestResponse('Invalid target type')
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        previewText: previewText || null,
        htmlContent: htmlContent || '',
        textContent: textContent || '',
        designJson: designJson || null,
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
    logger.error('Failed to create campaign:', error)
    return errorResponse('Failed to create campaign')
  }
}
