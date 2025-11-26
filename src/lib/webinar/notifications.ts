// Webinar notification system
// Handles queuing and sending webinar-related emails

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import type { WebinarNotificationTrigger, WebinarSessionType } from '@prisma/client'

interface NotificationVariables {
  first_name: string
  email: string
  webinar_title: string
  session_date?: string
  watch_url: string
  replay_url?: string
  minutes_until?: number
}

/**
 * Queue a notification to be sent
 */
export async function queueNotification(
  webinarId: string,
  registrationId: string,
  trigger: WebinarNotificationTrigger,
  scheduledFor?: Date
): Promise<void> {
  // Find the notification template
  const notification = await prisma.webinarNotification.findFirst({
    where: {
      webinarId,
      trigger,
      enabled: true,
    },
  })

  if (!notification) {
    console.log(`No enabled notification found for trigger: ${trigger}`)
    return
  }

  // Get registration details
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: {
      webinar: true,
      session: true,
    },
  })

  if (!registration) {
    console.error('Registration not found:', registrationId)
    return
  }

  // Check if already sent
  const alreadySent = await prisma.webinarNotificationSent.findFirst({
    where: {
      notificationId: notification.id,
      registrationId,
    },
  })

  if (alreadySent) {
    console.log('Notification already sent:', notification.id, registrationId)
    return
  }

  // Calculate scheduled time
  let sendAt = scheduledFor || new Date()

  if (trigger === 'REMINDER_BEFORE' && registration.session && notification.triggerMinutes) {
    // Send X minutes before session
    sendAt = new Date(
      registration.session.scheduledAt.getTime() - notification.triggerMinutes * 60 * 1000
    )
  } else if (trigger.startsWith('FOLLOW_UP_') && notification.triggerMinutes) {
    // Send X minutes after event
    sendAt = new Date(Date.now() + notification.triggerMinutes * 60 * 1000)
  }

  // Don't queue if send time is in the past
  if (sendAt < new Date()) {
    // Send immediately instead
    await sendNotificationNow(notification.id, registrationId)
    return
  }

  // Queue the notification
  await prisma.webinarNotificationSent.create({
    data: {
      notificationId: notification.id,
      registrationId,
      email: registration.email,
      scheduledFor: sendAt,
      status: 'PENDING',
    },
  })

  console.log(`Notification queued for ${sendAt.toISOString()}:`, trigger)
}

/**
 * Send a notification immediately
 */
export async function sendNotificationNow(
  notificationId: string,
  registrationId: string
): Promise<boolean> {
  const notification = await prisma.webinarNotification.findUnique({
    where: { id: notificationId },
    include: { webinar: true },
  })

  if (!notification) {
    console.error('Notification not found:', notificationId)
    return false
  }

  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: { session: true },
  })

  if (!registration) {
    console.error('Registration not found:', registrationId)
    return false
  }

  // Build variables
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const variables: NotificationVariables = {
    first_name: registration.firstName || registration.email.split('@')[0],
    email: registration.email,
    webinar_title: notification.webinar.title,
    watch_url: `${baseUrl}/webinar/${notification.webinar.slug}/watch?token=${registration.accessToken}`,
    replay_url: `${baseUrl}/webinar/${notification.webinar.slug}/watch?token=${registration.accessToken}`,
  }

  if (registration.session) {
    variables.session_date = registration.session.scheduledAt.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })

    const minutesUntil = Math.round(
      (registration.session.scheduledAt.getTime() - Date.now()) / 60000
    )
    variables.minutes_until = Math.max(0, minutesUntil)
  }

  // Process template
  const subject = replaceVariables(notification.subject, variables)
  const bodyHtml = replaceVariables(notification.bodyHtml, variables)

  try {
    // Send email
    await sendEmail({
      to: registration.email,
      subject,
      html: bodyHtml,
    })

    // Mark as sent
    await prisma.webinarNotificationSent.upsert({
      where: {
        notificationId_registrationId: {
          notificationId,
          registrationId,
        },
      },
      create: {
        notificationId,
        registrationId,
        email: registration.email,
        scheduledFor: new Date(),
        status: 'SENT',
        sentAt: new Date(),
      },
      update: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    console.log('Notification sent:', notification.trigger, registration.email)
    return true
  } catch (error) {
    console.error('Failed to send notification:', error)

    // Mark as failed
    await prisma.webinarNotificationSent.upsert({
      where: {
        notificationId_registrationId: {
          notificationId,
          registrationId,
        },
      },
      create: {
        notificationId,
        registrationId,
        email: registration.email,
        scheduledFor: new Date(),
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      update: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return false
  }
}

/**
 * Process pending notifications in the queue
 * This should be called by a cron job every minute
 */
export async function processNotificationQueue(): Promise<number> {
  const now = new Date()

  // Find pending notifications that are due
  const pending = await prisma.webinarNotificationSent.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    include: {
      notification: true,
    },
    take: 50, // Process in batches
  })

  console.log(`Processing ${pending.length} pending notifications`)

  let sentCount = 0

  for (const item of pending) {
    const success = await sendNotificationNow(item.notificationId, item.registrationId)
    if (success) sentCount++
  }

  return sentCount
}

/**
 * Queue confirmation notification on registration
 */
export async function sendRegistrationConfirmation(
  registrationId: string,
  sessionType: WebinarSessionType
): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    select: { webinarId: true },
  })

  if (!registration) return

  // Determine trigger based on session type
  let trigger: WebinarNotificationTrigger

  switch (sessionType) {
    case 'SCHEDULED':
    case 'JUST_IN_TIME':
      trigger = 'REGISTERED_SCHEDULED'
      break
    case 'ON_DEMAND':
      trigger = 'REGISTERED_ON_DEMAND'
      break
    case 'REPLAY':
      trigger = 'REGISTERED_REPLAY'
      break
    default:
      trigger = 'REGISTERED_SCHEDULED'
  }

  await queueNotification(registration.webinarId, registrationId, trigger)
}

/**
 * Queue reminder notification for scheduled sessions
 */
export async function scheduleSessionReminder(registrationId: string): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: { session: true },
  })

  if (!registration || !registration.session) return

  // Only schedule reminder for scheduled sessions
  if (registration.sessionType !== 'SCHEDULED' && registration.sessionType !== 'JUST_IN_TIME') {
    return
  }

  await queueNotification(
    registration.webinarId,
    registrationId,
    'REMINDER_BEFORE'
  )
}

/**
 * Queue follow-up notifications based on attendance
 */
export async function sendFollowUpNotification(
  registrationId: string,
  outcome: 'attended' | 'completed' | 'missed' | 'left_early'
): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    select: { webinarId: true },
  })

  if (!registration) return

  const triggerMap: Record<string, WebinarNotificationTrigger> = {
    attended: 'FOLLOW_UP_ATTENDED',
    completed: 'FOLLOW_UP_COMPLETED',
    missed: 'FOLLOW_UP_MISSED',
    left_early: 'FOLLOW_UP_LEFT_EARLY',
  }

  const trigger = triggerMap[outcome]
  if (trigger) {
    await queueNotification(registration.webinarId, registrationId, trigger)
  }
}

/**
 * Replace template variables in a string
 */
function replaceVariables(template: string, variables: NotificationVariables): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
    result = result.replace(regex, String(value ?? ''))
  }

  return result
}
