import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse } from '@/lib/api-response'
import { pauseWarmup, getWarmupState } from '@/lib/warmup'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

// POST /api/admin/warmup/pause - Pause warmup
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    await pauseWarmup(reason)
    const state = await getWarmupState()

    return successResponse({
      message: 'Warmup paused successfully',
      state,
    })
  } catch (error) {
    logger.error('Failed to pause warmup:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to pause warmup'
    )
  }
}
