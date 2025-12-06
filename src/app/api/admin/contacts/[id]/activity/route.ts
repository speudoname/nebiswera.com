import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!contact) {
      return notFoundResponse('Contact not found')
    }

    const [activities, total] = await Promise.all([
      prisma.contactActivity.findMany({
        where: { contactId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.contactActivity.count({
        where: { contactId: id },
      }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + activities.length < total,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch activities:', error)
    return errorResponse('Failed to fetch activities')
  }
}
