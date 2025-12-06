/**
 * Email Warmup System
 *
 * Comprehensive email warmup management for the marketing server.
 * Implements a 30-day progressive warmup schedule with engagement-based
 * recipient prioritization and automatic cooldown handling.
 *
 * @module warmup
 */

// Types
export type {
  WarmupScheduleDay,
  WarmupPhase,
  WarmupState,
  WarmupSendResult,
  WarmupMetrics,
  DailyWarmupLog,
} from './types'
export { WARMUP_THRESHOLDS, MARKETING_SERVER_ID, MARKETING_SERVER_NAME } from './types'

// Schedule
export {
  WARMUP_SCHEDULE,
  getScheduleForDay,
  getPhaseForDay,
  getDailyLimitForDay,
  getAllowedTiersForDay,
  calculateResumeDay,
  getTotalCapacityUpToDay,
  estimateDaysToComplete,
} from './schedule'

// Engagement
export {
  calculateEngagementTier,
  updateContactEngagementTier,
  recordContactOpen,
  recordContactClick,
  recordContactEmailSent,
  recalculateAllEngagementTiers,
  getContactCountsByTier,
  getEligibleContacts,
} from './engagement'

// Service
export {
  getWarmupConfig,
  getWarmupState,
  startWarmup,
  pauseWarmup,
  resumeWarmup,
  canSendToTier,
  getRemainingToday,
  recordSent,
  advanceDay,
  resetDailyCounter,
  checkCooldown,
  applyCooldownIfNeeded,
  getRecentMetrics,
  canProgress,
  getWarmupLogs,
  setWarmupDay,
  shouldAutoPause,
} from './service'
