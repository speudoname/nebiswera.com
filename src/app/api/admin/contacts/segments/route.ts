import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { buildContactWhereClause, type ContactFilters } from '@/app/api/admin/contacts/lib/contact-queries'
import { unauthorizedResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

// GET - List all segments
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Update contact counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        const filters = segment.filters as ContactFilters
        const where = buildContactWhereClause(filters)
        const count = await prisma.contact.count({ where })

        return {
          ...segment,
          contactCount: count,
        }
      })
    )

    return NextResponse.json(segmentsWithCounts)
  } catch (error) {
    logger.error('Failed to fetch segments:', error)
    return errorResponse('Failed to fetch segments')
  }
}

// POST - Create a new segment
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { name, description, filters } = body as {
      name: string
      description?: string
      filters: ContactFilters
    }

    if (!name?.trim()) {
      return badRequestResponse('Segment name is required')
    }

    // Check if segment name already exists
    const existing = await prisma.segment.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return badRequestResponse('A segment with this name already exists')
    }

    // Calculate initial contact count
    const where = buildContactWhereClause(filters)
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
    logger.error('Failed to create segment:', error)
    return errorResponse('Failed to create segment')
  }
}
