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
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { email: true },
    })

    if (!contact) {
      return notFoundResponse('Contact not found')
    }

    const [emails, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: { to: contact.email },
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.emailLog.count({
        where: { to: contact.email },
      }),
    ])

    return NextResponse.json({
      emails,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + emails.length < total,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch emails:', error)
    return errorResponse('Failed to fetch emails')
  }
}
