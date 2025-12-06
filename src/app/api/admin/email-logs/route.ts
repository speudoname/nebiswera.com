import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import { EmailStatus, EmailType, EmailCategory, Prisma } from '@prisma/client'

// Define which types belong to which category
const TRANSACTIONAL_TYPES: EmailType[] = ['VERIFICATION', 'PASSWORD_RESET', 'WELCOME']
const MARKETING_TYPES: EmailType[] = ['CAMPAIGN', 'NEWSLETTER', 'BROADCAST', 'ANNOUNCEMENT']

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all'
  const type = searchParams.get('type') || 'all'
  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where: Prisma.EmailLogWhereInput = {}

  if (status !== 'all' && Object.values(EmailStatus).includes(status as EmailStatus)) {
    where.status = status as EmailStatus
  }

  if (type !== 'all' && Object.values(EmailType).includes(type as EmailType)) {
    where.type = type as EmailType
  }

  // Filter by category (transactional or marketing)
  if (category === 'TRANSACTIONAL') {
    where.category = EmailCategory.TRANSACTIONAL
  } else if (category === 'MARKETING') {
    where.category = EmailCategory.MARKETING
  }

  if (search) {
    where.to = { contains: search, mode: 'insensitive' }
  }

  const [emails, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sentAt: 'desc' },
    }),
    prisma.emailLog.count({ where }),
  ])

  return NextResponse.json({
    emails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
