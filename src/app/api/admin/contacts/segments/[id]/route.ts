import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
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
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const segment = await prisma.segment.findUnique({
      where: { id },
    })

    if (!segment) {
      return notFoundResponse('Segment not found')
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
    logger.error('Failed to fetch segment:', error)
    return errorResponse('Failed to fetch segment')
  }
}

// PATCH - Update segment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { name, description, filters } = body

    const existing = await prisma.segment.findUnique({
      where: { id },
    })

    if (!existing) {
      return notFoundResponse('Segment not found')
    }

    // Check if name is taken by another segment
    if (name && name.trim() !== existing.name) {
      const nameTaken = await prisma.segment.findUnique({
        where: { name: name.trim() },
      })
      if (nameTaken) {
        return badRequestResponse('A segment with this name already exists')
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
    logger.error('Failed to update segment:', error)
    return errorResponse('Failed to update segment')
  }
}

// DELETE - Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    await prisma.segment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete segment:', error)
    return errorResponse('Failed to delete segment')
  }
}
