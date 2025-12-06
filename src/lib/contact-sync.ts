/**
 * Contact Sync Utilities
 *
 * Real-time sync between webinar registrations and CRM contacts.
 * All sync happens immediately during API calls - no background jobs needed.
 *
 * FILTERING SUPPORT:
 * - Contacts can be filtered by which webinars they registered for
 * - Contacts can be filtered by attendance status
 * - All data stored in Contact.customFields.webinarStats for easy querying
 */

import { prisma } from '@/lib/db'
import { ActivityType, Prisma, type Contact, type WebinarRegistration } from '@prisma/client'
import { logger } from '@/lib'

interface WebinarRegistrationData {
  webinarId: string
  webinarTitle: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  customFieldResponses?: Prisma.InputJsonValue
  sessionType: string
  sessionId?: string | null
  timezone: string
  source?: string
}

interface WebinarStats {
  [key: string]: unknown // Index signature for Prisma JsonValue compatibility
  totalRegistrations: number
  totalAttended: number
  totalCompleted: number
  totalWatchTime: number
  webinars: Record<
    string,
    {
      webinarId: string
      webinarTitle: string
      registered: boolean
      attended: boolean
      completed: boolean
      completion: number // Percentage (0-100)
      watchTime: number // Total watch time in seconds
      maxVideoPosition: number // Furthest point watched in seconds
      sessionType: string // SCHEDULED, ON_DEMAND, REPLAY
      sessionId?: string // ID of specific scheduled session (null for on-demand/replay)
      registrationId: string // Link back to WebinarRegistration for full details
      registeredAt: string
      attendedAt?: string
      completedAt?: string
      // Interaction responses (polls, questions, CTAs)
      interactions?: Record<
        string,
        {
          interactionId: string
          type: string // POLL, QUESTION, CTA, etc.
          title: string
          respondedAt: string
          response: {
            selectedOptions?: number[] // For polls
            textResponse?: string // For questions
            rating?: number // For feedback
            clicked?: boolean // For CTAs
          }
        }
      >
    }
  >
}

// Type for contact's customFields JSON
interface ContactCustomFields {
  webinarStats?: WebinarStats
  [key: string]: unknown
}

/**
 * Get webinar stats from a contact, initializing if not present
 */
function getWebinarStats(contact: Contact): { customFields: ContactCustomFields; webinarStats: WebinarStats } {
  const customFields = (contact.customFields as ContactCustomFields) || {}
  const webinarStats: WebinarStats = customFields.webinarStats || {
    totalRegistrations: 0,
    totalAttended: 0,
    totalCompleted: 0,
    totalWatchTime: 0,
    webinars: {},
  }
  return { customFields, webinarStats }
}

/**
 * Sync webinar registration to CRM contact
 * Creates contact if doesn't exist, updates if exists
 * Adds activity entry and updates webinar stats
 */
export async function syncWebinarRegistrationToContact(
  data: WebinarRegistrationData,
  registrationId: string
): Promise<Contact> {
  const {
    email,
    firstName,
    lastName,
    phone,
    webinarId,
    webinarTitle,
    sessionType,
    sessionId,
    timezone,
    customFieldResponses,
  } = data

  // Find or create contact
  let contact = await prisma.contact.findUnique({
    where: { email },
  })

  const now = new Date()

  if (!contact) {
    // Create new contact
    contact = await prisma.contact.create({
      data: {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        source: 'webinar',
        sourceDetails: webinarTitle,
        status: 'ACTIVE',
        marketingStatus: 'SUBSCRIBED',
        customFields: {
          webinarStats: {
            totalRegistrations: 1,
            totalAttended: 0,
            totalCompleted: 0,
            totalWatchTime: 0,
            webinars: {
              [webinarId]: {
                webinarId,
                webinarTitle,
                registered: true,
                attended: false,
                completed: false,
                completion: 0,
                watchTime: 0,
                maxVideoPosition: 0,
                sessionType,
                sessionId: sessionId || undefined,
                registrationId,
                registeredAt: now.toISOString(),
                interactions: {},
              },
            },
          },
        },
      },
    })

    // Add creation activity
    await prisma.contactActivity.create({
      data: {
        contactId: contact.id,
        type: 'CREATED',
        description: `Contact created via webinar registration: ${webinarTitle}`,
        metadata: {
          source: 'webinar',
          webinarId,
          webinarTitle,
        },
      },
    })
  } else {
    // Update existing contact
    const { customFields, webinarStats } = getWebinarStats(contact)

    // Update webinar-specific stats
    if (!webinarStats.webinars[webinarId]) {
      webinarStats.totalRegistrations++
      webinarStats.webinars[webinarId] = {
        webinarId,
        webinarTitle,
        registered: true,
        attended: false,
        completed: false,
        completion: 0,
        watchTime: 0,
        maxVideoPosition: 0,
        sessionType,
        sessionId: sessionId || undefined,
        registrationId,
        registeredAt: now.toISOString(),
        interactions: {},
      }
    }

    // Update contact
    contact = await prisma.contact.update({
      where: { id: contact.id },
      data: {
        firstName: firstName || contact.firstName,
        lastName: lastName || contact.lastName,
        phone: phone || contact.phone,
        customFields: {
          ...customFields,
          webinarStats,
        } as Prisma.InputJsonValue,
      },
    })
  }

  // Add webinar registration activity
  await prisma.contactActivity.create({
    data: {
      contactId: contact.id,
      type: 'WEBINAR_REGISTERED',
      description: `Registered for webinar: ${webinarTitle}`,
      metadata: {
        webinarId,
        webinarTitle,
        sessionType,
        registrationId,
        timezone,
        customFieldResponses,
      },
    },
  })

  // Link registration to contact
  await prisma.webinarRegistration.update({
    where: { id: registrationId },
    data: { contactId: contact.id },
  })

  // Apply automation rules (tag assignment)
  await applyAutomationRules(webinarId, contact.id, 'REGISTERED')

  return contact
}

/**
 * Update contact when user attends webinar (joins watch room)
 */
export async function syncWebinarAttendance(
  registration: WebinarRegistration & { webinar: { title: string } }
): Promise<void> {
  if (!registration.contactId) return

  const contact = await prisma.contact.findUnique({
    where: { id: registration.contactId },
  })

  if (!contact) return

  const { customFields, webinarStats } = getWebinarStats(contact)

  const webinarId = registration.webinarId

  // Update attendance stats
  if (webinarStats.webinars[webinarId] && !webinarStats.webinars[webinarId].attended) {
    webinarStats.totalAttended++
    webinarStats.webinars[webinarId].attended = true
    webinarStats.webinars[webinarId].attendedAt = new Date().toISOString()

    // Update contact
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        customFields: {
          ...customFields,
          webinarStats,
        } as Prisma.InputJsonValue,
      },
    })

    // Add activity
    await prisma.contactActivity.create({
      data: {
        contactId: contact.id,
        type: 'WEBINAR_ATTENDED',
        description: `Attended webinar: ${registration.webinar.title}`,
        metadata: {
          webinarId,
          webinarTitle: registration.webinar.title,
          registrationId: registration.id,
          joinedAt: registration.joinedAt,
        },
      },
    })

    // Apply automation rules
    await applyAutomationRules(webinarId, contact.id, 'ATTENDED')
  }
}

/**
 * Update contact when user completes webinar
 */
export async function syncWebinarCompletion(
  registration: WebinarRegistration & { webinar: { title: string; videoDuration?: number | null } }
): Promise<void> {
  if (!registration.contactId) return

  const contact = await prisma.contact.findUnique({
    where: { id: registration.contactId },
  })

  if (!contact) return

  const { customFields, webinarStats } = getWebinarStats(contact)

  const webinarId = registration.webinarId

  // Update completion stats
  if (webinarStats.webinars[webinarId] && !webinarStats.webinars[webinarId].completed) {
    webinarStats.totalCompleted++
    webinarStats.webinars[webinarId].completed = true
    webinarStats.webinars[webinarId].completedAt = new Date().toISOString()

    // Calculate completion percentage
    const videoDuration = registration.webinar.videoDuration || 1
    const completion = Math.min(100, Math.floor((registration.maxVideoPosition / videoDuration) * 100))
    webinarStats.webinars[webinarId].completion = completion
    webinarStats.webinars[webinarId].maxVideoPosition = registration.maxVideoPosition

    // Update contact
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        customFields: {
          ...customFields,
          webinarStats,
        } as Prisma.InputJsonValue,
      },
    })

    // Add activity
    await prisma.contactActivity.create({
      data: {
        contactId: contact.id,
        type: 'WEBINAR_COMPLETED',
        description: `Completed webinar: ${registration.webinar.title} (${completion}%)`,
        metadata: {
          webinarId,
          webinarTitle: registration.webinar.title,
          registrationId: registration.id,
          completion,
          watchTime: registration.watchTimeSeconds,
        },
      },
    })

    // Apply automation rules
    await applyAutomationRules(webinarId, contact.id, 'COMPLETED')
  }
}

/**
 * Update contact watch time (called periodically during video playback)
 */
export async function syncWebinarWatchTime(registration: WebinarRegistration): Promise<void> {
  if (!registration.contactId) return

  const contact = await prisma.contact.findUnique({
    where: { id: registration.contactId },
  })

  if (!contact) return

  const { customFields, webinarStats } = getWebinarStats(contact)

  const webinarId = registration.webinarId

  if (webinarStats.webinars[webinarId]) {
    // Calculate delta (only count new watch time)
    const oldWatchTime = webinarStats.webinars[webinarId].watchTime || 0
    const newWatchTime = registration.watchTimeSeconds
    const delta = newWatchTime - oldWatchTime

    if (delta > 0) {
      webinarStats.totalWatchTime += delta
      webinarStats.webinars[webinarId].watchTime = newWatchTime

      // Update contact (silently, no activity entry for watch time updates)
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          customFields: {
            ...customFields,
            webinarStats,
          } as Prisma.InputJsonValue,
        },
      })
    }
  }
}

/**
 * Apply automation rules for tag assignment
 */
async function applyAutomationRules(
  webinarId: string,
  contactId: string,
  trigger: 'REGISTERED' | 'ATTENDED' | 'COMPLETED' | 'MISSED'
): Promise<void> {
  // Find automation rules for this webinar and trigger
  const rules = await prisma.webinarAutomationRule.findMany({
    where: {
      webinarId,
      trigger,
      enabled: true,
    },
  })

  if (rules.length === 0) return

  // Collect all tag IDs to assign
  const tagIdsToAssign = new Set<string>()
  for (const rule of rules) {
    for (const tagId of rule.tagIds) {
      tagIdsToAssign.add(tagId)
    }
  }

  // Get existing tags for this contact
  const existingTags = await prisma.contactTag.findMany({
    where: { contactId },
    select: { tagId: true },
  })

  const existingTagIds = new Set(existingTags.map((ct) => ct.tagId))

  // Assign new tags
  for (const tagId of Array.from(tagIdsToAssign)) {
    if (!existingTagIds.has(tagId)) {
      try {
        // Assign tag
        await prisma.contactTag.create({
          data: {
            contactId,
            tagId,
          },
        })

        // Get tag name for activity
        const tag = await prisma.tag.findUnique({
          where: { id: tagId },
          select: { name: true },
        })

        // Add activity
        await prisma.contactActivity.create({
          data: {
            contactId,
            type: 'TAG_ADDED',
            description: `Tag "${tag?.name}" auto-assigned via webinar automation`,
            metadata: {
              tagId,
              tagName: tag?.name,
              source: 'webinar_automation',
              webinarId,
              trigger,
            },
          },
        })
      } catch (error) {
        // Ignore duplicate tag errors
        logger.error(`Failed to assign tag ${tagId} to contact ${contactId}:`, error)
      }
    }
  }
}

/**
 * FILTERING HELPERS
 * These functions help filter contacts by webinar activity
 */

/**
 * Filter contacts who registered for a specific webinar
 */
export async function getContactsRegisteredForWebinar(webinarId: string) {
  const contacts = await prisma.contact.findMany({
    where: {
      customFields: {
        path: ['webinarStats', 'webinars', webinarId, 'registered'],
        equals: true,
      },
    },
  })
  return contacts
}

/**
 * Filter contacts who attended a specific webinar
 */
export async function getContactsWhoAttendedWebinar(webinarId: string) {
  const contacts = await prisma.contact.findMany({
    where: {
      customFields: {
        path: ['webinarStats', 'webinars', webinarId, 'attended'],
        equals: true,
      },
    },
  })
  return contacts
}

/**
 * Filter contacts who completed a specific webinar
 */
export async function getContactsWhoCompletedWebinar(webinarId: string) {
  const contacts = await prisma.contact.findMany({
    where: {
      customFields: {
        path: ['webinarStats', 'webinars', webinarId, 'completed'],
        equals: true,
      },
    },
  })
  return contacts
}

/**
 * Filter contacts who watched X% or more of a specific webinar
 * Note: Uses raw SQL for numeric comparison in JSONB
 */
export async function getContactsByWatchPercentage(webinarId: string, minPercentage: number) {
  // Using Prisma raw query for numeric JSONB comparison
  const contacts = await prisma.$queryRaw<Contact[]>`
    SELECT * FROM crm.contacts
    WHERE ("customFields"#>>'{webinarStats,webinars,${webinarId},completion}')::int >= ${minPercentage}
  `
  return contacts
}

/**
 * Filter contacts by session type (SCHEDULED, ON_DEMAND, REPLAY)
 */
export async function getContactsBySessionType(webinarId: string, sessionType: string) {
  const contacts = await prisma.contact.findMany({
    where: {
      customFields: {
        path: ['webinarStats', 'webinars', webinarId, 'sessionType'],
        equals: sessionType,
      },
    },
  })
  return contacts
}

/**
 * Filter contacts who attended a specific scheduled session
 */
export async function getContactsByScheduledSession(webinarId: string, sessionId: string) {
  const contacts = await prisma.contact.findMany({
    where: {
      customFields: {
        path: ['webinarStats', 'webinars', webinarId, 'sessionId'],
        equals: sessionId,
      },
    },
  })
  return contacts
}

/**
 * Sync interaction response to contact
 * Called when user responds to a poll, question, CTA, etc.
 */
export async function syncInteractionResponse(
  registrationId: string,
  interactionData: {
    interactionId: string
    type: string
    title: string
    response: {
      selectedOptions?: number[]
      textResponse?: string
      rating?: number
      clicked?: boolean
    }
  }
): Promise<void> {
  // Get registration with contact
  const registration = await prisma.webinarRegistration.findUnique({
    where: { id: registrationId },
    include: {
      webinar: {
        select: { id: true, title: true },
      },
    },
  })

  if (!registration || !registration.contactId) return

  const contact = await prisma.contact.findUnique({
    where: { id: registration.contactId },
  })

  if (!contact) return

  const { customFields, webinarStats } = getWebinarStats(contact)

  const webinarId = registration.webinarId

  if (webinarStats.webinars[webinarId]) {
    // Initialize interactions object if it doesn't exist
    if (!webinarStats.webinars[webinarId].interactions) {
      webinarStats.webinars[webinarId].interactions = {}
    }

    // Add/update interaction response
    webinarStats.webinars[webinarId].interactions![interactionData.interactionId] = {
      interactionId: interactionData.interactionId,
      type: interactionData.type,
      title: interactionData.title,
      respondedAt: new Date().toISOString(),
      response: interactionData.response,
    }

    // Update contact
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        customFields: {
          ...customFields,
          webinarStats,
        } as Prisma.InputJsonValue,
      },
    })
  }
}
