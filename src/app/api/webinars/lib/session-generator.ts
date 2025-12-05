// Session generation logic for webinars
// Generates available sessions based on schedule configuration

import { prisma } from '@/lib/db'
import type { WebinarScheduleConfig, WebinarSessionType } from '@prisma/client'

interface GeneratedSession {
  scheduledAt: Date
  type: WebinarSessionType
}

interface SessionGeneratorOptions {
  maxSessions?: number
  fromDate?: Date
  toDate?: Date
  includeJustInTime?: boolean
  includeOnDemand?: boolean
}

/**
 * Generate upcoming sessions for a webinar based on its schedule configuration
 */
export async function generateUpcomingSessions(
  webinarId: string,
  options: SessionGeneratorOptions = {}
): Promise<GeneratedSession[]> {
  const {
    maxSessions = 10,
    fromDate = new Date(),
    toDate,
    includeJustInTime = true,
    includeOnDemand = true,
  } = options

  // Get webinar with schedule config
  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: { scheduleConfig: true },
  })

  if (!webinar || !webinar.scheduleConfig) {
    return []
  }

  const config = webinar.scheduleConfig
  const sessions: GeneratedSession[] = []

  // Add just-in-time session if enabled
  if (includeJustInTime && config.justInTimeEnabled) {
    const justInTimeDate = new Date(fromDate)
    justInTimeDate.setMinutes(
      justInTimeDate.getMinutes() + config.intervalMinutes
    )
    // Round to nearest 5 minutes
    justInTimeDate.setMinutes(Math.ceil(justInTimeDate.getMinutes() / 5) * 5)
    justInTimeDate.setSeconds(0)
    justInTimeDate.setMilliseconds(0)

    sessions.push({
      scheduledAt: justInTimeDate,
      type: 'JUST_IN_TIME',
    })
  }

  // Generate scheduled sessions based on event type
  switch (config.eventType) {
    case 'RECURRING':
      sessions.push(
        ...generateRecurringSessions(config, fromDate, toDate, maxSessions)
      )
      break

    case 'ONE_TIME':
      if (config.startsAt >= fromDate) {
        sessions.push({
          scheduledAt: config.startsAt,
          type: 'SCHEDULED',
        })
      }
      break

    case 'SPECIFIC_DATES':
      for (const date of config.specificDates) {
        if (date >= fromDate && (!toDate || date <= toDate)) {
          sessions.push({
            scheduledAt: date,
            type: 'SCHEDULED',
          })
        }
      }
      break

    case 'ON_DEMAND_ONLY':
      // No scheduled sessions for on-demand only
      break
  }

  // Filter out blackout dates
  const filteredSessions = sessions.filter(
    (session) => !isBlackoutDate(session.scheduledAt, config.blackoutDates)
  )

  // Sort by date and limit
  filteredSessions.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())

  // Apply max sessions limit (but keep just-in-time separate)
  const justInTimeSessions = filteredSessions.filter((s) => s.type === 'JUST_IN_TIME')
  const scheduledSessions = filteredSessions
    .filter((s) => s.type !== 'JUST_IN_TIME')
    .slice(0, maxSessions)

  return [...justInTimeSessions, ...scheduledSessions]
}

/**
 * Generate recurring sessions from config
 */
function generateRecurringSessions(
  config: WebinarScheduleConfig,
  fromDate: Date,
  toDate: Date | undefined,
  maxSessions: number
): GeneratedSession[] {
  const sessions: GeneratedSession[] = []
  const endDate = toDate || config.endsAt || addDays(fromDate, 90) // Default to 90 days ahead

  // Start from the config start date or fromDate, whichever is later
  let currentDate = new Date(Math.max(config.startsAt.getTime(), fromDate.getTime()))

  // Reset to start of day
  currentDate.setHours(0, 0, 0, 0)

  while (currentDate <= endDate && sessions.length < maxSessions * 2) {
    const dayOfWeek = currentDate.getDay()

    // Check if this day is in the recurring days
    if (config.recurringDays.includes(dayOfWeek)) {
      // Add session for each time on this day
      for (const timeStr of config.recurringTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number)
        const sessionDate = new Date(currentDate)
        sessionDate.setHours(hours, minutes, 0, 0)

        // Only include future sessions
        if (sessionDate > fromDate) {
          sessions.push({
            scheduledAt: sessionDate,
            type: 'SCHEDULED',
          })
        }
      }
    }

    // Move to next day
    currentDate = addDays(currentDate, 1)
  }

  return sessions.slice(0, maxSessions)
}

/**
 * Check if a date falls on a blackout date
 */
function isBlackoutDate(date: Date, blackoutDates: Date[]): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return blackoutDates.some(
    (blackout) => blackout.toISOString().split('T')[0] === dateStr
  )
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get or create sessions for a webinar
 * Creates session records in the database if they don't exist
 */
export async function getOrCreateSessions(
  webinarId: string,
  options: SessionGeneratorOptions = {}
): Promise<Array<{ id: string; scheduledAt: Date; type: WebinarSessionType }>> {
  const generatedSessions = await generateUpcomingSessions(webinarId, options)

  const results = []

  for (const session of generatedSessions) {
    // Check if session already exists
    const existing = await prisma.webinarSession.findFirst({
      where: {
        webinarId,
        scheduledAt: session.scheduledAt,
        type: session.type,
      },
    })

    if (existing) {
      results.push(existing)
    } else {
      // Create new session
      const created = await prisma.webinarSession.create({
        data: {
          webinarId,
          scheduledAt: session.scheduledAt,
          type: session.type,
        },
      })
      results.push(created)
    }
  }

  return results
}

/**
 * Get available sessions for registration display
 * UPDATED: Now uses pre-generated interval sessions instead of dynamic JIT calculation
 */
export async function getAvailableSessionsForRegistration(
  webinarId: string
): Promise<{
  sessions: Array<{
    id: string
    scheduledAt: Date
    type: WebinarSessionType
    spotsRemaining?: number
  }>
  onDemandAvailable: boolean
  replayAvailable: boolean
}> {
  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: { scheduleConfig: true },
  })

  if (!webinar || !webinar.scheduleConfig) {
    return {
      sessions: [],
      onDemandAvailable: false,
      replayAvailable: false,
    }
  }

  const config = webinar.scheduleConfig
  const now = new Date()

  // For interval-based JIT: Get pre-generated sessions from database
  // For other types: Use old logic
  let sessions

  if (config.justInTimeEnabled && config.intervalMinutes) {
    // NEW: Get pre-generated interval sessions (future sessions only)
    sessions = await prisma.webinarSession.findMany({
      where: {
        webinarId,
        type: 'JUST_IN_TIME',
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: 'asc' },
      take: config.maxSessionsToShow,
    })
  } else {
    // OLD: Use dynamic generation for other event types
    sessions = await getOrCreateSessions(webinarId, {
      maxSessions: config.maxSessionsToShow,
      includeJustInTime: config.justInTimeEnabled && !config.intervalMinutes, // Only if old-style JIT
    })
  }

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      type: s.type,
    })),
    onDemandAvailable: config.onDemandEnabled,
    replayAvailable: config.replayEnabled,
  }
}

/**
 * Format session time for display
 */
export function formatSessionTime(
  date: Date,
  timezone: string,
  locale: string = 'en'
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(date)
}

/**
 * Get relative time for just-in-time sessions
 */
export function getRelativeTime(date: Date, locale: string = 'en'): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins <= 0) return locale === 'ka' ? 'ახლა' : 'Now'
  if (diffMins < 60) return locale === 'ka' ? `${diffMins} წუთში` : `In ${diffMins} min`

  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return locale === 'ka' ? `${diffHours} საათში` : `In ${diffHours} hr`

  const diffDays = Math.round(diffHours / 24)
  return locale === 'ka' ? `${diffDays} დღეში` : `In ${diffDays} days`
}
