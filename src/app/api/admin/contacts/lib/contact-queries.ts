/**
 * Contact Query Utilities
 *
 * Shared query builders for contact filtering
 */

import type { ContactStatus, Prisma } from '@prisma/client'

export interface ContactFilters {
  search?: string
  status?: ContactStatus | 'all'
  source?: string
  tagId?: string // Single tag filter
  tagIds?: string[] // Multiple tags filter
  createdAfter?: string
  createdBefore?: string
}

/**
 * Build Prisma where clause from contact filters
 *
 * Handles all filter types including search, status, source, tags, and date ranges
 */
export function buildContactWhereClause(filters: ContactFilters): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {}

  // Text search across email, name, phone
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  // Source filter
  if (filters.source && filters.source !== 'all') {
    where.source = filters.source
  }

  // Tag filter - single tag
  if (filters.tagId) {
    where.tags = {
      some: { tagId: filters.tagId },
    }
  }

  // Tag filter - multiple tags
  if (filters.tagIds && filters.tagIds.length > 0) {
    where.tags = {
      some: {
        tagId: { in: filters.tagIds },
      },
    }
  }

  // Date range filters
  if (filters.createdAfter || filters.createdBefore) {
    const dateFilter: Prisma.DateTimeFilter = {}

    if (filters.createdAfter) {
      dateFilter.gte = new Date(filters.createdAfter)
    }

    if (filters.createdBefore) {
      dateFilter.lte = new Date(filters.createdBefore)
    }

    where.createdAt = dateFilter
  }

  return where
}
