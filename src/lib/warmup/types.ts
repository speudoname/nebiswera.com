/**
 * Warmup System Types
 */

import type { WarmupStatus, EngagementTier, WarmupConfig, WarmupLog } from '@prisma/client'

export type { WarmupStatus, EngagementTier }

export interface WarmupScheduleDay {
  day: number
  dailyLimit: number
  phase: WarmupPhase
  description: string
  allowedTiers: EngagementTier[]
}

export type WarmupPhase = 'foundation' | 'growth' | 'scaling' | 'maturation' | 'full'

export interface WarmupState {
  config: WarmupConfig
  schedule: WarmupScheduleDay | null
  remainingToday: number
  allowedTiers: EngagementTier[]
  phase: WarmupPhase | null
  progress: {
    currentDay: number
    totalDays: number
    percentComplete: number
  }
  metrics: {
    openRate: number | null
    bounceRate: number | null
    spamRate: number | null
    clickRate: number | null
  } | null
  health: 'healthy' | 'warning' | 'critical' | 'unknown'
}

export interface WarmupSendResult {
  allowed: boolean
  limit: number
  remaining: number
  reason?: string
  allowedTiers: EngagementTier[]
}

export interface WarmupMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  openRate: number
  bounceRate: number
  spamRate: number
  clickRate: number
}

export interface DailyWarmupLog extends WarmupLog {
  tierBreakdown: Record<EngagementTier, number> | null
}

// Thresholds for auto-progression
export const WARMUP_THRESHOLDS = {
  // Minimum rates to progress to next day
  MIN_OPEN_RATE: 0.15,      // 15%
  MAX_BOUNCE_RATE: 0.03,    // 3%
  MAX_SPAM_RATE: 0.001,     // 0.1%

  // Critical thresholds (pause warmup)
  CRITICAL_BOUNCE_RATE: 0.05,  // 5%
  CRITICAL_SPAM_RATE: 0.001,   // 0.1%

  // Cooldown thresholds (days of inactivity)
  MINOR_COOLDOWN_DAYS: 7,      // Resume at 75%
  MODERATE_COOLDOWN_DAYS: 14,  // Resume at 50%
  FULL_COOLDOWN_DAYS: 30,      // Full re-warmup
} as const

// Marketing server ID (for warmup config)
export const MARKETING_SERVER_ID = 'marketing'
export const MARKETING_SERVER_NAME = 'nbswera'
