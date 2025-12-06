/**
 * Warmup Daily Cron Job
 *
 * Runs once daily to:
 * 1. Reset daily send counter
 * 2. Check for cooldown (inactivity)
 * 3. Check metrics and advance day if healthy
 * 4. Auto-pause if critical thresholds exceeded
 * 5. Recalculate contact engagement tiers
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/middleware/cron'
import { logger } from '@/lib'
import {
  getWarmupConfig,
  resetDailyCounter,
  applyCooldownIfNeeded,
  canProgress,
  advanceDay,
  shouldAutoPause,
  pauseWarmup,
  recalculateAllEngagementTiers,
} from '@/lib/warmup'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const auth = verifyCronSecret(request)
  if (!auth.success) {
    return auth.response
  }

  try {
    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    }

    // Get current warmup config
    const config = await getWarmupConfig()
    results.status = config.status
    results.currentDay = config.currentDay

    // Only perform warmup operations if warming up
    if (config.status === 'WARMING_UP') {
      // 1. Check for auto-pause conditions
      const pauseCheck = await shouldAutoPause()
      if (pauseCheck.shouldPause) {
        await pauseWarmup(pauseCheck.reason)
        results.autoPaused = true
        results.pauseReason = pauseCheck.reason
        logger.warn('Warmup auto-paused:', pauseCheck.reason)
      } else {
        // 2. Check for cooldown (inactivity)
        const cooldownResult = await applyCooldownIfNeeded()
        if (cooldownResult.applied) {
          results.cooldownApplied = true
          results.cooldownFrom = cooldownResult.previousDay
          results.cooldownTo = cooldownResult.newDay
          logger.info(
            `Warmup cooldown applied: day ${cooldownResult.previousDay} → ${cooldownResult.newDay}`
          )
        }

        // 3. Check if we can progress to next day
        const progressCheck = await canProgress()
        results.metrics = progressCheck.metrics

        if (progressCheck.canProgress) {
          await advanceDay()
          results.advanced = true
          results.newDay = config.currentDay + 1
          logger.info(`Warmup advanced to day ${config.currentDay + 1}`)
        } else {
          results.advanced = false
          results.advanceBlockedReason = progressCheck.reason
        }

        // 4. Reset daily counter for new day
        await resetDailyCounter()
        results.dailyCounterReset = true
      }
    }

    // 5. Recalculate all contact engagement tiers (regardless of warmup status)
    const tierResults = await recalculateAllEngagementTiers()
    results.tierRecalculation = tierResults

    logger.info('Warmup daily cron completed', results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    logger.error('Warmup daily cron error:', error)
    return NextResponse.json(
      { success: false, error: 'Warmup daily cron failed' },
      { status: 500 }
    )
  }
}
