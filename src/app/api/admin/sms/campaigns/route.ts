import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { logger } from '@/lib/logger'

/**
 * GET /api/admin/sms/campaigns
 * List all SMS campaigns with pagination
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const [campaigns, total] = await Promise.all([
      prisma.smsCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { recipients: true },
          },
        },
      }),
      prisma.smsCampaign.count({ where }),
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
    logger.error('Failed to fetch SMS campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/sms/campaigns
 * Create a new SMS campaign
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request)
    if (token?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      message,
      brandId,
      targetType,
      targetCriteria,
      scheduledAt,
      scheduledTz,
    } = body

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      )
    }

    // Get default brand if not provided
    let useBrandId = brandId
    if (!useBrandId) {
      const settings = await prisma.smsSettings.findFirst()
      useBrandId = settings?.defaultBrandId
    }

    if (!useBrandId) {
      return NextResponse.json(
        { error: 'No brand ID configured' },
        { status: 400 }
      )
    }

    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        message,
        brandId: useBrandId,
        targetType: targetType || 'ALL',
        targetCriteria: targetCriteria || null,
        status: 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        scheduledTz: scheduledTz || 'Asia/Tbilisi',
        createdBy: token.sub as string,
      },
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    logger.error('Failed to create SMS campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
