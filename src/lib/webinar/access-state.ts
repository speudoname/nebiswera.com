// Access State Machine for Webinar Access Control
// Simplifies complex nested if-else logic into clear states

import type { Webinar, WebinarSession, WebinarScheduleConfig, WebinarSessionType } from '@prisma/client'
import { TIMING, minutesToMs } from '@/lib/webinar/constants'

// Minimal registration data needed for access state determination
type AccessRegistration = {
  sessionType: WebinarSessionType
  maxVideoPosition: number
}

// ===========================================
// Access State Types
// ===========================================

export type AccessState =
  | AllowedState
  | WaitingState
  | ExpiredState
  | EndedState
  | DisabledState

interface AllowedState {
  status: 'ALLOWED'
  playbackMode: 'simulated_live' | 'on_demand' | 'replay'
  allowSeeking: boolean
  startPosition: number
  sessionType: string
}

interface WaitingState {
  status: 'WAITING'
  startsAt: Date
  minutesUntilStart: number
  earlyAccessAt: Date
}

interface ExpiredState {
  status: 'EXPIRED'
  expiredAt: Date
  reason: 'replay_expired' | 'replay_disabled'
}

interface EndedState {
  status: 'ENDED'
  endedAt: Date
  replayAvailable: boolean
}

interface DisabledState {
  status: 'DISABLED'
  reason: string
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Calculate start position based on session type and timing
 */
function calculateStartPosition(
  sessionType: string,
  session: WebinarSession | null,
  registration: AccessRegistration,
  videoDurationMinutes: number
): number {
  switch (sessionType) {
    case 'ON_DEMAND':
    case 'REPLAY':
      // Resume from last position
      return registration.maxVideoPosition > 0 ? registration.maxVideoPosition : 0

    case 'SCHEDULED':
    case 'JUST_IN_TIME':
      // Calculate position based on elapsed time since session start
      if (session) {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - session.scheduledAt.getTime()) / 1000)
        const videoDurationSeconds = videoDurationMinutes * 60
        // Cap at video duration
        return Math.max(0, Math.min(elapsed, videoDurationSeconds - 1))
      }
      return 0

    default:
      return 0
  }
}

/**
 * Check if replay has expired
 */
function isReplayExpired(
  session: WebinarSession | null,
  scheduleConfig: WebinarScheduleConfig | null,
  videoDurationMinutes: number
): { expired: boolean; expiredAt?: Date } {
  if (!scheduleConfig?.replayExpiresAfterDays || !session) {
    return { expired: false }
  }

  const sessionEnd = new Date(
    session.scheduledAt.getTime() + videoDurationMinutes * 60 * 1000
  )
  const expirationDate = new Date(
    sessionEnd.getTime() + scheduleConfig.replayExpiresAfterDays * 24 * 60 * 60 * 1000
  )

  const expired = new Date() > expirationDate

  return { expired, expiredAt: expirationDate }
}

/**
 * Check session timing for scheduled/JIT sessions
 */
function checkSessionTiming(
  session: WebinarSession,
  videoDurationMinutes: number
): {
  status: 'waiting' | 'active' | 'ended'
  startsAt: Date
  endsAt: Date
  earlyAccessAt: Date
} {
  const now = new Date()
  const sessionStart = new Date(session.scheduledAt)
  const sessionEnd = new Date(sessionStart.getTime() + videoDurationMinutes * 60 * 1000)
  const earlyAccessAt = new Date(sessionStart.getTime() - minutesToMs(TIMING.EARLY_ACCESS_MINUTES))

  let status: 'waiting' | 'active' | 'ended'
  if (now < earlyAccessAt) {
    status = 'waiting'
  } else if (now > sessionEnd) {
    status = 'ended'
  } else {
    status = 'active'
  }

  return {
    status,
    startsAt: sessionStart,
    endsAt: sessionEnd,
    earlyAccessAt,
  }
}

// ===========================================
// Main State Determiner
// ===========================================

/**
 * Determine access state for a webinar registration
 * Single source of truth for all access logic
 */
export function determineAccessState(
  webinar: Webinar & { scheduleConfig: WebinarScheduleConfig | null },
  registration: AccessRegistration,
  session: WebinarSession | null
): AccessState {
  const videoDurationMinutes = webinar.videoDuration || 60

  // ===========================================
  // 1. Handle REPLAY access
  // ===========================================
  if (registration.sessionType === 'REPLAY') {
    // Check if replay is enabled
    if (webinar.scheduleConfig && !webinar.scheduleConfig.replayEnabled) {
      return {
        status: 'DISABLED',
        reason: 'Replay is not available for this webinar',
      }
    }

    // Check if replay has expired
    const { expired, expiredAt } = isReplayExpired(
      session,
      webinar.scheduleConfig,
      videoDurationMinutes
    )

    if (expired && expiredAt) {
      return {
        status: 'EXPIRED',
        expiredAt,
        reason: 'replay_expired',
      }
    }

    // Allow replay access
    return {
      status: 'ALLOWED',
      playbackMode: 'replay',
      allowSeeking: true,
      startPosition: calculateStartPosition(
        registration.sessionType,
        session,
        registration,
        videoDurationMinutes
      ),
      sessionType: 'REPLAY',
    }
  }

  // ===========================================
  // 2. Handle ON_DEMAND access
  // ===========================================
  if (registration.sessionType === 'ON_DEMAND') {
    return {
      status: 'ALLOWED',
      playbackMode: 'on_demand',
      allowSeeking: true,
      startPosition: calculateStartPosition(
        registration.sessionType,
        session,
        registration,
        videoDurationMinutes
      ),
      sessionType: 'ON_DEMAND',
    }
  }

  // ===========================================
  // 3. Handle SCHEDULED / JUST_IN_TIME access
  // ===========================================
  if (registration.sessionType === 'SCHEDULED' || registration.sessionType === 'JUST_IN_TIME') {
    // Must have a session
    if (!session) {
      return {
        status: 'DISABLED',
        reason: 'Session not found for scheduled registration',
      }
    }

    const timing = checkSessionTiming(session, videoDurationMinutes)

    // Session hasn't started yet (not even early access)
    if (timing.status === 'waiting') {
      const minutesUntilStart = Math.ceil(
        (timing.startsAt.getTime() - new Date().getTime()) / 60000
      )

      return {
        status: 'WAITING',
        startsAt: timing.startsAt,
        minutesUntilStart,
        earlyAccessAt: timing.earlyAccessAt,
      }
    }

    // Session has ended
    if (timing.status === 'ended') {
      const replayEnabled = webinar.scheduleConfig?.replayEnabled ?? false

      // If replay is available, this will be handled by auto-conversion in the route
      // For now, return ENDED state
      return {
        status: 'ENDED',
        endedAt: timing.endsAt,
        replayAvailable: replayEnabled,
      }
    }

    // Session is active - allow simulated live access
    return {
      status: 'ALLOWED',
      playbackMode: 'simulated_live',
      allowSeeking: false,
      startPosition: calculateStartPosition(
        registration.sessionType,
        session,
        registration,
        videoDurationMinutes
      ),
      sessionType: registration.sessionType,
    }
  }

  // ===========================================
  // 4. Unknown session type
  // ===========================================
  return {
    status: 'DISABLED',
    reason: `Unknown session type: ${registration.sessionType}`,
  }
}

/**
 * Helper to get playback mode string from session type
 */
export function getPlaybackMode(sessionType: string): 'simulated_live' | 'on_demand' | 'replay' {
  switch (sessionType) {
    case 'ON_DEMAND':
      return 'on_demand'
    case 'REPLAY':
      return 'replay'
    case 'SCHEDULED':
    case 'JUST_IN_TIME':
    default:
      return 'simulated_live'
  }
}

/**
 * Helper to determine if seeking should be allowed
 */
export function shouldAllowSeeking(sessionType: string): boolean {
  return sessionType === 'ON_DEMAND' || sessionType === 'REPLAY'
}
