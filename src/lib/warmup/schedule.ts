/**
 * Warmup Schedule - 30-day progressive email warmup schedule
 */

import type { EngagementTier } from '@prisma/client'
import type { WarmupScheduleDay, WarmupPhase } from './types'

/**
 * 30-Day Warmup Schedule
 *
 * Day 1-7 (Foundation):   HOT contacts only - building initial reputation
 * Day 8-14 (Growth):      HOT + NEW contacts - expanding carefully
 * Day 15-21 (Scaling):    HOT + NEW + WARM - scaling up
 * Day 22-28 (Maturation): All except COLD - maturing reputation
 * Day 29-30 (Full):       All tiers including COLD - full capacity
 */
export const WARMUP_SCHEDULE: WarmupScheduleDay[] = [
  // Foundation Phase (Days 1-7) - HOT only
  { day: 1, dailyLimit: 50, phase: 'foundation', description: 'Initial sends - HOT contacts only', allowedTiers: ['HOT'] },
  { day: 2, dailyLimit: 100, phase: 'foundation', description: 'Building trust - HOT contacts', allowedTiers: ['HOT'] },
  { day: 3, dailyLimit: 200, phase: 'foundation', description: 'Establishing reputation', allowedTiers: ['HOT'] },
  { day: 4, dailyLimit: 300, phase: 'foundation', description: 'Increasing volume', allowedTiers: ['HOT'] },
  { day: 5, dailyLimit: 400, phase: 'foundation', description: 'Steady growth', allowedTiers: ['HOT'] },
  { day: 6, dailyLimit: 500, phase: 'foundation', description: 'Foundation nearing completion', allowedTiers: ['HOT'] },
  { day: 7, dailyLimit: 600, phase: 'foundation', description: 'Foundation phase complete', allowedTiers: ['HOT'] },

  // Growth Phase (Days 8-14) - HOT + NEW
  { day: 8, dailyLimit: 800, phase: 'growth', description: 'Adding NEW contacts', allowedTiers: ['HOT', 'NEW'] },
  { day: 9, dailyLimit: 1000, phase: 'growth', description: 'Growing subscriber base', allowedTiers: ['HOT', 'NEW'] },
  { day: 10, dailyLimit: 1200, phase: 'growth', description: 'Steady increase', allowedTiers: ['HOT', 'NEW'] },
  { day: 11, dailyLimit: 1500, phase: 'growth', description: 'Accelerating growth', allowedTiers: ['HOT', 'NEW'] },
  { day: 12, dailyLimit: 1800, phase: 'growth', description: 'Expanding reach', allowedTiers: ['HOT', 'NEW'] },
  { day: 13, dailyLimit: 2000, phase: 'growth', description: 'Growth phase progressing', allowedTiers: ['HOT', 'NEW'] },
  { day: 14, dailyLimit: 2500, phase: 'growth', description: 'Growth phase complete', allowedTiers: ['HOT', 'NEW'] },

  // Scaling Phase (Days 15-21) - HOT + NEW + WARM
  { day: 15, dailyLimit: 3000, phase: 'scaling', description: 'Adding WARM contacts', allowedTiers: ['HOT', 'NEW', 'WARM'] },
  { day: 16, dailyLimit: 3500, phase: 'scaling', description: 'Scaling operations', allowedTiers: ['HOT', 'NEW', 'WARM'] },
  { day: 17, dailyLimit: 4000, phase: 'scaling', description: 'Volume increasing', allowedTiers: ['HOT', 'NEW', 'WARM'] },
  { day: 18, dailyLimit: 5000, phase: 'scaling', description: 'Significant scale', allowedTiers: ['HOT', 'NEW', 'WARM'] },
  { day: 19, dailyLimit: 6000, phase: 'scaling', description: 'High volume reached', allowedTiers: ['HOT', 'NEW', 'WARM'] },
  { day: 20, dailyLimit: 7500, phase: 'scaling', description: 'Scaling phase progressing', allowedTiers: ['HOT', 'NEW', 'WARM'] },
  { day: 21, dailyLimit: 10000, phase: 'scaling', description: 'Scaling phase complete', allowedTiers: ['HOT', 'NEW', 'WARM'] },

  // Maturation Phase (Days 22-28) - All except COLD
  { day: 22, dailyLimit: 12500, phase: 'maturation', description: 'Adding COOL contacts', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },
  { day: 23, dailyLimit: 15000, phase: 'maturation', description: 'Maturing reputation', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },
  { day: 24, dailyLimit: 17500, phase: 'maturation', description: 'Near full capacity', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },
  { day: 25, dailyLimit: 20000, phase: 'maturation', description: 'High volume stable', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },
  { day: 26, dailyLimit: 25000, phase: 'maturation', description: 'Reputation strong', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },
  { day: 27, dailyLimit: 30000, phase: 'maturation', description: 'Maturation progressing', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },
  { day: 28, dailyLimit: 40000, phase: 'maturation', description: 'Maturation phase complete', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL'] },

  // Full Phase (Days 29-30) - All tiers
  { day: 29, dailyLimit: 50000, phase: 'full', description: 'Adding COLD contacts', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL', 'COLD'] },
  { day: 30, dailyLimit: -1, phase: 'full', description: 'Unlimited - warmup complete', allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL', 'COLD'] },
]

/**
 * Get schedule for a specific day
 */
export function getScheduleForDay(day: number): WarmupScheduleDay | null {
  if (day < 1) return null
  if (day > 30) {
    // After day 30, return unlimited with all tiers
    return {
      day,
      dailyLimit: -1,
      phase: 'full',
      description: 'Warmup complete - unlimited',
      allowedTiers: ['HOT', 'NEW', 'WARM', 'COOL', 'COLD'],
    }
  }
  return WARMUP_SCHEDULE[day - 1] || null
}

/**
 * Get phase for a specific day
 */
export function getPhaseForDay(day: number): WarmupPhase {
  if (day < 1) return 'foundation'
  if (day <= 7) return 'foundation'
  if (day <= 14) return 'growth'
  if (day <= 21) return 'scaling'
  if (day <= 28) return 'maturation'
  return 'full'
}

/**
 * Get daily limit for a specific day
 * Returns -1 for unlimited (after day 30)
 */
export function getDailyLimitForDay(day: number): number {
  const schedule = getScheduleForDay(day)
  return schedule?.dailyLimit ?? -1
}

/**
 * Get allowed engagement tiers for a specific day
 */
export function getAllowedTiersForDay(day: number): EngagementTier[] {
  const schedule = getScheduleForDay(day)
  return schedule?.allowedTiers ?? ['HOT', 'NEW', 'WARM', 'COOL', 'COLD']
}

/**
 * Calculate which day to resume at after cooldown
 * Based on days of inactivity
 */
export function calculateResumeDay(currentDay: number, inactiveDays: number): number {
  if (inactiveDays < 7) {
    // Less than 7 days: resume at current level
    return currentDay
  } else if (inactiveDays < 14) {
    // 7-14 days: resume at 75% of current day
    return Math.max(1, Math.floor(currentDay * 0.75))
  } else if (inactiveDays < 30) {
    // 14-30 days: resume at 50% of current day
    return Math.max(1, Math.floor(currentDay * 0.5))
  } else {
    // 30+ days: full re-warmup
    return 1
  }
}

/**
 * Get total emails possible up to a given day
 * Useful for estimating campaign completion time
 */
export function getTotalCapacityUpToDay(day: number): number {
  let total = 0
  for (let d = 1; d <= Math.min(day, 30); d++) {
    const limit = getDailyLimitForDay(d)
    if (limit === -1) {
      // Unlimited - return Infinity
      return Infinity
    }
    total += limit
  }
  return total
}

/**
 * Estimate days needed to send a campaign of given size
 * Starting from a specific warmup day
 */
export function estimateDaysToComplete(emailCount: number, startDay: number): number {
  if (emailCount <= 0) return 0

  let remaining = emailCount
  let day = startDay
  let days = 0

  while (remaining > 0 && days < 100) { // Safety limit of 100 days
    const dailyLimit = getDailyLimitForDay(day)
    if (dailyLimit === -1) {
      // Unlimited - can complete in one day
      return days + 1
    }
    remaining -= dailyLimit
    day++
    days++
  }

  return days
}
