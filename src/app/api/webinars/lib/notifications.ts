// Webinar notification system
// Handles queuing and sending webinar-related emails
// Uses locale-based templates from content/email-templates/webinar/

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import type { Prisma } from '@prisma/client'
import type {
  NotificationTriggerType,
  WebinarRegistration,
  WebinarNotification,
  Webinar,
  WebinarSession
} from '@prisma/client'
import {
  getWebinarEmailTemplate,
  DEFAULT_NOTIFICATION_CONFIGS,
  type WebinarTemplateKey,
} from '@content/email-templates/webinar'

// ===========================================
// Create Default Notifications for a Webinar
// ===========================================

export async function createDefaultNotifications(webinarId: string): Promise<void> {
  const notifications: Prisma.WebinarNotificationCreateManyInput[] = DEFAULT_NOTIFICATION_CONFIGS.map((config) => ({
    webinarId,
    templateKey: config.templateKey,
    triggerType: config.triggerType,
    triggerMinutes: config.triggerMinutes,
    conditions: config.conditions as Prisma.InputJsonValue | undefined,
    channel: 'EMAIL',
    isActive: true,
    isDefault: true,
    sortOrder: config.sortOrder,
  }))

  await prisma.webinarNotification.createMany({
    data: notifications,
  })
}

// ===========================================
// Build Template Variables
// ===========================================

interface TemplateVars {
  firstName: string
  webinarTitle: string
  sessionDate?: string
  watchUrl: string
  replayUrl: string
}

function buildTemplateVars(
  registration: WebinarRegistration & {
    webinar: Webinar
    session?: WebinarSession | null
  }
): TemplateVars {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const watchUrl = `${baseUrl}/webinar/${registration.webinar.slug}/watch?token=${registration.accessToken}`

  const vars: TemplateVars = {
    firstName: registration.firstName || registration.email.split('@')[0],
    webinarTitle: registration.webinar.title,
    watchUrl,
    replayUrl: watchUrl,
  }

  // Add session date if available
  if (registration.session || registration.sessionStartTime) {
    const sessionDate = registration.session?.scheduledAt || registration.sessionStartTime
    if (sessionDate) {
      vars.sessionDate = sessionDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    }
  }

  return vars
}

// ===========================================
// Get Registration Locale
// ===========================================

async function getRegistrationLocale(registration: WebinarRegistration): Promise<string> {
  // If registration has a linked contact, check for a linked user's preferred locale
  if (registration.contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: registration.contactId },
      include: { user: { select: { preferredLocale: true } } },
    })
    if (contact?.user?.preferredLocale) {
      return contact.user.preferredLocale
    }
  }

  // Default to Georgian (site default)
  return 'ka'
}

// ===========================================
// Condition Evaluation
// ===========================================

interface RegistrationContext {
  attended: boolean
  completed: boolean
  watchedPercent: number
  ctaClicked: boolean
  pollAnswered: boolean
  chatSent: boolean
}

function evaluateConditions(
  conditions: Record<string, unknown> | null,
  context: RegistrationContext
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true
  }

  // Handle AND operator
  if ('AND' in conditions && Array.isArray(conditions.AND)) {
    return conditions.AND.every((cond) =>
      evaluateConditions(cond as Record<string, unknown>, context)
    )
  }

  // Handle OR operator
  if ('OR' in conditions && Array.isArray(conditions.OR)) {
    return conditions.OR.some((cond) =>
      evaluateConditions(cond as Record<string, unknown>, context)
    )
  }

  // Handle individual field conditions
  for (const [field, expected] of Object.entries(conditions)) {
    const actual = context[field as keyof RegistrationContext]

    if (typeof expected === 'object' && expected !== null) {
      const ops = expected as Record<string, number>
      const numericActual = typeof actual === 'number' ? actual : 0
      if ('lt' in ops && !(numericActual < ops.lt)) return false
      if ('lte' in ops && !(numericActual <= ops.lte)) return false
      if ('gt' in ops && !(numericActual > ops.gt)) return false
      if ('gte' in ops && !(numericActual >= ops.gte)) return false
      if ('eq' in ops && numericActual !== ops.eq) return false
      if ('ne' in ops && numericActual === ops.ne) return false
    } else {
      if (actual !== expected) return false
    }
  }

  return true
}

async function buildRegistrationContext(
  registration: WebinarRegistration & { webinar: Webinar }
): Promise<RegistrationContext> {
  const ctaClickCount = await prisma.webinarInteractionEvent.count({
    where: { registrationId: registration.id, eventType: 'CLICKED' },
  })

  const pollResponseCount = await prisma.webinarPollResponse.count({
    where: { registrationId: registration.id },
  })

  const chatMessageCount = await prisma.webinarChatMessage.count({
    where: { registrationId: registration.id, isSimulated: false },
  })

  let watchedPercent = 0
  if (registration.webinar.videoDuration && registration.webinar.videoDuration > 0) {
    watchedPercent = Math.round(
      (registration.maxVideoPosition / registration.webinar.videoDuration) * 100
    )
  }

  return {
    attended: !!registration.joinedAt,
    completed: !!registration.completedAt,
    watchedPercent,
    ctaClicked: ctaClickCount > 0,
    pollAnswered: pollResponseCount > 0,
    chatSent: chatMessageCount > 0,
  }
}

// ===========================================
// Queue Management
// ===========================================

export async function queueNotification(
  notification: WebinarNotification,
  registration: WebinarRegistration & { session?: WebinarSession | null },
  scheduledAt: Date
): Promise<void> {
  const existing = await prisma.webinarNotificationQueue.findFirst({
    where: {
      notificationId: notification.id,
      registrationId: registration.id,
      status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
    },
  })

  if (existing) return

  await prisma.webinarNotificationQueue.create({
    data: {
      notificationId: notification.id,
      registrationId: registration.id,
      scheduledAt,
      status: 'PENDING',
    },
  })
}

export async function queueRegistrationNotifications(
  registrationId: string
): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: { webinar: true, session: true },
  })

  if (!registration) return

  const notifications = await prisma.webinarNotification.findMany({
    where: {
      webinarId: registration.webinarId,
      triggerType: 'AFTER_REGISTRATION',
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification, registration, scheduledAt)
  }
}

export async function queueSessionReminders(
  registrationId: string
): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: { webinar: true, session: true },
  })

  if (!registration || !registration.session) return
  if (registration.sessionType !== 'SCHEDULED' && registration.sessionType !== 'JUST_IN_TIME') return

  const notifications = await prisma.webinarNotification.findMany({
    where: {
      webinarId: registration.webinarId,
      triggerType: 'BEFORE_START',
      isActive: true,
    },
  })

  const sessionTime = registration.session.scheduledAt.getTime()

  for (const notification of notifications) {
    const scheduledAt = new Date(sessionTime + notification.triggerMinutes * 60 * 1000)
    if (scheduledAt > new Date()) {
      await queueNotification(notification, registration, scheduledAt)
    }
  }
}

export async function queuePostSessionNotifications(
  registrationId: string
): Promise<void> {
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: { webinar: true, session: true },
  })

  if (!registration) return

  const notifications = await prisma.webinarNotification.findMany({
    where: {
      webinarId: registration.webinarId,
      triggerType: 'AFTER_END',
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification, registration, scheduledAt)
  }
}

// ===========================================
// Send Notification
// ===========================================

export async function sendNotification(
  queueItem: {
    id: string
    notificationId: string
    registrationId: string
  }
): Promise<boolean> {
  // Fetch notification fresh at send time (allows for edits before sending)
  const notification = await prisma.webinarNotification.findUnique({
    where: { id: queueItem.notificationId },
  })

  // Check if notification exists and is active
  if (!notification) {
    console.log('Notification not found (deleted), skipping:', queueItem.notificationId)
    await prisma.webinarNotificationQueue.update({
      where: { id: queueItem.id },
      data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Notification deleted' },
    })
    return true
  }

  if (!notification.isActive) {
    console.log('Notification is disabled, skipping:', queueItem.notificationId)
    await prisma.webinarNotificationQueue.update({
      where: { id: queueItem.id },
      data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Notification disabled' },
    })
    return true
  }

  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: queueItem.registrationId },
    include: { webinar: true, session: true },
  })

  if (!registration) {
    console.error('Registration not found:', queueItem.registrationId)
    return false
  }

  // Check conditions for AFTER_END notifications
  if (notification.triggerType === 'AFTER_END' && notification.conditions) {
    const context = await buildRegistrationContext(registration)
    const conditionsMet = evaluateConditions(
      notification.conditions as Record<string, unknown>,
      context
    )

    if (!conditionsMet) {
      await prisma.webinarNotificationQueue.update({
        where: { id: queueItem.id },
        data: { status: 'SKIPPED', processedAt: new Date() },
      })
      return true
    }
  }

  // Get user's locale
  const locale = await getRegistrationLocale(registration)

  // Build template variables
  const vars = buildTemplateVars(registration)

  let subject: string
  let bodyHtml: string
  let bodyText: string

  // Use template if templateKey is set (default notifications)
  if (notification.templateKey) {
    try {
      const template = getWebinarEmailTemplate(
        notification.templateKey as WebinarTemplateKey,
        locale,
        vars
      )
      subject = template.subject
      bodyHtml = template.html
      bodyText = template.text
    } catch (error) {
      console.error('Failed to get template:', notification.templateKey, error)
      // Fall back to inline content if template fails
      subject = notification.subject || ''
      bodyHtml = notification.bodyHtml || ''
      bodyText = notification.bodyText || ''
    }
  } else {
    // Use the notification content directly (already in webinar's language)
    subject = notification.subject || ''
    bodyHtml = notification.bodyHtml || ''
    bodyText = notification.bodyText || ''

    // Replace template variables in content
    subject = replaceVariables(subject, vars)
    bodyHtml = replaceVariables(bodyHtml, vars)
    bodyText = replaceVariables(bodyText, vars)
  }

  try {
    if (notification.channel === 'EMAIL') {
      const result = await sendEmail({
        to: registration.email,
        subject,
        html: bodyHtml,
        text: bodyText,
        type: 'WEBINAR',
        // Use notification's sender settings (source of truth)
        fromName: notification.fromName,
        fromEmail: notification.fromEmail,
        replyTo: notification.replyTo,
      })

      await prisma.webinarNotificationLog.create({
        data: {
          notificationId: notification.id,
          registrationId: registration.id,
          channel: 'EMAIL',
          emailLogId: result?.messageId,
          subject,
          status: 'SENT',
        },
      })

      await prisma.webinarNotificationQueue.update({
        where: { id: queueItem.id },
        data: { status: 'SENT', processedAt: new Date() },
      })

      // Execute actions (e.g., tag contacts)
      if (notification.actions) {
        await executeActions(notification.actions as unknown as NotificationAction[], registration)
      }

      return true
    } else if (notification.channel === 'SMS') {
      console.log('[SMS STUB] Would send SMS to:', registration.phone, 'Content:', bodyText)

      await prisma.webinarNotificationLog.create({
        data: {
          notificationId: notification.id,
          registrationId: registration.id,
          channel: 'SMS',
          status: 'FAILED',
          errorMessage: 'SMS not yet implemented',
        },
      })

      await prisma.webinarNotificationQueue.update({
        where: { id: queueItem.id },
        data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'SMS not yet implemented' },
      })

      return true
    }

    return false
  } catch (error) {
    console.error('Failed to send notification:', error)

    await prisma.webinarNotificationQueue.update({
      where: { id: queueItem.id },
      data: {
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : 'Unknown error',
        status: 'FAILED',
        processedAt: new Date(),
      },
    })

    await prisma.webinarNotificationLog.create({
      data: {
        notificationId: notification.id,
        registrationId: registration.id,
        channel: notification.channel,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return false
  }
}

// ===========================================
// Variable Replacement (for custom content)
// ===========================================

function replaceVariables(content: string, vars: TemplateVars): string {
  return content
    .replace(/\{\{first_name\}\}/gi, vars.firstName)
    .replace(/\{\{webinar_title\}\}/gi, vars.webinarTitle)
    .replace(/\{\{session_date\}\}/gi, vars.sessionDate || '')
    .replace(/\{\{watch_url\}\}/gi, vars.watchUrl)
    .replace(/\{\{replay_url\}\}/gi, vars.replayUrl)
}

// ===========================================
// Action Execution
// ===========================================

interface NotificationAction {
  type: 'TAG_CONTACT'
  tagId: string
}

async function executeActions(
  actions: NotificationAction[],
  registration: WebinarRegistration
): Promise<void> {
  for (const action of actions) {
    if (action.type === 'TAG_CONTACT' && action.tagId) {
      // Find or create contact for this registration
      const contact = await prisma.contact.findUnique({
        where: { email: registration.email },
      })

      if (contact) {
        // Add tag to contact
        await prisma.contactTag.upsert({
          where: {
            contactId_tagId: {
              contactId: contact.id,
              tagId: action.tagId,
            },
          },
          create: {
            contactId: contact.id,
            tagId: action.tagId,
          },
          update: {},
        })
      }
    }
  }
}

// ===========================================
// Process Notification Queue (Cron Job)
// ===========================================

export async function processNotificationQueue(): Promise<{
  processed: number
  sent: number
  skipped: number
  failed: number
}> {
  const now = new Date()
  const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 }

  // Don't include notification here - we fetch it fresh in sendNotification
  // This allows for edits/deletions to be respected at send time
  const pendingItems = await prisma.webinarNotificationQueue.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    take: 50,
    orderBy: { scheduledAt: 'asc' },
  })

  for (const item of pendingItems) {
    stats.processed++

    await prisma.webinarNotificationQueue.update({
      where: { id: item.id },
      data: { status: 'PROCESSING' },
    })

    await sendNotification(item)

    const updatedItem = await prisma.webinarNotificationQueue.findUnique({
      where: { id: item.id },
    })

    if (updatedItem?.status === 'SENT') {
      stats.sent++
    } else if (updatedItem?.status === 'SKIPPED') {
      stats.skipped++
    } else {
      stats.failed++
    }
  }

  return stats
}

// ===========================================
// UI Helpers
// ===========================================

export async function getWebinarNotifications(webinarId: string) {
  const notifications = await prisma.webinarNotification.findMany({
    where: { webinarId },
    orderBy: [
      { triggerType: 'asc' },
      { triggerMinutes: 'asc' },
      { sortOrder: 'asc' },
    ],
    include: {
      _count: {
        select: {
          queueItems: true,
          logs: true,
        },
      },
    },
  })

  return notifications
}

export function formatTriggerDescription(
  triggerType: NotificationTriggerType,
  triggerMinutes: number
): string {
  const absMinutes = Math.abs(triggerMinutes)

  let timing: string
  if (absMinutes === 0) {
    timing = 'immediately'
  } else if (absMinutes < 60) {
    timing = `${absMinutes} minute${absMinutes === 1 ? '' : 's'}`
  } else if (absMinutes < 1440) {
    const hours = Math.floor(absMinutes / 60)
    timing = `${hours} hour${hours === 1 ? '' : 's'}`
  } else {
    const days = Math.floor(absMinutes / 1440)
    timing = `${days} day${days === 1 ? '' : 's'}`
  }

  switch (triggerType) {
    case 'AFTER_REGISTRATION':
      return triggerMinutes === 0
        ? 'Immediately after registration'
        : `${timing} after registration`
    case 'BEFORE_START':
      return `${timing} before session starts`
    case 'AFTER_END':
      return `${timing} after session ends`
    default:
      return timing
  }
}

export function getTriggerTypeLabel(triggerType: NotificationTriggerType): string {
  switch (triggerType) {
    case 'AFTER_REGISTRATION':
      return 'After Registration'
    case 'BEFORE_START':
      return 'Before Start'
    case 'AFTER_END':
      return 'After End'
    default:
      return triggerType
  }
}

// Re-export template key type for UI
export type { WebinarTemplateKey }
