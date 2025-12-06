// Course notification system
// Handles queuing and sending course-related notifications (email and SMS)
// Uses locale-based templates from content/email-templates/courses/

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { sendTemplatedSms, sendSms, normalizePhoneNumber, isValidGeorgianPhone } from '@/lib/sms'
import { logger } from '@/lib'
import type { Prisma } from '@prisma/client'
import type { CourseNotificationTrigger } from '@prisma/client'
import {
  getCourseTemplate,
  defaultNotificationConfigs,
  isValidTemplateKey,
  type CourseTemplateKey,
  type CourseTemplateVariables,
} from '@content/email-templates/courses'

// Type for enrollment with course and user info
type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: {
    course: {
      include: {
        lessons: { select: { id: true } }
      }
    }
    user: { select: { email: true; name: true; preferredLocale: true } }
    partProgress: { select: { partId: true; completedAt: true; watchTime: true } }
  }
}>

// ===========================================
// Create Default Notifications for a Course
// ===========================================

export async function createDefaultNotifications(courseId: string): Promise<void> {
  const notifications: Prisma.CourseNotificationConfigCreateManyInput[] = defaultNotificationConfigs.map(
    (config, index) => ({
      courseId,
      templateKey: config.key,
      trigger: config.trigger,
      triggerMinutes: config.triggerMinutes,
      conditions: config.conditions as Prisma.InputJsonValue | undefined,
      channel: 'EMAIL',
      isActive: config.isActive,
      isDefault: true,
      sortOrder: index,
    })
  )

  await prisma.courseNotificationConfig.createMany({
    data: notifications,
  })
}

// ===========================================
// Build Template Variables
// ===========================================

function buildTemplateVars(
  enrollment: EnrollmentWithRelations,
  extraVars?: Partial<CourseTemplateVariables>
): CourseTemplateVariables {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const courseUrl = `${baseUrl}/courses/${enrollment.course.slug}`
  const continueUrl = `${baseUrl}/courses/${enrollment.course.slug}/learn`

  // Calculate total lessons from the course
  const totalLessons = enrollment.course.lessons?.length || 0

  // Calculate lessons completed from partProgress
  const lessonsCompleted = enrollment.partProgress?.filter(p => p.completedAt).length || 0

  // Use enrollment's progressPercent or calculate it
  const progressPercent = enrollment.progressPercent || (totalLessons > 0
    ? Math.round((lessonsCompleted / totalLessons) * 100)
    : 0)

  // Format dates
  const enrolledDate = enrollment.enrolledAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let expiresDate: string | undefined
  let daysUntilExpiry: number | undefined
  if (enrollment.expiresAt) {
    expiresDate = enrollment.expiresAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const now = new Date()
    daysUntilExpiry = Math.ceil((enrollment.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Calculate time spent from partProgress
  let timeSpent: string | undefined
  const totalSeconds = enrollment.partProgress?.reduce((sum, p) => sum + (p.watchTime || 0), 0) || 0
  if (totalSeconds > 0) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (hours > 0) {
      timeSpent = `${hours}h ${minutes}m`
    } else {
      timeSpent = `${minutes} minutes`
    }
  }

  // Get student name from user
  const firstName = enrollment.user?.name?.split(' ')[0] || enrollment.user?.email?.split('@')[0] || 'Student'
  const fullName = enrollment.user?.name || firstName

  return {
    // Student info
    firstName,
    fullName,
    email: enrollment.user?.email || '',

    // Course info
    courseTitle: enrollment.course.title,
    courseUrl,
    continueUrl,

    // Progress info
    progressPercent,
    lessonsCompleted,
    totalLessons,
    timeSpent,

    // Enrollment info
    enrolledDate,
    expiresDate,
    daysUntilExpiry,

    // Unsubscribe
    unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(enrollment.user?.email || '')}`,

    // Merge extra vars
    ...extraVars,
  }
}

// ===========================================
// Get Enrollment Locale
// ===========================================

async function getEnrollmentLocale(enrollment: EnrollmentWithRelations): Promise<'en' | 'ka'> {
  // Check user's preferred locale
  if (enrollment.user?.preferredLocale) {
    const locale = enrollment.user.preferredLocale.toLowerCase()
    if (locale === 'en' || locale === 'ka') {
      return locale
    }
  }

  // Default to Georgian (site default)
  return 'ka'
}

// ===========================================
// Condition Evaluation
// ===========================================

interface EnrollmentContext {
  hasStarted: boolean
  hasNotStarted: boolean
  hasCompleted: boolean
  hasNotCompleted: boolean
  progressPercent: number
  lessonsCompleted: number
  daysInactive: number
  hasExpiration: boolean
  daysUntilExpiry: number
}

function evaluateConditions(
  conditions: Record<string, unknown> | null,
  context: EnrollmentContext
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
    const actual = context[field as keyof EnrollmentContext]

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

function buildEnrollmentContext(enrollment: EnrollmentWithRelations): EnrollmentContext {
  const totalLessons = enrollment.course.lessons?.length || 0
  const lessonsCompleted = enrollment.partProgress?.filter(p => p.completedAt).length || 0
  const progressPercent = enrollment.progressPercent || (totalLessons > 0
    ? Math.round((lessonsCompleted / totalLessons) * 100)
    : 0)

  const now = new Date()

  // Calculate inactivity - we use updatedAt as a proxy for last activity
  const lastActivity = enrollment.updatedAt
  const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

  let daysUntilExpiry = 0
  if (enrollment.expiresAt) {
    daysUntilExpiry = Math.ceil((enrollment.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Check if started - has any progress
  const hasStarted = lessonsCompleted > 0 || progressPercent > 0

  return {
    hasStarted,
    hasNotStarted: !hasStarted,
    hasCompleted: !!enrollment.completedAt,
    hasNotCompleted: !enrollment.completedAt,
    progressPercent,
    lessonsCompleted,
    daysInactive,
    hasExpiration: !!enrollment.expiresAt,
    daysUntilExpiry,
  }
}

// ===========================================
// Queue Management
// ===========================================

export async function queueNotification(
  configId: string,
  enrollmentId: string,
  scheduledAt: Date,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Check if already queued
  const existing = await prisma.courseNotificationQueue.findFirst({
    where: {
      configId,
      enrollmentId,
      status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
    },
  })

  if (existing) return

  await prisma.courseNotificationQueue.create({
    data: {
      configId,
      enrollmentId,
      scheduledAt,
      status: 'PENDING',
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function queueEnrollmentNotifications(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) return

  const notifications = await prisma.courseNotificationConfig.findMany({
    where: {
      courseId: enrollment.courseId,
      trigger: 'AFTER_ENROLLMENT',
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification.id, enrollmentId, scheduledAt)
  }
}

export async function queueCourseStartNotifications(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) return

  const notifications = await prisma.courseNotificationConfig.findMany({
    where: {
      courseId: enrollment.courseId,
      trigger: 'ON_COURSE_START',
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification.id, enrollmentId, scheduledAt)
  }
}

export async function queueLessonCompleteNotifications(
  enrollmentId: string,
  lessonId: string,
  lessonTitle: string
): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: { include: { lessons: { select: { id: true } } } },
      user: { select: { email: true, name: true, preferredLocale: true } },
      partProgress: { select: { partId: true, completedAt: true, watchTime: true } },
    },
  })

  if (!enrollment) return

  const notifications = await prisma.courseNotificationConfig.findMany({
    where: {
      courseId: enrollment.courseId,
      trigger: 'ON_LESSON_COMPLETE',
      isActive: true,
    },
  })

  const context = buildEnrollmentContext(enrollment)
  const now = new Date()

  for (const notification of notifications) {
    // Evaluate conditions (e.g., for halfway milestone)
    if (notification.conditions) {
      const conditionsMet = evaluateConditions(
        notification.conditions as Record<string, unknown>,
        context
      )
      if (!conditionsMet) continue
    }

    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification.id, enrollmentId, scheduledAt, {
      lessonId,
      lessonTitle,
    })
  }
}

export async function queueCourseCompleteNotifications(enrollmentId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) return

  const notifications = await prisma.courseNotificationConfig.findMany({
    where: {
      courseId: enrollment.courseId,
      trigger: 'ON_COURSE_COMPLETE',
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification.id, enrollmentId, scheduledAt)
  }
}

export async function queueQuizNotifications(
  enrollmentId: string,
  quizId: string,
  quizTitle: string,
  score: number,
  passingScore: number,
  passed: boolean,
  attemptsRemaining?: number
): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) return

  const trigger = passed ? 'ON_QUIZ_PASS' : 'ON_QUIZ_FAIL'

  const notifications = await prisma.courseNotificationConfig.findMany({
    where: {
      courseId: enrollment.courseId,
      trigger,
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification.id, enrollmentId, scheduledAt, {
      quizId,
      quizTitle,
      quizScore: score,
      passingScore,
      attemptsRemaining,
    })
  }
}

export async function queueCertificateNotifications(
  enrollmentId: string,
  certificateUrl: string,
  certificateId: string
): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })

  if (!enrollment) return

  const notifications = await prisma.courseNotificationConfig.findMany({
    where: {
      courseId: enrollment.courseId,
      trigger: 'ON_CERTIFICATE_ISSUED',
      isActive: true,
    },
  })

  const now = new Date()

  for (const notification of notifications) {
    const scheduledAt = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
    await queueNotification(notification.id, enrollmentId, scheduledAt, {
      certificateUrl,
      certificateId,
    })
  }
}

// ===========================================
// Send Notification
// ===========================================

export async function sendNotification(queueItem: {
  id: string
  configId: string
  enrollmentId: string
  metadata?: Prisma.JsonValue
}): Promise<boolean> {
  // Fetch notification fresh at send time (allows for edits before sending)
  const notification = await prisma.courseNotificationConfig.findUnique({
    where: { id: queueItem.configId },
  })

  // Check if notification exists and is active
  if (!notification) {
    logger.log('Notification not found (deleted), skipping:', queueItem.configId)
    await prisma.courseNotificationQueue.update({
      where: { id: queueItem.id },
      data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Notification deleted' },
    })
    return true
  }

  if (!notification.isActive) {
    logger.log('Notification is disabled, skipping:', queueItem.configId)
    await prisma.courseNotificationQueue.update({
      where: { id: queueItem.id },
      data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Notification disabled' },
    })
    return true
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: queueItem.enrollmentId },
    include: {
      course: { include: { lessons: { select: { id: true } } } },
      user: { select: { email: true, name: true, preferredLocale: true } },
      partProgress: { select: { partId: true, completedAt: true, watchTime: true } },
    },
  })

  if (!enrollment) {
    logger.error('Enrollment not found:', queueItem.enrollmentId)
    return false
  }

  // Check conditions at send time
  if (notification.conditions) {
    const context = buildEnrollmentContext(enrollment)
    const conditionsMet = evaluateConditions(
      notification.conditions as Record<string, unknown>,
      context
    )

    if (!conditionsMet) {
      await prisma.courseNotificationQueue.update({
        where: { id: queueItem.id },
        data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Conditions not met' },
      })
      return true
    }
  }

  // Get user's locale
  const locale = await getEnrollmentLocale(enrollment)

  // Build template variables with metadata
  const metadata = queueItem.metadata as Record<string, unknown> | null
  const vars = buildTemplateVars(enrollment, {
    quizTitle: metadata?.quizTitle as string | undefined,
    quizScore: metadata?.quizScore as number | undefined,
    passingScore: metadata?.passingScore as number | undefined,
    attemptsRemaining: metadata?.attemptsRemaining as number | undefined,
    certificateUrl: metadata?.certificateUrl as string | undefined,
    certificateId: metadata?.certificateId as string | undefined,
    currentLesson: metadata?.lessonTitle as string | undefined,
  })

  let subject: string
  let bodyHtml: string
  let bodyText: string

  // Use template if templateKey is set (default notifications)
  if (notification.templateKey && isValidTemplateKey(notification.templateKey)) {
    try {
      const template = getCourseTemplate(
        notification.templateKey as CourseTemplateKey,
        locale,
        vars
      )
      subject = template.subject
      bodyHtml = template.html
      bodyText = template.text
    } catch (error) {
      logger.error('Failed to get template:', notification.templateKey, error)
      // Fall back to inline content if template fails
      subject = notification.subject || ''
      bodyHtml = notification.bodyHtml || ''
      bodyText = notification.bodyText || ''
    }
  } else {
    // Use the notification content directly
    subject = notification.subject || ''
    bodyHtml = notification.bodyHtml || ''
    bodyText = notification.bodyText || ''

    // Replace template variables in content
    subject = replaceVariables(subject, vars)
    bodyHtml = replaceVariables(bodyHtml, vars)
    bodyText = replaceVariables(bodyText, vars)
  }

  const recipientEmail = enrollment.user?.email
  if (!recipientEmail) {
    logger.error('No email found for enrollment:', queueItem.enrollmentId)
    await prisma.courseNotificationQueue.update({
      where: { id: queueItem.id },
      data: { status: 'FAILED', processedAt: new Date(), lastError: 'No recipient email' },
    })
    return false
  }

  try {
    if (notification.channel === 'EMAIL') {
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        html: bodyHtml,
        text: bodyText,
        type: 'COURSE',
        // Use notification's sender settings
        fromName: notification.fromName || undefined,
        fromEmail: notification.fromEmail || undefined,
        replyTo: notification.replyTo || undefined,
      })

      await prisma.courseNotificationLog.create({
        data: {
          configId: notification.id,
          enrollmentId: enrollment.id,
          channel: 'EMAIL',
          emailLogId: result?.messageId,
          subject,
          status: 'SENT',
        },
      })

      await prisma.courseNotificationQueue.update({
        where: { id: queueItem.id },
        data: { status: 'SENT', processedAt: new Date() },
      })

      // Execute actions (e.g., tag contacts)
      if (notification.actions) {
        await executeActions(notification.actions as unknown as NotificationAction[], recipientEmail)
      }

      return true
    } else if (notification.channel === 'SMS') {
      // Get user's phone number from contact
      const contact = await prisma.contact.findUnique({
        where: { email: recipientEmail },
        select: { id: true, phone: true },
      })

      if (!contact?.phone) {
        logger.log('No phone number for user:', recipientEmail)
        await prisma.courseNotificationQueue.update({
          where: { id: queueItem.id },
          data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'No phone number' },
        })
        return true
      }

      const normalizedPhone = normalizePhoneNumber(contact.phone)
      if (!normalizedPhone || !isValidGeorgianPhone(normalizedPhone)) {
        logger.log('Invalid phone number:', contact.phone)
        await prisma.courseNotificationQueue.update({
          where: { id: queueItem.id },
          data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Invalid phone number' },
        })
        return true
      }

      // Send SMS using template slug if available, otherwise use bodyText
      let smsResult
      if (notification.smsTemplateSlug) {
        // Use SMS template system
        smsResult = await sendTemplatedSms({
          phone: normalizedPhone,
          templateSlug: notification.smsTemplateSlug,
          variables: {
            firstName: vars.firstName,
            courseTitle: vars.courseTitle,
            progressPercent: vars.progressPercent,
            link: vars.continueUrl,
          },
          locale,
          contactId: contact.id,
          type: 'TRANSACTIONAL',
          referenceType: 'course_notification',
          referenceId: notification.id,
        })
      } else {
        // Use inline message from notification
        smsResult = await sendSms({
          phone: normalizedPhone,
          message: bodyText,
          contactId: contact.id,
          type: 'TRANSACTIONAL',
          referenceType: 'course_notification',
          referenceId: notification.id,
        })
      }

      await prisma.courseNotificationLog.create({
        data: {
          configId: notification.id,
          enrollmentId: enrollment.id,
          channel: 'SMS',
          status: smsResult.success ? 'SENT' : 'FAILED',
          errorMessage: smsResult.error,
        },
      })

      await prisma.courseNotificationQueue.update({
        where: { id: queueItem.id },
        data: {
          status: smsResult.success ? 'SENT' : 'FAILED',
          processedAt: new Date(),
          lastError: smsResult.error,
        },
      })

      // Execute actions if SMS was sent successfully
      if (smsResult.success && notification.actions) {
        await executeActions(notification.actions as unknown as NotificationAction[], recipientEmail)
      }

      return smsResult.success
    }

    // Unknown channel
    logger.log('Unsupported notification channel:', notification.channel)
    await prisma.courseNotificationQueue.update({
      where: { id: queueItem.id },
      data: { status: 'SKIPPED', processedAt: new Date(), lastError: 'Channel not supported' },
    })
    return false
  } catch (error) {
    logger.error('Failed to send notification:', error)

    await prisma.courseNotificationQueue.update({
      where: { id: queueItem.id },
      data: {
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : 'Unknown error',
        status: 'FAILED',
        processedAt: new Date(),
      },
    })

    await prisma.courseNotificationLog.create({
      data: {
        configId: notification.id,
        enrollmentId: enrollment.id,
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

function replaceVariables(content: string, vars: CourseTemplateVariables): string {
  return content
    .replace(/\{\{first_name\}\}/gi, vars.firstName)
    .replace(/\{\{full_name\}\}/gi, vars.fullName)
    .replace(/\{\{email\}\}/gi, vars.email)
    .replace(/\{\{course_title\}\}/gi, vars.courseTitle)
    .replace(/\{\{course_url\}\}/gi, vars.courseUrl)
    .replace(/\{\{continue_url\}\}/gi, vars.continueUrl)
    .replace(/\{\{progress_percent\}\}/gi, String(vars.progressPercent))
    .replace(/\{\{lessons_completed\}\}/gi, String(vars.lessonsCompleted))
    .replace(/\{\{total_lessons\}\}/gi, String(vars.totalLessons))
    .replace(/\{\{time_spent\}\}/gi, vars.timeSpent || '')
    .replace(/\{\{enrolled_date\}\}/gi, vars.enrolledDate)
    .replace(/\{\{expires_date\}\}/gi, vars.expiresDate || '')
    .replace(/\{\{days_until_expiry\}\}/gi, String(vars.daysUntilExpiry || ''))
    .replace(/\{\{quiz_title\}\}/gi, vars.quizTitle || '')
    .replace(/\{\{quiz_score\}\}/gi, String(vars.quizScore || ''))
    .replace(/\{\{passing_score\}\}/gi, String(vars.passingScore || ''))
    .replace(/\{\{attempts_remaining\}\}/gi, String(vars.attemptsRemaining || ''))
    .replace(/\{\{certificate_url\}\}/gi, vars.certificateUrl || '')
    .replace(/\{\{certificate_id\}\}/gi, vars.certificateId || '')
    .replace(/\{\{current_lesson\}\}/gi, vars.currentLesson || '')
    .replace(/\{\{unsubscribe_url\}\}/gi, vars.unsubscribeUrl || '')
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
  email: string
): Promise<void> {
  for (const action of actions) {
    if (action.type === 'TAG_CONTACT' && action.tagId) {
      // Find contact by email
      const contact = await prisma.contact.findUnique({
        where: { email },
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

  const pendingItems = await prisma.courseNotificationQueue.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    take: 50,
    orderBy: { scheduledAt: 'asc' },
  })

  for (const item of pendingItems) {
    stats.processed++

    await prisma.courseNotificationQueue.update({
      where: { id: item.id },
      data: { status: 'PROCESSING' },
    })

    await sendNotification(item)

    const updatedItem = await prisma.courseNotificationQueue.findUnique({
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
// Check Inactivity and Expiration (Cron Job)
// ===========================================

export async function checkInactivityNotifications(): Promise<number> {
  const now = new Date()
  let queued = 0

  // Get all active courses with inactivity notifications
  const courses = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      notifications: {
        some: {
          trigger: 'ON_INACTIVITY',
          isActive: true,
        },
      },
    },
    include: {
      notifications: {
        where: {
          trigger: 'ON_INACTIVITY',
          isActive: true,
        },
      },
    },
  })

  for (const course of courses) {
    for (const notification of course.notifications) {
      const inactivityThreshold = new Date(now.getTime() - notification.triggerMinutes * 60 * 1000)

      // Find enrollments that have been inactive for the specified time
      const inactiveEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: course.id,
          status: 'ACTIVE',
          completedAt: null, // Not completed
          updatedAt: { lt: inactivityThreshold },
          // Exclude those who already received this notification
          NOT: {
            notificationQueue: {
              some: {
                configId: notification.id,
                status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
              },
            },
          },
        },
        include: {
          course: { include: { lessons: { select: { id: true } } } },
          user: { select: { email: true, name: true, preferredLocale: true } },
          partProgress: { select: { partId: true, completedAt: true, watchTime: true } },
        },
      })

      for (const enrollment of inactiveEnrollments) {
        // Check conditions
        if (notification.conditions) {
          const context = buildEnrollmentContext(enrollment)
          if (!evaluateConditions(notification.conditions as Record<string, unknown>, context)) {
            continue
          }
        }

        await queueNotification(notification.id, enrollment.id, now)
        queued++
      }
    }
  }

  return queued
}

export async function checkExpirationNotifications(): Promise<number> {
  const now = new Date()
  let queued = 0

  // Get all active courses with expiration notifications
  const courses = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      notifications: {
        some: {
          trigger: 'BEFORE_EXPIRATION',
          isActive: true,
        },
      },
    },
    include: {
      notifications: {
        where: {
          trigger: 'BEFORE_EXPIRATION',
          isActive: true,
        },
      },
    },
  })

  for (const course of courses) {
    for (const notification of course.notifications) {
      // Calculate the expiration window
      const warningThreshold = new Date(now.getTime() + notification.triggerMinutes * 60 * 1000)
      const windowStart = now
      const windowEnd = warningThreshold

      // Find enrollments that expire within the window
      const expiringEnrollments = await prisma.enrollment.findMany({
        where: {
          courseId: course.id,
          status: 'ACTIVE',
          completedAt: null, // Not completed
          expiresAt: {
            gte: windowStart,
            lte: windowEnd,
          },
          // Exclude those who already received this notification
          NOT: {
            notificationQueue: {
              some: {
                configId: notification.id,
                status: { in: ['PENDING', 'PROCESSING', 'SENT'] },
              },
            },
          },
        },
        include: {
          course: { include: { lessons: { select: { id: true } } } },
          user: { select: { email: true, name: true, preferredLocale: true } },
          partProgress: { select: { partId: true, completedAt: true, watchTime: true } },
        },
      })

      for (const enrollment of expiringEnrollments) {
        // Check conditions
        if (notification.conditions) {
          const context = buildEnrollmentContext(enrollment)
          if (!evaluateConditions(notification.conditions as Record<string, unknown>, context)) {
            continue
          }
        }

        await queueNotification(notification.id, enrollment.id, now)
        queued++
      }
    }
  }

  return queued
}

// ===========================================
// UI Helpers
// ===========================================

export async function getCourseNotifications(courseId: string) {
  const notifications = await prisma.courseNotificationConfig.findMany({
    where: { courseId },
    orderBy: [{ trigger: 'asc' }, { triggerMinutes: 'asc' }, { sortOrder: 'asc' }],
    include: {
      _count: {
        select: {
          queue: true,
          logs: true,
        },
      },
    },
  })

  return notifications
}

export function formatTriggerDescription(
  trigger: CourseNotificationTrigger,
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

  switch (trigger) {
    case 'AFTER_ENROLLMENT':
      return triggerMinutes === 0 ? 'Immediately after enrollment' : `${timing} after enrollment`
    case 'ON_COURSE_START':
      return triggerMinutes === 0 ? 'When course is started' : `${timing} after course start`
    case 'ON_LESSON_COMPLETE':
      return triggerMinutes === 0 ? 'When lesson is completed' : `${timing} after lesson complete`
    case 'ON_MODULE_COMPLETE':
      return triggerMinutes === 0 ? 'When module is completed' : `${timing} after module complete`
    case 'ON_COURSE_COMPLETE':
      return triggerMinutes === 0 ? 'When course is completed' : `${timing} after course complete`
    case 'ON_QUIZ_PASS':
      return triggerMinutes === 0 ? 'When quiz is passed' : `${timing} after quiz pass`
    case 'ON_QUIZ_FAIL':
      return triggerMinutes === 0 ? 'When quiz is failed' : `${timing} after quiz fail`
    case 'ON_INACTIVITY':
      return `After ${timing} of inactivity`
    case 'BEFORE_EXPIRATION':
      return `${timing} before access expires`
    case 'ON_CERTIFICATE_ISSUED':
      return triggerMinutes === 0 ? 'When certificate is issued' : `${timing} after certificate issued`
    default:
      return timing
  }
}

export function getTriggerTypeLabel(trigger: CourseNotificationTrigger): string {
  switch (trigger) {
    case 'AFTER_ENROLLMENT':
      return 'After Enrollment'
    case 'ON_COURSE_START':
      return 'Course Started'
    case 'ON_LESSON_COMPLETE':
      return 'Lesson Complete'
    case 'ON_MODULE_COMPLETE':
      return 'Module Complete'
    case 'ON_COURSE_COMPLETE':
      return 'Course Complete'
    case 'ON_QUIZ_PASS':
      return 'Quiz Passed'
    case 'ON_QUIZ_FAIL':
      return 'Quiz Failed'
    case 'ON_INACTIVITY':
      return 'Inactivity'
    case 'BEFORE_EXPIRATION':
      return 'Before Expiration'
    case 'ON_CERTIFICATE_ISSUED':
      return 'Certificate Issued'
    default:
      return trigger
  }
}

// Re-export template types for UI
export type { CourseTemplateKey }
