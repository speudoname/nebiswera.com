import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { Prisma, WebinarRegistrationStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VALID_STATUSES: WebinarRegistrationStatus[] = [
  'REGISTERED',
  'ATTENDING',
  'ATTENDED',
  'COMPLETED',
  'MISSED',
]

// GET /api/admin/webinars/[id]/registrations - Get webinar registrations with pagination
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status')
  const sessionId = searchParams.get('sessionId')
  const dateStart = searchParams.get('dateStart') ? new Date(searchParams.get('dateStart')!) : undefined
  const dateEnd = searchParams.get('dateEnd') ? new Date(searchParams.get('dateEnd')!) : undefined
  const engagementLevel = searchParams.get('engagementLevel')

  const skip = (page - 1) * limit

  try {
    // Build where clause
    const where: Prisma.WebinarRegistrationWhereInput = {
      webinarId: id,
    }

    if (status && status !== 'all' && VALID_STATUSES.includes(status as WebinarRegistrationStatus)) {
      where.status = status as WebinarRegistrationStatus
    }

    if (sessionId && sessionId !== 'all') {
      where.sessionId = sessionId
    }

    if (dateStart && dateEnd) {
      where.registeredAt = {
        gte: dateStart,
        lte: dateEnd,
      }
    }

    if (engagementLevel && engagementLevel !== 'all') {
      // Filter by engagement score ranges
      switch (engagementLevel) {
        case 'highly_engaged':
          where.engagementScore = { gte: 80 }
          break
        case 'engaged':
          where.engagementScore = { gte: 60, lt: 80 }
          break
        case 'moderate':
          where.engagementScore = { gte: 40, lt: 60 }
          break
        case 'low':
          where.engagementScore = { gte: 20, lt: 40 }
          break
        case 'minimal':
          where.engagementScore = { lt: 20 }
          break
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get registrations with pagination
    const [registrations, total] = await Promise.all([
      prisma.webinarRegistration.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          sessionType: true,
          registeredAt: true,
          joinedAt: true,
          watchTimeSeconds: true,
          completedAt: true,
          engagementScore: true,
          source: true,
          maxVideoPosition: true,
          webinar: {
            select: {
              videoDuration: true,
            },
          },
        },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webinarRegistration.count({ where }),
    ])

    // Calculate completion percentage for each registration
    const registrationsWithCompletion = registrations.map((reg) => {
      const videoDuration = reg.webinar.videoDuration || 0
      const completionPercent = videoDuration > 0
        ? Math.round((reg.maxVideoPosition / videoDuration) * 100)
        : 0

      return {
        id: reg.id,
        email: reg.email,
        firstName: reg.firstName,
        lastName: reg.lastName,
        status: reg.status,
        sessionType: reg.sessionType,
        registeredAt: reg.registeredAt,
        joinedAt: reg.joinedAt,
        watchTimeSeconds: reg.watchTimeSeconds,
        completedAt: reg.completedAt,
        engagementScore: reg.engagementScore,
        source: reg.source,
        completionPercent,
      }
    })

    return NextResponse.json({
      registrations: registrationsWithCompletion,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}
