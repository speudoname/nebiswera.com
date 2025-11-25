import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { ContactStatus, Prisma } from '@prisma/client'

interface SegmentFilters {
  status?: ContactStatus | 'all'
  source?: string
  tagIds?: string[]
  search?: string
  createdAfter?: string
  createdBefore?: string
}

// Helper to build Prisma where clause from segment filters
function buildWhereClause(filters: SegmentFilters): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {}

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  if (filters.source && filters.source !== 'all') {
    where.source = filters.source
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: filters.tagIds },
      },
    }
  }

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.createdAfter) {
    where.createdAt = {
      ...((where.createdAt as Prisma.DateTimeFilter) || {}),
      gte: new Date(filters.createdAfter),
    }
  }

  if (filters.createdBefore) {
    where.createdAt = {
      ...((where.createdAt as Prisma.DateTimeFilter) || {}),
      lte: new Date(filters.createdBefore),
    }
  }

  return where
}

// GET - List all segments
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Update contact counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        const filters = segment.filters as SegmentFilters
        const where = buildWhereClause(filters)
        const count = await prisma.contact.count({ where })

        return {
          ...segment,
          contactCount: count,
        }
      })
    )

    return NextResponse.json(segmentsWithCounts)
  } catch (error) {
    console.error('Failed to fetch segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    )
  }
}

// POST - Create a new segment
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { name, description, filters } = body as {
      name: string
      description?: string
      filters: SegmentFilters
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Segment name is required' },
        { status: 400 }
      )
    }

    // Check if segment name already exists
    const existing = await prisma.segment.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A segment with this name already exists' },
        { status: 400 }
      )
    }

    // Calculate initial contact count
    const where = buildWhereClause(filters)
    const contactCount = await prisma.contact.count({ where })

    const segment = await prisma.segment.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        filters: filters as object,
        contactCount,
        createdBy: token?.sub || 'unknown',
      },
    })

    return NextResponse.json(segment)
  } catch (error) {
    console.error('Failed to create segment:', error)
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    )
  }
}
