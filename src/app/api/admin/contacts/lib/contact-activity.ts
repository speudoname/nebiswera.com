import { prisma } from '@/lib/db'
import type { ActivityType, Contact } from '@prisma/client'

interface LogActivityParams {
  contactId: string
  type: ActivityType
  description: string
  metadata?: Record<string, unknown>
  createdBy?: string
}

export async function logActivity({
  contactId,
  type,
  description,
  metadata,
  createdBy,
}: LogActivityParams) {
  return prisma.contactActivity.create({
    data: {
      contactId,
      type,
      description,
      metadata: metadata as object | undefined,
      createdBy: createdBy || undefined,
    },
  })
}

export async function logContactCreated(
  contact: Pick<Contact, 'id' | 'email' | 'firstName' | 'lastName'>,
  createdBy?: string,
  source?: string
) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email
  return logActivity({
    contactId: contact.id,
    type: 'CREATED',
    description: `Contact "${name}" was created`,
    metadata: { source },
    createdBy,
  })
}

export async function logContactUpdated(
  contactId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  createdBy?: string
) {
  const changedFields = Object.keys(changes).join(', ')
  return logActivity({
    contactId,
    type: 'UPDATED',
    description: `Contact updated: ${changedFields}`,
    metadata: { changes },
    createdBy,
  })
}

export async function logStatusChanged(
  contactId: string,
  oldStatus: string,
  newStatus: string,
  createdBy?: string
) {
  return logActivity({
    contactId,
    type: 'STATUS_CHANGED',
    description: `Status changed from ${oldStatus} to ${newStatus}`,
    metadata: { oldStatus, newStatus },
    createdBy,
  })
}

export async function logTagAdded(
  contactId: string,
  tagName: string,
  createdBy?: string
) {
  return logActivity({
    contactId,
    type: 'TAG_ADDED',
    description: `Tag "${tagName}" added`,
    metadata: { tagName },
    createdBy,
  })
}

export async function logTagRemoved(
  contactId: string,
  tagName: string,
  createdBy?: string
) {
  return logActivity({
    contactId,
    type: 'TAG_REMOVED',
    description: `Tag "${tagName}" removed`,
    metadata: { tagName },
    createdBy,
  })
}

export async function logTagsAdded(
  contactId: string,
  tagNames: string[],
  createdBy?: string
) {
  if (tagNames.length === 0) return
  return logActivity({
    contactId,
    type: 'TAG_ADDED',
    description: `Tags added: ${tagNames.join(', ')}`,
    metadata: { tagNames },
    createdBy,
  })
}

export async function logTagsRemoved(
  contactId: string,
  tagNames: string[],
  createdBy?: string
) {
  if (tagNames.length === 0) return
  return logActivity({
    contactId,
    type: 'TAG_REMOVED',
    description: `Tags removed: ${tagNames.join(', ')}`,
    metadata: { tagNames },
    createdBy,
  })
}

export async function logContactImported(
  contactId: string,
  fileName: string,
  createdBy?: string
) {
  return logActivity({
    contactId,
    type: 'IMPORTED',
    description: `Imported from "${fileName}"`,
    metadata: { fileName },
    createdBy,
  })
}

export async function logNoteAdded(
  contactId: string,
  notePreview: string,
  createdBy?: string
) {
  return logActivity({
    contactId,
    type: 'NOTE_ADDED',
    description: `Note added: "${notePreview.slice(0, 50)}${notePreview.length > 50 ? '...' : ''}"`,
    metadata: { notePreview },
    createdBy,
  })
}

export async function logEmailSent(
  contactId: string,
  emailSubject: string,
  emailType: string
) {
  return logActivity({
    contactId,
    type: 'EMAIL_SENT',
    description: `Email sent: "${emailSubject}"`,
    metadata: { emailSubject, emailType },
  })
}

export async function logEmailOpened(
  contactId: string,
  emailSubject: string
) {
  return logActivity({
    contactId,
    type: 'EMAIL_OPENED',
    description: `Email opened: "${emailSubject}"`,
    metadata: { emailSubject },
  })
}

export async function logEmailBounced(
  contactId: string,
  emailSubject: string,
  bounceType?: string
) {
  return logActivity({
    contactId,
    type: 'EMAIL_BOUNCED',
    description: `Email bounced: "${emailSubject}"${bounceType ? ` (${bounceType})` : ''}`,
    metadata: { emailSubject, bounceType },
  })
}

export async function getContactActivities(
  contactId: string,
  options?: { limit?: number; offset?: number }
) {
  const { limit = 50, offset = 0 } = options || {}

  return prisma.contactActivity.findMany({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export async function getActivityCount(contactId: string) {
  return prisma.contactActivity.count({
    where: { contactId },
  })
}
