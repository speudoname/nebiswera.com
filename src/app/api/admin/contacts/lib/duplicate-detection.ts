import { prisma } from '@/lib/db'
import { logger } from '@/lib'

interface DuplicateMatch {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  matchType: 'exact_email' | 'normalized_email' | 'name_phone'
  matchScore: number
}

interface ImportContact {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}

function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().trim().split('@')
  if (!domain) return email.toLowerCase().trim()

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const normalizedLocal = local.replace(/\./g, '').split('+')[0]
    return `${normalizedLocal}@gmail.com`
  }

  return `${local.split('+')[0]}@${domain}`
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function normalizeName(name: string | null | undefined): string {
  return (name || '').toLowerCase().trim()
}

export async function findDuplicatesForEmail(
  email: string
): Promise<DuplicateMatch[]> {
  const normalized = normalizeEmail(email)
  const duplicates: DuplicateMatch[] = []

  const exactMatch = await prisma.contact.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true },
  })

  if (exactMatch) {
    duplicates.push({
      ...exactMatch,
      matchType: 'exact_email',
      matchScore: 100,
    })
  }

  if (normalized !== email.toLowerCase().trim()) {
    // Only search within the same email domain for normalized matches
    // This avoids loading ALL contacts into memory
    const domain = email.toLowerCase().trim().split('@')[1]

    // For Gmail/Googlemail, search both domains; otherwise just the same domain
    const isGmailDomain = domain === 'gmail.com' || domain === 'googlemail.com'
    const domainFilter = isGmailDomain
      ? { OR: [{ email: { endsWith: '@gmail.com' } }, { email: { endsWith: '@googlemail.com' } }] }
      : { email: { endsWith: `@${domain}` } }

    const normalizedMatches = await prisma.contact.findMany({
      where: {
        NOT: { email: email.toLowerCase().trim() },
        ...domainFilter,
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    })

    for (const contact of normalizedMatches) {
      if (normalizeEmail(contact.email) === normalized) {
        duplicates.push({
          ...contact,
          matchType: 'normalized_email',
          matchScore: 90,
        })
      }
    }
  }

  return duplicates
}

export async function findDuplicatesForImport(
  contacts: ImportContact[]
): Promise<Map<number, DuplicateMatch[]>> {
  const duplicateMap = new Map<number, DuplicateMatch[]>()

  const emails = contacts.map((c) => c.email.toLowerCase().trim())
  const existingContacts = await prisma.contact.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true },
  })

  const existingEmailMap = new Map(
    existingContacts.map((c) => [c.email.toLowerCase(), c])
  )

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    const email = contact.email.toLowerCase().trim()
    const duplicates: DuplicateMatch[] = []

    const exactMatch = existingEmailMap.get(email)
    if (exactMatch) {
      duplicates.push({
        ...exactMatch,
        matchType: 'exact_email',
        matchScore: 100,
      })
    }

    const normalized = normalizeEmail(email)
    if (normalized !== email) {
      for (const existing of existingContacts) {
        if (
          existing.email.toLowerCase() !== email &&
          normalizeEmail(existing.email) === normalized
        ) {
          duplicates.push({
            ...existing,
            matchType: 'normalized_email',
            matchScore: 90,
          })
        }
      }
    }

    if (duplicates.length > 0) {
      duplicateMap.set(i, duplicates)
    }
  }

  return duplicateMap
}

export async function findAllDuplicates(): Promise<{
  groups: Array<{
    contacts: Array<{
      id: string
      email: string
      firstName: string | null
      lastName: string | null
      phone: string | null
      createdAt: Date
    }>
    matchType: 'exact_email' | 'normalized_email' | 'name_phone'
  }>
  totalDuplicates: number
}> {
  const groups: Array<{
    contacts: Array<{
      id: string
      email: string
      firstName: string | null
      lastName: string | null
      phone: string | null
      createdAt: Date
    }>
    matchType: 'exact_email' | 'normalized_email' | 'name_phone'
  }> = []

  const allContacts = await prisma.contact.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const normalizedEmailGroups = new Map<string, typeof allContacts>()

  for (const contact of allContacts) {
    const normalized = normalizeEmail(contact.email)
    const group = normalizedEmailGroups.get(normalized) || []
    group.push(contact)
    normalizedEmailGroups.set(normalized, group)
  }

  normalizedEmailGroups.forEach((groupContacts) => {
    if (groupContacts.length > 1) {
      const allSameEmail = groupContacts.every(
        (c) => c.email.toLowerCase() === groupContacts[0].email.toLowerCase()
      )

      groups.push({
        contacts: groupContacts,
        matchType: allSameEmail ? 'exact_email' : 'normalized_email',
      })
    }
  })

  const phoneGroups = new Map<string, typeof allContacts>()
  const processedIds = new Set(groups.flatMap((g) => g.contacts.map((c) => c.id)))

  for (const contact of allContacts) {
    if (processedIds.has(contact.id)) continue
    if (!contact.phone) continue

    const normalizedPhone = normalizePhone(contact.phone)
    if (normalizedPhone.length < 7) continue

    const fullName = `${normalizeName(contact.firstName)} ${normalizeName(contact.lastName)}`.trim()
    if (!fullName) continue

    const key = `${fullName}:${normalizedPhone}`
    const group = phoneGroups.get(key) || []
    group.push(contact)
    phoneGroups.set(key, group)
  }

  phoneGroups.forEach((groupContacts) => {
    if (groupContacts.length > 1) {
      groups.push({
        contacts: groupContacts,
        matchType: 'name_phone',
      })
    }
  })

  return {
    groups,
    totalDuplicates: groups.reduce((sum, g) => sum + g.contacts.length, 0),
  }
}

export async function mergeContacts(
  primaryId: string,
  secondaryId: string,
  createdBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [primary, secondary] = await Promise.all([
      prisma.contact.findUnique({
        where: { id: primaryId },
        include: { tags: true },
      }),
      prisma.contact.findUnique({
        where: { id: secondaryId },
        include: { tags: true },
      }),
    ])

    if (!primary || !secondary) {
      return { success: false, error: 'One or both contacts not found' }
    }

    const updatedData: Record<string, string | null> = {}
    if (!primary.firstName && secondary.firstName) {
      updatedData.firstName = secondary.firstName
    }
    if (!primary.lastName && secondary.lastName) {
      updatedData.lastName = secondary.lastName
    }
    if (!primary.phone && secondary.phone) {
      updatedData.phone = secondary.phone
    }
    if (!primary.notes && secondary.notes) {
      updatedData.notes = secondary.notes
    }

    const primaryTagIds = new Set(primary.tags.map((t) => t.tagId))
    const newTags = secondary.tags.filter((t) => !primaryTagIds.has(t.tagId))

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updatedData).length > 0) {
        await tx.contact.update({
          where: { id: primaryId },
          data: updatedData,
        })
      }

      if (newTags.length > 0) {
        await tx.contactTag.createMany({
          data: newTags.map((t) => ({
            contactId: primaryId,
            tagId: t.tagId,
          })),
          skipDuplicates: true,
        })
      }

      await tx.contactActivity.updateMany({
        where: { contactId: secondaryId },
        data: { contactId: primaryId },
      })

      await tx.contactActivity.create({
        data: {
          contactId: primaryId,
          type: 'UPDATED',
          description: `Merged with contact "${secondary.email}"`,
          metadata: {
            mergedContactId: secondaryId,
            mergedEmail: secondary.email,
            fieldsMerged: Object.keys(updatedData),
            tagsMerged: newTags.map((t) => t.tagId),
          },
          createdBy,
        },
      })

      await tx.contact.delete({
        where: { id: secondaryId },
      })
    })

    return { success: true }
  } catch (error) {
    logger.error('Merge failed:', error)
    return { success: false, error: 'Merge operation failed' }
  }
}
