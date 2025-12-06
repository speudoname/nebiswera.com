import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { parsePaginationParams, createPaginationResult, buildSearchWhere, unauthorizedResponse } from '@/lib'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, skip } = parsePaginationParams(request, { defaultLimit: 10 })
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'

  const where: {
    OR?: { email?: { contains: string; mode: 'insensitive' }; name?: { contains: string; mode: 'insensitive' } }[]
    emailVerified?: { not: null } | null
  } = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status === 'verified') {
    where.emailVerified = { not: null }
  } else if (status === 'unverified') {
    where.emailVerified = null
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  const result = createPaginationResult(users, total, { page, limit, skip })
  return NextResponse.json({
    users: result.data,
    pagination: result.pagination,
  })
}
