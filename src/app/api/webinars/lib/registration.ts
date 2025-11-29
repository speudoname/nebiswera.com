// Registration logic for webinars
// Handles registration, unique access tokens, and contact linking

import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import type { WebinarSessionType } from '@prisma/client'
import {
  sendRegistrationConfirmation,
  scheduleSessionReminder,
} from './notifications'

interface RegistrationInput {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  customFieldResponses?: Record<string, string | boolean>
  sessionId?: string // For scheduled sessions
  sessionType?: WebinarSessionType // For on-demand or replay
  timezone?: string
  source?: string
  utmParams?: Record<string, string>
}

interface RegistrationResult {
  success: boolean
  registration?: {
    id: string
    accessToken: string
    email: string
    sessionId?: string
    sessionType: WebinarSessionType
  }
  error?: string
}

/**
 * Generate a unique access token for registration
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Register a user for a webinar
 */
export async function registerForWebinar(
  webinarId: string,
  input: RegistrationInput
): Promise<RegistrationResult> {
  const { email, firstName, lastName, phone, customFieldResponses, sessionId, sessionType, timezone, source, utmParams } = input

  // Validate email
  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Invalid email address' }
  }

  // Get webinar with schedule config
  const webinar = await prisma.webinar.findUnique({
    where: { id: webinarId },
    include: { scheduleConfig: true },
  })

  if (!webinar) {
    return { success: false, error: 'Webinar not found' }
  }

  if (webinar.status !== 'PUBLISHED') {
    return { success: false, error: 'Webinar is not available for registration' }
  }

  // Determine session type and validate
  let finalSessionId = sessionId
  let finalSessionType: WebinarSessionType = sessionType || 'SCHEDULED'

  if (sessionId) {
    // Validate the session exists and belongs to this webinar
    const session = await prisma.webinarSession.findFirst({
      where: {
        id: sessionId,
        webinarId,
      },
    })

    if (!session) {
      return { success: false, error: 'Invalid session selected' }
    }

    finalSessionType = session.type
  } else if (sessionType === 'ON_DEMAND') {
    // For on-demand, we don't need a specific session
    if (!webinar.scheduleConfig?.onDemandEnabled) {
      return { success: false, error: 'On-demand viewing is not available for this webinar' }
    }
    finalSessionId = undefined
  } else if (sessionType === 'REPLAY') {
    // For replay, we don't need a specific session
    if (!webinar.scheduleConfig?.replayEnabled) {
      return { success: false, error: 'Replay is not available for this webinar' }
    }
    finalSessionId = undefined
  } else {
    return { success: false, error: 'Please select a session or viewing option' }
  }

  // Check for existing registration with same email for this webinar
  const existingRegistration = await prisma.webinarRegistration.findFirst({
    where: {
      webinarId,
      email: email.toLowerCase(),
    },
  })

  if (existingRegistration) {
    // Return existing registration instead of creating duplicate
    return {
      success: true,
      registration: {
        id: existingRegistration.id,
        accessToken: existingRegistration.accessToken,
        email: existingRegistration.email,
        sessionId: existingRegistration.sessionId || undefined,
        sessionType: existingRegistration.sessionType,
      },
    }
  }

  // Find or create contact in CRM
  const contact = await findOrCreateContact(email, firstName, lastName)

  // Generate unique access token
  const accessToken = generateAccessToken()

  // Create registration
  const registration = await prisma.webinarRegistration.create({
    data: {
      webinarId,
      contactId: contact.id,
      sessionId: finalSessionId,
      email: email.toLowerCase(),
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      customFieldResponses: customFieldResponses ? customFieldResponses : undefined,
      accessToken,
      sessionType: finalSessionType,
      timezone: timezone || 'UTC',
      source: source || 'direct',
      utmSource: utmParams?.utm_source,
      utmMedium: utmParams?.utm_medium,
      utmCampaign: utmParams?.utm_campaign,
      utmContent: utmParams?.utm_content,
      utmTerm: utmParams?.utm_term,
    },
  })

  // Track analytics event
  await prisma.webinarAnalyticsEvent.create({
    data: {
      webinarId,
      registrationId: registration.id,
      eventType: 'REGISTRATION',
      metadata: {
        sessionType: finalSessionType,
        source: source || 'direct',
        timezone: timezone || 'UTC',
      },
    },
  })

  // Send confirmation email and schedule reminders
  try {
    await sendRegistrationConfirmation(registration.id, finalSessionType)

    // Schedule reminder for scheduled sessions
    if (finalSessionType === 'SCHEDULED' || finalSessionType === 'JUST_IN_TIME') {
      await scheduleSessionReminder(registration.id)
    }
  } catch (error) {
    // Don't fail registration if notification fails
    console.error('Failed to send registration notification:', error)
  }

  return {
    success: true,
    registration: {
      id: registration.id,
      accessToken: registration.accessToken,
      email: registration.email,
      sessionId: registration.sessionId || undefined,
      sessionType: registration.sessionType,
    },
  }
}

/**
 * Find existing contact or create new one in CRM schema
 */
async function findOrCreateContact(
  email: string,
  firstName?: string,
  lastName?: string
) {
  const normalizedEmail = email.toLowerCase()

  // Try to find existing contact
  let contact = await prisma.contact.findUnique({
    where: { email: normalizedEmail },
  })

  if (!contact) {
    // Create new contact
    contact = await prisma.contact.create({
      data: {
        email: normalizedEmail,
        firstName: firstName || null,
        lastName: lastName || null,
        source: 'webinar',
        status: 'ACTIVE',
      },
    })
  } else if (firstName || lastName) {
    // Update contact if we have new name info
    const updates: { firstName?: string; lastName?: string } = {}
    if (firstName && !contact.firstName) updates.firstName = firstName
    if (lastName && !contact.lastName) updates.lastName = lastName

    if (Object.keys(updates).length > 0) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: updates,
      })
    }
  }

  return contact
}

/**
 * Validate registration access token
 */
export async function validateAccessToken(
  webinarId: string,
  accessToken: string
): Promise<{
  valid: boolean
  registration?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    sessionId: string | null
    sessionType: WebinarSessionType
    webinarId: string
    watchProgress: number
    completedAt: Date | null
  }
}> {
  const registration = await prisma.webinarRegistration.findFirst({
    where: {
      webinarId,
      accessToken,
    },
  })

  if (!registration) {
    return { valid: false }
  }

  return {
    valid: true,
    registration: {
      id: registration.id,
      email: registration.email,
      firstName: registration.firstName,
      lastName: registration.lastName,
      sessionId: registration.sessionId,
      sessionType: registration.sessionType,
      webinarId: registration.webinarId,
      watchProgress: registration.maxVideoPosition,
      completedAt: registration.completedAt,
    },
  }
}

/**
 * Get registration by access token (for room page)
 */
export async function getRegistrationByToken(accessToken: string) {
  return prisma.webinarRegistration.findFirst({
    where: { accessToken },
    include: {
      webinar: {
        include: {
          scheduleConfig: true,
        },
      },
      session: true,
    },
  })
}

/**
 * Update watch progress for a registration
 */
export async function updateWatchProgress(
  registrationId: string,
  progress: number,
  lastPosition: number
): Promise<void> {
  await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data: {
      maxVideoPosition: lastPosition,
      ...(progress >= 90 ? { completedAt: new Date() } : {}),
    },
  })
}

/**
 * Mark registration as attended (for analytics)
 */
export async function markAsAttended(registrationId: string): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
  })

  if (!registration || registration.joinedAt) return

  await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data: { joinedAt: new Date(), attendedAt: new Date() },
  })

  // Track analytics event
  await prisma.webinarAnalyticsEvent.create({
    data: {
      webinarId: registration.webinarId,
      registrationId,
      eventType: 'ATTENDANCE',
      metadata: {
        sessionType: registration.sessionType,
      },
    },
  })
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get registration stats for a webinar
 */
export async function getWebinarRegistrationStats(webinarId: string) {
  const [totalRegistrations, totalAttended, totalCompleted] = await Promise.all([
    prisma.webinarRegistration.count({ where: { webinarId } }),
    prisma.webinarRegistration.count({ where: { webinarId, joinedAt: { not: null } } }),
    prisma.webinarRegistration.count({ where: { webinarId, completedAt: { not: null } } }),
  ])

  const attendanceRate = totalRegistrations > 0
    ? Math.round((totalAttended / totalRegistrations) * 100)
    : 0

  const completionRate = totalAttended > 0
    ? Math.round((totalCompleted / totalAttended) * 100)
    : 0

  return {
    totalRegistrations,
    totalAttended,
    totalCompleted,
    attendanceRate,
    completionRate,
  }
}
