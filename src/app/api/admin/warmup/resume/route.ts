import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse } from '@/lib/api-response'
import { resumeWarmup, getWarmupState, checkCooldown } from '@/lib/warmup'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

// POST /api/admin/warmup/resume - Resume warmup
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  try {
    // Check for cooldown before resuming
    const cooldown = await checkCooldown()

    await resumeWarmup()
    const state = await getWarmupState()

    return successResponse({
      message: cooldown.isInactive
        ? `Warmup resumed at day ${state.config.currentDay} (cooldown applied from ${cooldown.inactiveDays} days inactive)`
        : 'Warmup resumed successfully',
      cooldownApplied: cooldown.isInactive,
      inactiveDays: cooldown.inactiveDays,
      state,
    })
  } catch (error) {
    logger.error('Failed to resume warmup:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to resume warmup'
    )
  }
}
