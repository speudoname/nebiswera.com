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

  const skip = (page - 1) * limit

  try {
    // Build where clause
    const where: Prisma.WebinarRegistrationWhereInput = {
      webinarId: id,
    }

    if (status && status !== 'all' && VALID_STATUSES.includes(status as WebinarRegistrationStatus)) {
      where.status = status as WebinarRegistrationStatus
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
        },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webinarRegistration.count({ where }),
    ])

    return NextResponse.json({
      registrations,
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
