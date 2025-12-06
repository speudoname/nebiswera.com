/**
 * Warmup Service - Core warmup logic for email marketing
 *
 * Manages the 30-day warmup schedule, tracks daily limits,
 * handles cooldown detection, and provides metrics.
 */

import { prisma } from '@/lib/db'
import type { WarmupStatus, EngagementTier, WarmupConfig } from '@prisma/client'
import type { WarmupState, WarmupSendResult, WarmupMetrics, WarmupPhase } from './types'
import { WARMUP_THRESHOLDS, MARKETING_SERVER_ID, MARKETING_SERVER_NAME } from './types'
import {
  getScheduleForDay,
  getPhaseForDay,
  getDailyLimitForDay,
  getAllowedTiersForDay,
  calculateResumeDay,
} from './schedule'

/**
 * Get or create warmup configuration for the marketing server
 */
export async function getWarmupConfig(): Promise<WarmupConfig> {
  let config = await prisma.warmupConfig.findUnique({
    where: { serverId: MARKETING_SERVER_ID },
  })

  if (!config) {
    // Create default config - not started yet
    config = await prisma.warmupConfig.create({
      data: {
        serverId: MARKETING_SERVER_ID,
        serverName: MARKETING_SERVER_NAME,
        status: 'NOT_STARTED',
        currentDay: 0,
        sentToday: 0,
        startedAt: null,
        pausedAt: null,
      },
    })
  }

  return config
}

/**
 * Get comprehensive warmup state including schedule, metrics, and health
 */
export async function getWarmupState(): Promise<WarmupState> {
  const config = await getWarmupConfig()
  const schedule = config.currentDay > 0 ? getScheduleForDay(config.currentDay) : null
  const metrics = await getRecentMetrics()
  const health = calculateHealth(config.status, metrics)

  return {
    config,
    schedule,
    remainingToday: getRemainingFromConfig(config),
    allowedTiers: config.currentDay > 0 ? getAllowedTiersForDay(config.currentDay) : [],
    phase: config.currentDay > 0 ? getPhaseForDay(config.currentDay) : null,
    progress: {
      currentDay: config.currentDay,
      totalDays: 30,
      percentComplete: Math.min(100, Math.round((config.currentDay / 30) * 100)),
    },
    metrics,
    health,
  }
}

/**
 * Calculate remaining sends for today based on config
 */
function getRemainingFromConfig(config: WarmupConfig): number {
  if (config.status !== 'WARMING_UP') return 0
  const dailyLimit = getDailyLimitForDay(config.currentDay)
  if (dailyLimit === -1) return Infinity
  return Math.max(0, dailyLimit - config.sentToday)
}

/**
 * Calculate health status based on warmup status and metrics
 */
function calculateHealth(
  status: WarmupStatus,
  metrics: WarmupMetrics | null
): 'healthy' | 'warning' | 'critical' | 'unknown' {
  if (status === 'NOT_STARTED' || status === 'PAUSED') return 'unknown'
  if (!metrics || metrics.sent === 0) return 'unknown'

  // Critical thresholds
  if (
    metrics.spamRate > WARMUP_THRESHOLDS.CRITICAL_SPAM_RATE ||
    metrics.bounceRate > WARMUP_THRESHOLDS.CRITICAL_BOUNCE_RATE
  ) {
    return 'critical'
  }

  // Warning thresholds
  if (
    metrics.bounceRate > WARMUP_THRESHOLDS.MAX_BOUNCE_RATE ||
    metrics.openRate < WARMUP_THRESHOLDS.MIN_OPEN_RATE
  ) {
    return 'warning'
  }

  return 'healthy'
}

/**
 * Start the warmup process
 */
export async function startWarmup(): Promise<WarmupConfig> {
  const config = await getWarmupConfig()

  if (config.status === 'WARMING_UP') {
    throw new Error('Warmup is already active')
  }

  const now = new Date()

  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      status: 'WARMING_UP',
      currentDay: 1,
      sentToday: 0,
      startedAt: now,
      pausedAt: null,
    },
  })
}

/**
 * Pause the warmup process
 */
export async function pauseWarmup(reason?: string): Promise<WarmupConfig> {
  const config = await getWarmupConfig()

  if (config.status !== 'WARMING_UP') {
    throw new Error('Warmup is not active')
  }

  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
      pauseReason: reason || null,
    },
  })
}

/**
 * Resume the warmup process
 * Automatically handles cooldown if there was a long pause
 */
export async function resumeWarmup(): Promise<WarmupConfig> {
  const config = await getWarmupConfig()

  if (config.status !== 'PAUSED') {
    throw new Error('Warmup is not paused')
  }

  // Check for cooldown
  let resumeDay = config.currentDay
  if (config.pausedAt) {
    const inactiveDays = Math.floor(
      (Date.now() - config.pausedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    resumeDay = calculateResumeDay(config.currentDay, inactiveDays)
  }

  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      status: 'WARMING_UP',
      currentDay: resumeDay,
      sentToday: 0,
      pausedAt: null,
      pauseReason: null,
    },
  })
}

/**
 * Check if we can send to a specific tier right now
 */
export async function canSendToTier(tier: EngagementTier): Promise<WarmupSendResult> {
  const config = await getWarmupConfig()

  if (config.status !== 'WARMING_UP') {
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      reason: `Warmup is ${config.status.toLowerCase()}`,
      allowedTiers: [],
    }
  }

  const dailyLimit = getDailyLimitForDay(config.currentDay)
  const remaining = dailyLimit === -1 ? Infinity : dailyLimit - config.sentToday
  const allowedTiers = getAllowedTiersForDay(config.currentDay)

  if (!allowedTiers.includes(tier)) {
    return {
      allowed: false,
      limit: dailyLimit,
      remaining,
      reason: `${tier} tier not allowed in current phase (Day ${config.currentDay})`,
      allowedTiers,
    }
  }

  if (remaining <= 0 && dailyLimit !== -1) {
    return {
      allowed: false,
      limit: dailyLimit,
      remaining: 0,
      reason: 'Daily limit reached',
      allowedTiers,
    }
  }

  return {
    allowed: true,
    limit: dailyLimit,
    remaining,
    allowedTiers,
  }
}

/**
 * Check how many emails can be sent right now
 */
export async function getRemainingToday(): Promise<{
  remaining: number
  limit: number
  allowedTiers: EngagementTier[]
}> {
  const config = await getWarmupConfig()

  if (config.status !== 'WARMING_UP') {
    return { remaining: 0, limit: 0, allowedTiers: [] }
  }

  const limit = getDailyLimitForDay(config.currentDay)
  const remaining = limit === -1 ? Infinity : limit - config.sentToday
  const allowedTiers = getAllowedTiersForDay(config.currentDay)

  return { remaining: Math.max(0, remaining), limit, allowedTiers }
}

/**
 * Record that emails were sent (updates daily counter)
 */
export async function recordSent(count: number): Promise<WarmupConfig> {
  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      sentToday: { increment: count },
      lastActivityAt: new Date(),
    },
  })
}

/**
 * Advance to the next warmup day
 * Called by cron job after successful day with good metrics
 */
export async function advanceDay(): Promise<WarmupConfig> {
  const config = await getWarmupConfig()

  if (config.status !== 'WARMING_UP') {
    throw new Error('Cannot advance - warmup not active')
  }

  const newDay = config.currentDay + 1

  // Log the day that just completed
  await logWarmupDay(config)

  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      currentDay: newDay,
      sentToday: 0,
    },
  })
}

/**
 * Reset daily counter (called at start of new day)
 */
export async function resetDailyCounter(): Promise<WarmupConfig> {
  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      sentToday: 0,
    },
  })
}

/**
 * Log warmup day metrics
 */
async function logWarmupDay(config: WarmupConfig): Promise<void> {
  const metrics = await getRecentMetrics()
  const schedule = getScheduleForDay(config.currentDay)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day

  await prisma.warmupLog.create({
    data: {
      configId: config.id,
      date: today,
      day: config.currentDay,
      phase: schedule?.phase || 'unknown',
      dailyLimit: schedule?.dailyLimit || 0,
      sent: config.sentToday,
      delivered: metrics?.delivered || 0,
      opened: metrics?.opened || 0,
      clicked: metrics?.clicked || 0,
      bounced: metrics?.bounced || 0,
      complained: metrics?.complained || 0,
      openRate: metrics?.openRate || null,
      bounceRate: metrics?.bounceRate || null,
      spamRate: metrics?.spamRate || null,
      clickRate: metrics?.clickRate || null,
    },
  })
}

/**
 * Check for cooldown (inactivity)
 * Returns the number of days inactive, or 0 if active
 */
export async function checkCooldown(): Promise<{
  isInactive: boolean
  inactiveDays: number
  recommendedDay: number
}> {
  const config = await getWarmupConfig()

  if (config.status !== 'WARMING_UP' || !config.lastActivityAt) {
    return { isInactive: false, inactiveDays: 0, recommendedDay: config.currentDay }
  }

  const inactiveDays = Math.floor(
    (Date.now() - config.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const recommendedDay = calculateResumeDay(config.currentDay, inactiveDays)

  return {
    isInactive: inactiveDays >= WARMUP_THRESHOLDS.MINOR_COOLDOWN_DAYS,
    inactiveDays,
    recommendedDay,
  }
}

/**
 * Apply cooldown adjustment if needed
 */
export async function applyCooldownIfNeeded(): Promise<{
  applied: boolean
  previousDay: number
  newDay: number
}> {
  const cooldown = await checkCooldown()

  if (!cooldown.isInactive) {
    const config = await getWarmupConfig()
    return { applied: false, previousDay: config.currentDay, newDay: config.currentDay }
  }

  const config = await getWarmupConfig()
  const previousDay = config.currentDay

  await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      currentDay: cooldown.recommendedDay,
      sentToday: 0,
    },
  })

  return {
    applied: true,
    previousDay,
    newDay: cooldown.recommendedDay,
  }
}

/**
 * Get recent email metrics for warmup health assessment
 * Looks at emails sent in the last 24-48 hours
 */
export async function getRecentMetrics(): Promise<WarmupMetrics | null> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours

  const logs = await prisma.emailLog.findMany({
    where: {
      category: 'MARKETING',
      sentAt: { gte: since },
    },
    select: {
      status: true,
    },
  })

  if (logs.length === 0) {
    return null
  }

  const sent = logs.length
  const delivered = logs.filter((l) => l.status === 'DELIVERED').length
  const opened = logs.filter((l) => l.status === 'OPENED').length
  const bounced = logs.filter((l) => l.status === 'BOUNCED').length
  const complained = logs.filter((l) => l.status === 'SPAM_COMPLAINT').length

  // Clicks are tracked in campaign recipients, not email logs
  // For simplicity, estimate clicks as a fraction of opens (industry avg ~20% of opens)
  const clicked = Math.floor(opened * 0.2)

  return {
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    complained,
    openRate: sent > 0 ? opened / sent : 0,
    bounceRate: sent > 0 ? bounced / sent : 0,
    spamRate: sent > 0 ? complained / sent : 0,
    clickRate: sent > 0 ? clicked / sent : 0,
  }
}

/**
 * Check if metrics allow progression to next day
 */
export async function canProgress(): Promise<{
  canProgress: boolean
  reason?: string
  metrics: WarmupMetrics | null
}> {
  const metrics = await getRecentMetrics()

  if (!metrics || metrics.sent < 10) {
    return {
      canProgress: false,
      reason: 'Insufficient data (need at least 10 sends)',
      metrics,
    }
  }

  // Check critical thresholds
  if (metrics.spamRate > WARMUP_THRESHOLDS.CRITICAL_SPAM_RATE) {
    return {
      canProgress: false,
      reason: `Spam rate too high (${(metrics.spamRate * 100).toFixed(2)}% > ${WARMUP_THRESHOLDS.CRITICAL_SPAM_RATE * 100}%)`,
      metrics,
    }
  }

  if (metrics.bounceRate > WARMUP_THRESHOLDS.CRITICAL_BOUNCE_RATE) {
    return {
      canProgress: false,
      reason: `Bounce rate too high (${(metrics.bounceRate * 100).toFixed(2)}% > ${WARMUP_THRESHOLDS.CRITICAL_BOUNCE_RATE * 100}%)`,
      metrics,
    }
  }

  // Check progression thresholds
  if (metrics.bounceRate > WARMUP_THRESHOLDS.MAX_BOUNCE_RATE) {
    return {
      canProgress: false,
      reason: `Bounce rate exceeds threshold (${(metrics.bounceRate * 100).toFixed(2)}% > ${WARMUP_THRESHOLDS.MAX_BOUNCE_RATE * 100}%)`,
      metrics,
    }
  }

  if (metrics.openRate < WARMUP_THRESHOLDS.MIN_OPEN_RATE) {
    return {
      canProgress: false,
      reason: `Open rate below threshold (${(metrics.openRate * 100).toFixed(2)}% < ${WARMUP_THRESHOLDS.MIN_OPEN_RATE * 100}%)`,
      metrics,
    }
  }

  return { canProgress: true, metrics }
}

/**
 * Get warmup history logs
 */
export async function getWarmupLogs(limit = 30): Promise<
  Array<{
    day: number
    phase: string
    dailyLimit: number
    actualSent: number
    openRate: number | null
    bounceRate: number | null
    spamRate: number | null
    createdAt: Date
  }>
> {
  const config = await getWarmupConfig()

  const logs = await prisma.warmupLog.findMany({
    where: { configId: config.id },
    orderBy: { date: 'desc' },
    take: limit,
    select: {
      day: true,
      phase: true,
      dailyLimit: true,
      sent: true,
      openRate: true,
      bounceRate: true,
      spamRate: true,
      date: true,
    },
  })

  // Map to expected format for compatibility
  return logs.map((log) => ({
    day: log.day,
    phase: log.phase,
    dailyLimit: log.dailyLimit,
    actualSent: log.sent,
    openRate: log.openRate,
    bounceRate: log.bounceRate,
    spamRate: log.spamRate,
    createdAt: log.date,
  }))
}

/**
 * Manually set warmup day (admin override)
 */
export async function setWarmupDay(day: number): Promise<WarmupConfig> {
  if (day < 1 || day > 30) {
    throw new Error('Day must be between 1 and 30')
  }

  return await prisma.warmupConfig.update({
    where: { serverId: MARKETING_SERVER_ID },
    data: {
      currentDay: day,
      sentToday: 0,
    },
  })
}

/**
 * Check if warmup should be auto-paused due to poor metrics
 */
export async function shouldAutoPause(): Promise<{
  shouldPause: boolean
  reason?: string
}> {
  const metrics = await getRecentMetrics()

  if (!metrics || metrics.sent < 10) {
    return { shouldPause: false }
  }

  if (metrics.spamRate > WARMUP_THRESHOLDS.CRITICAL_SPAM_RATE) {
    return {
      shouldPause: true,
      reason: `Critical spam rate: ${(metrics.spamRate * 100).toFixed(3)}%`,
    }
  }

  if (metrics.bounceRate > WARMUP_THRESHOLDS.CRITICAL_BOUNCE_RATE) {
    return {
      shouldPause: true,
      reason: `Critical bounce rate: ${(metrics.bounceRate * 100).toFixed(2)}%`,
    }
  }

  return { shouldPause: false }
}
