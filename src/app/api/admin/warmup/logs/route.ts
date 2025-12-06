import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse } from '@/lib/api-response'
import { getWarmupLogs } from '@/lib/warmup'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

// GET /api/admin/warmup/logs - Get warmup history
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    const logs = await getWarmupLogs(limit)

    return successResponse({ logs })
  } catch (error) {
    logger.error('Failed to get warmup logs:', error)
    return errorResponse('Failed to get warmup logs')
  }
}
