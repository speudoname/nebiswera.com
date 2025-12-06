/**
 * Engagement Tier Logic
 *
 * Calculates and updates contact engagement tiers based on email activity.
 * Tiers determine which contacts can receive emails during warmup phases.
 */

import { prisma } from '@/lib/db'
import type { EngagementTier, Contact } from '@prisma/client'

/**
 * Engagement tier thresholds in days
 */
const TIER_THRESHOLDS = {
  HOT: 30,   // Engaged within 30 days
  WARM: 60,  // Engaged within 60 days
  COOL: 90,  // Engaged within 90 days
  // COLD: 90+ days or never engaged
  // NEW: Never received an email
}

/**
 * Calculate the engagement tier for a contact based on their activity
 */
export function calculateEngagementTier(contact: {
  lastOpenedAt: Date | null
  lastClickedAt: Date | null
  lastEmailReceivedAt: Date | null
  totalEmailsReceived: number
}): EngagementTier {
  // NEW: Never received an email
  if (contact.totalEmailsReceived === 0) {
    return 'NEW'
  }

  // Get the most recent engagement (open or click)
  const lastEngagement = getLatestDate(contact.lastOpenedAt, contact.lastClickedAt)

  // No engagement ever - COLD
  if (!lastEngagement) {
    return 'COLD'
  }

  const now = new Date()
  const daysSinceEngagement = Math.floor(
    (now.getTime() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceEngagement <= TIER_THRESHOLDS.HOT) {
    return 'HOT'
  } else if (daysSinceEngagement <= TIER_THRESHOLDS.WARM) {
    return 'WARM'
  } else if (daysSinceEngagement <= TIER_THRESHOLDS.COOL) {
    return 'COOL'
  } else {
    return 'COLD'
  }
}

/**
 * Get the latest of two dates
 */
function getLatestDate(date1: Date | null, date2: Date | null): Date | null {
  if (!date1 && !date2) return null
  if (!date1) return date2
  if (!date2) return date1
  return date1 > date2 ? date1 : date2
}

/**
 * Update a single contact's engagement tier
 */
export async function updateContactEngagementTier(contactId: string): Promise<EngagementTier> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      lastOpenedAt: true,
      lastClickedAt: true,
      lastEmailReceivedAt: true,
      totalEmailsReceived: true,
    },
  })

  if (!contact) {
    throw new Error(`Contact not found: ${contactId}`)
  }

  const newTier = calculateEngagementTier(contact)

  await prisma.contact.update({
    where: { id: contactId },
    data: { engagementTier: newTier },
  })

  return newTier
}

/**
 * Record an email open event for a contact
 */
export async function recordContactOpen(contactId: string): Promise<void> {
  const now = new Date()

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastOpenedAt: now,
      totalOpens: { increment: 1 },
    },
    select: {
      lastOpenedAt: true,
      lastClickedAt: true,
      lastEmailReceivedAt: true,
      totalEmailsReceived: true,
    },
  })

  // Recalculate and update tier
  const newTier = calculateEngagementTier(contact)
  await prisma.contact.update({
    where: { id: contactId },
    data: { engagementTier: newTier },
  })
}

/**
 * Record an email click event for a contact
 */
export async function recordContactClick(contactId: string): Promise<void> {
  const now = new Date()

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastClickedAt: now,
      totalClicks: { increment: 1 },
    },
    select: {
      lastOpenedAt: true,
      lastClickedAt: true,
      lastEmailReceivedAt: true,
      totalEmailsReceived: true,
    },
  })

  // Recalculate and update tier
  const newTier = calculateEngagementTier(contact)
  await prisma.contact.update({
    where: { id: contactId },
    data: { engagementTier: newTier },
  })
}

/**
 * Record that an email was sent to a contact
 */
export async function recordContactEmailSent(contactId: string): Promise<void> {
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastEmailReceivedAt: new Date(),
      totalEmailsReceived: { increment: 1 },
    },
  })
}

/**
 * Batch recalculate engagement tiers for all contacts
 * Used by the daily cron job
 */
export async function recalculateAllEngagementTiers(): Promise<{
  total: number
  updated: number
  byTier: Record<EngagementTier, number>
}> {
  const contacts = await prisma.contact.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      engagementTier: true,
      lastOpenedAt: true,
      lastClickedAt: true,
      lastEmailReceivedAt: true,
      totalEmailsReceived: true,
    },
  })

  const tierCounts: Record<EngagementTier, number> = {
    HOT: 0,
    WARM: 0,
    COOL: 0,
    COLD: 0,
    NEW: 0,
  }

  let updated = 0

  // Process in batches to avoid overwhelming the database
  const BATCH_SIZE = 100
  const updates: { id: string; tier: EngagementTier }[] = []

  for (const contact of contacts) {
    const newTier = calculateEngagementTier(contact)
    tierCounts[newTier]++

    if (contact.engagementTier !== newTier) {
      updates.push({ id: contact.id, tier: newTier })
    }
  }

  // Apply updates in batches
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    await prisma.$transaction(
      batch.map(({ id, tier }) =>
        prisma.contact.update({
          where: { id },
          data: { engagementTier: tier },
        })
      )
    )
    updated += batch.length
  }

  return {
    total: contacts.length,
    updated,
    byTier: tierCounts,
  }
}

/**
 * Get contact counts by engagement tier
 */
export async function getContactCountsByTier(): Promise<Record<EngagementTier, number>> {
  const counts = await prisma.contact.groupBy({
    by: ['engagementTier'],
    where: { status: 'ACTIVE' },
    _count: true,
  })

  const result: Record<EngagementTier, number> = {
    HOT: 0,
    WARM: 0,
    COOL: 0,
    COLD: 0,
    NEW: 0,
  }

  for (const row of counts) {
    result[row.engagementTier] = row._count
  }

  return result
}

/**
 * Get contacts that can receive emails based on allowed tiers
 * Ordered by engagement (best first: HOT > NEW > WARM > COOL > COLD)
 */
export async function getEligibleContacts(
  allowedTiers: EngagementTier[],
  limit?: number
): Promise<{ id: string; email: string; engagementTier: EngagementTier }[]> {
  // Define tier priority order
  const tierOrder: EngagementTier[] = ['HOT', 'NEW', 'WARM', 'COOL', 'COLD']
  const orderedTiers = tierOrder.filter((t) => allowedTiers.includes(t))

  const contacts = await prisma.contact.findMany({
    where: {
      status: 'ACTIVE',
      engagementTier: { in: allowedTiers },
    },
    select: {
      id: true,
      email: true,
      engagementTier: true,
    },
    take: limit,
  })

  // Sort by tier priority
  return contacts.sort((a, b) => {
    return orderedTiers.indexOf(a.engagementTier) - orderedTiers.indexOf(b.engagementTier)
  })
}
