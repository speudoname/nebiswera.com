import { isAdmin } from '@/lib/auth/utils'
import {
  unauthorizedResponse,
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/api-response'
import { advanceDay, setWarmupDay, getWarmupState, getWarmupConfig } from '@/lib/warmup'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

// POST /api/admin/warmup/advance - Manually advance warmup day
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { targetDay } = body

    const config = await getWarmupConfig()

    if (config.status !== 'WARMING_UP') {
      return badRequestResponse('Cannot advance warmup - not currently warming up')
    }

    if (targetDay !== undefined) {
      // Set to specific day
      if (typeof targetDay !== 'number' || targetDay < 1 || targetDay > 30) {
        return badRequestResponse('Target day must be between 1 and 30')
      }
      await setWarmupDay(targetDay)
    } else {
      // Advance to next day
      await advanceDay()
    }

    const state = await getWarmupState()

    return successResponse({
      message: targetDay
        ? `Warmup set to day ${targetDay}`
        : `Warmup advanced to day ${state.config.currentDay}`,
      state,
    })
  } catch (error) {
    logger.error('Failed to advance warmup:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to advance warmup'
    )
  }
}
