/**
 * Shared pagination utilities for API routes
 * Provides consistent pagination parameter parsing and response formatting
 */

import { NextRequest } from 'next/server'

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const

/**
 * Parse pagination parameters from request URL
 * Validates and sanitizes input values
 */
export function parsePaginationParams(
  request: NextRequest,
  options?: {
    defaultLimit?: number
    maxLimit?: number
  }
): PaginationParams {
  const { searchParams } = new URL(request.url)

  const defaultLimit = options?.defaultLimit || PAGINATION_DEFAULTS.limit
  const maxLimit = options?.maxLimit || PAGINATION_DEFAULTS.maxLimit

  // Parse and validate page (minimum 1)
  let page = parseInt(searchParams.get('page') || '1', 10)
  if (isNaN(page) || page < 1) {
    page = PAGINATION_DEFAULTS.page
  }

  // Parse and validate limit (between 1 and maxLimit)
  let limit = parseInt(searchParams.get('limit') || String(defaultLimit), 10)
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit
  }
  if (limit > maxLimit) {
    limit = maxLimit
  }

  // Calculate skip for database query
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Create pagination result object for API response
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginationResult<T> {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  }
}

/**
 * Parse search/filter parameters commonly used in list endpoints
 */
export function parseSearchParams(
  request: NextRequest,
  allowedFilters: string[] = []
): {
  search: string | null
  filters: Record<string, string>
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
} {
  const { searchParams } = new URL(request.url)

  // Get search term
  const search = searchParams.get('search') || searchParams.get('q') || null

  // Get allowed filters
  const filters: Record<string, string> = {}
  for (const key of allowedFilters) {
    const value = searchParams.get(key)
    if (value) {
      filters[key] = value
    }
  }

  // Get sort parameters
  const sortBy = searchParams.get('sortBy') || searchParams.get('sort') || null
  const sortOrderParam = searchParams.get('sortOrder') || searchParams.get('order') || 'desc'
  const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc'

  return { search, filters, sortBy, sortOrder }
}

/**
 * Build Prisma where clause for text search across multiple fields
 */
export function buildSearchWhere(
  search: string | null,
  fields: string[]
): Record<string, unknown> | undefined {
  if (!search || fields.length === 0) {
    return undefined
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    })),
  }
}

/**
 * Build Prisma orderBy clause from sort parameters
 */
export function buildOrderBy(
  sortBy: string | null,
  sortOrder: 'asc' | 'desc',
  defaultSort: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
): Record<string, 'asc' | 'desc'> {
  if (!sortBy) {
    return defaultSort
  }
  return { [sortBy]: sortOrder }
}
