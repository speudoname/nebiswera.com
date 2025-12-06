import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { syncSuppressions, getSuppressionDump } from '@/app/api/admin/lib/suppression-sync'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

/**
 * GET /api/admin/suppressions - Get suppression stats
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const dump = await getSuppressionDump()
    return NextResponse.json(dump)
  } catch (error) {
    logger.error('Failed to get suppression stats:', error)
    return errorResponse('Failed to get suppression stats')
  }
}

/**
 * POST /api/admin/suppressions - Trigger bidirectional sync
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const result = await syncSuppressions()
    return NextResponse.json(result)
  } catch (error) {
    logger.error('Suppression sync failed:', error)
    return errorResponse('Suppression sync failed')
  }
}
