import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
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

// GET - Get segment by ID with contact count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const segment = await prisma.segment.findUnique({
      where: { id },
    })

    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    // Get current contact count
    const filters = segment.filters as SegmentFilters
    const where = buildWhereClause(filters)
    const contactCount = await prisma.contact.count({ where })

    return NextResponse.json({
      ...segment,
      contactCount,
    })
  } catch (error) {
    console.error('Failed to fetch segment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch segment' },
      { status: 500 }
    )
  }
}

// PATCH - Update segment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { name, description, filters } = body

    const existing = await prisma.segment.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      )
    }

    // Check if name is taken by another segment
    if (name && name.trim() !== existing.name) {
      const nameTaken = await prisma.segment.findUnique({
        where: { name: name.trim() },
      })
      if (nameTaken) {
        return NextResponse.json(
          { error: 'A segment with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Calculate new contact count if filters changed
    let contactCount = existing.contactCount
    if (filters) {
      const where = buildWhereClause(filters)
      contactCount = await prisma.contact.count({ where })
    }

    const segment = await prisma.segment.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(filters && { filters, contactCount }),
      },
    })

    return NextResponse.json(segment)
  } catch (error) {
    console.error('Failed to update segment:', error)
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    )
  }
}

// DELETE - Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.segment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete segment:', error)
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    )
  }
}
