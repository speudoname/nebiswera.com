// Simplified interval-based session generator
// Replaces complex dynamic JIT calculation with pre-generated sessions

import { prisma } from '@/lib/db'
import { logger } from '@/lib'

interface IntervalSessionConfig {
  intervalMinutes: number // 5, 15, 30, or 60
  startHour: number // e.g., 9 for 9 AM
  endHour: number // e.g., 17 for 5 PM
}

/**
 * Generate interval-based sessions for a webinar
 * Much simpler than the old 293-line dynamic JIT calculation!
 */
export async function generateIntervalSessions(
  webinarId: string,
  daysAhead: number = 7
): Promise<void> {
  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: { scheduleConfig: true },
  })

  if (!webinar || !webinar.scheduleConfig) {
    throw new Error('Webinar or schedule config not found')
  }

  const config = webinar.scheduleConfig

  // Only generate for webinars with interval-based JIT enabled
  if (!config.justInTimeEnabled || !config.intervalMinutes) {
    return
  }

  const intervalConfig: IntervalSessionConfig = {
    intervalMinutes: config.intervalMinutes,
    startHour: config.intervalStartHour,
    endHour: config.intervalEndHour,
  }

  // Generate sessions for the next N days
  const sessions = generateSessionsForDays(intervalConfig, daysAhead)

  // Get existing session times to avoid duplicates
  const existingSessions = await prisma.webinarSession.findMany({
    where: {
      webinarId,
      type: 'JUST_IN_TIME',
    },
    select: { scheduledAt: true },
  })

  const existingTimes = new Set(
    existingSessions.map((s) => s.scheduledAt.toISOString())
  )

  // Create only new sessions (that don't already exist)
  const newSessions = sessions.filter(
    (sessionTime) => !existingTimes.has(sessionTime.toISOString())
  )

  if (newSessions.length > 0) {
    await prisma.webinarSession.createMany({
      data: newSessions.map((sessionTime) => ({
        webinarId,
        scheduledAt: sessionTime,
        type: 'JUST_IN_TIME' as const,
      })),
    })
  }

  // Clean up old sessions (older than today) that have no registrations
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.webinarSession.deleteMany({
    where: {
      webinarId,
      type: 'JUST_IN_TIME',
      scheduledAt: { lt: today },
      registrationCount: 0, // Only delete if no registrations
    },
  })
}

/**
 * Generate session times for the next N days
 * Example: intervalMinutes=15, startHour=9, endHour=17
 * → 9:00, 9:15, 9:30, 9:45, ..., 16:45 (for each day)
 */
function generateSessionsForDays(
  config: IntervalSessionConfig,
  daysAhead: number
): Date[] {
  const sessions: Date[] = []
  const now = new Date()

  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() + day)
    date.setHours(config.startHour, 0, 0, 0)

    // Generate sessions for this day
    while (date.getHours() < config.endHour) {
      // Only include future sessions (skip past times for today)
      if (date > now) {
        sessions.push(new Date(date))
      }

      // Add interval minutes
      date.setMinutes(date.getMinutes() + config.intervalMinutes)
    }
  }

  return sessions
}

/**
 * Generate sessions for all webinars with interval-based JIT enabled
 * This should be called by a cron job daily
 */
export async function generateAllIntervalSessions(): Promise<{
  processed: number
  errors: string[]
}> {
  const webinars = await prisma.webinar.findMany({
    where: {
      status: 'PUBLISHED',
      scheduleConfig: {
        justInTimeEnabled: true,
        intervalMinutes: { gt: 0 },
      },
    },
    select: { id: true, title: true },
  })

  const errors: string[] = []
  let processed = 0

  for (const webinar of webinars) {
    try {
      await generateIntervalSessions(webinar.id, 7)
      processed++
    } catch (error) {
      const errorMsg = `Failed to generate sessions for "${webinar.title}": ${error}`
      logger.error(errorMsg)
      errors.push(errorMsg)
    }
  }

  return { processed, errors }
}

/**
 * Get available interval sessions for a webinar (for registration page)
 */
export async function getAvailableIntervalSessions(webinarId: string, limit: number = 10) {
  const now = new Date()

  const sessions = await prisma.webinarSession.findMany({
    where: {
      webinarId,
      type: 'JUST_IN_TIME',
      scheduledAt: { gte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  })

  return sessions.map((session) => ({
    id: session.id,
    scheduledAt: session.scheduledAt,
    type: session.type,
    minutesUntil: Math.floor((session.scheduledAt.getTime() - now.getTime()) / 1000 / 60),
  }))
}
