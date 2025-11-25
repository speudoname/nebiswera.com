import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import { EmailStatus, EmailType } from '@prisma/client'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || 'all'
  const type = searchParams.get('type') || 'all'
  const search = searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const where: {
    status?: EmailStatus
    type?: EmailType
    to?: { contains: string; mode: 'insensitive' }
  } = {}

  if (status !== 'all' && Object.values(EmailStatus).includes(status as EmailStatus)) {
    where.status = status as EmailStatus
  }

  if (type !== 'all' && Object.values(EmailType).includes(type as EmailType)) {
    where.type = type as EmailType
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
