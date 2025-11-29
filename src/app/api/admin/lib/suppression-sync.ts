import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'

interface PostmarkSuppression {
  EmailAddress: string
  SuppressionReason: string
  Origin: string
  CreatedAt: string
}

interface SyncResult {
  success: boolean
  fromPostmark: {
    total: number
    newSuppressions: number
    alreadySuppressed: number
  }
  toPostmark: {
    total: number
    pushed: number
    errors: number
  }
  errors: string[]
}

/**
 * Fetch suppressions from Postmark for the broadcast stream
 */
async function fetchPostmarkSuppressions(serverToken: string): Promise<PostmarkSuppression[]> {
  const suppressions: PostmarkSuppression[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const response = await fetch(
      `https://api.postmarkapp.com/message-streams/broadcast/suppressions?count=${limit}&offset=${offset}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Postmark-Server-Token': serverToken,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch suppressions: ${response.statusText}`)
    }

    const data = await response.json()
    const batch = data.Suppressions || []
    suppressions.push(...batch)

    if (batch.length < limit) {
      break
    }
    offset += limit
  }

  return suppressions
}

/**
 * Add emails to Postmark suppression list
 */
async function pushToPostmark(
  serverToken: string,
  emails: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = []
  const failed: string[] = []

  // Postmark accepts up to 1000 suppressions per request
  const batchSize = 1000
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)

    const response = await fetch(
      'https://api.postmarkapp.com/message-streams/broadcast/suppressions',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': serverToken,
        },
        body: JSON.stringify({
          Suppressions: batch.map((email) => ({ EmailAddress: email })),
        }),
      }
    )

    if (response.ok) {
      success.push(...batch)
    } else {
      failed.push(...batch)
    }
  }

  return { success, failed }
}

/**
 * Map Postmark suppression reason to our enum
 */
function mapSuppressionReason(
  postmarkReason: string
): 'HARD_BOUNCE' | 'SPAM_COMPLAINT' | 'MANUAL_SUPPRESSION' {
  switch (postmarkReason) {
    case 'HardBounce':
      return 'HARD_BOUNCE'
    case 'SpamComplaint':
      return 'SPAM_COMPLAINT'
    case 'ManualSuppression':
    default:
      return 'MANUAL_SUPPRESSION'
  }
}

/**
 * Perform bidirectional sync of suppression lists
 *
 * 1. Fetch suppressions from Postmark and mark those contacts as suppressed in our DB
 * 2. Push our local unsubscribes/suppressions to Postmark
 */
export async function syncSuppressions(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    fromPostmark: { total: 0, newSuppressions: 0, alreadySuppressed: 0 },
    toPostmark: { total: 0, pushed: 0, errors: 0 },
    errors: [],
  }

  try {
    const settings = await getSettings()

    if (!settings.marketingServerToken) {
      result.errors.push('Marketing server token not configured')
      return result
    }

    // Step 1: Fetch from Postmark and update our DB
    const postmarkSuppressions = await fetchPostmarkSuppressions(settings.marketingServerToken)
    result.fromPostmark.total = postmarkSuppressions.length

    for (const suppression of postmarkSuppressions) {
      const contact = await prisma.contact.findFirst({
        where: { email: suppression.EmailAddress.toLowerCase() },
      })

      if (contact) {
        if (contact.marketingStatus === 'SUPPRESSED') {
          result.fromPostmark.alreadySuppressed++
        } else {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              marketingStatus: 'SUPPRESSED',
              suppressionReason: mapSuppressionReason(suppression.SuppressionReason),
              suppressedAt: new Date(suppression.CreatedAt),
            },
          })
          result.fromPostmark.newSuppressions++
        }
      }
    }

    // Step 2: Push our unsubscribes to Postmark
    const localSuppressed = await prisma.contact.findMany({
      where: {
        OR: [
          { marketingStatus: 'UNSUBSCRIBED' },
          { marketingStatus: 'SUPPRESSED' },
        ],
      },
      select: { email: true },
    })

    result.toPostmark.total = localSuppressed.length

    if (localSuppressed.length > 0) {
      // Filter out emails that are already in Postmark's list
      const postmarkEmails = new Set(
        postmarkSuppressions.map((s) => s.EmailAddress.toLowerCase())
      )
      const emailsToPush = localSuppressed
        .map((c) => c.email.toLowerCase())
        .filter((email) => !postmarkEmails.has(email))

      if (emailsToPush.length > 0) {
        const pushResult = await pushToPostmark(settings.marketingServerToken, emailsToPush)
        result.toPostmark.pushed = pushResult.success.length
        result.toPostmark.errors = pushResult.failed.length
      }
    }

    result.success = true
    return result
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return result
  }
}

/**
 * Delete a suppression from Postmark (for re-subscribing)
 * Note: SpamComplaint suppressions cannot be deleted
 */
export async function deleteSuppressionFromPostmark(email: string): Promise<boolean> {
  try {
    const settings = await getSettings()

    if (!settings.marketingServerToken) {
      return false
    }

    const response = await fetch(
      'https://api.postmarkapp.com/message-streams/broadcast/suppressions/delete',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': settings.marketingServerToken,
        },
        body: JSON.stringify({
          Suppressions: [{ EmailAddress: email }],
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('Failed to delete suppression from Postmark:', error)
    return false
  }
}

/**
 * Get suppression dump (for debugging/admin)
 */
export async function getSuppressionDump(): Promise<{
  local: { total: number; unsubscribed: number; suppressed: number }
  postmark: { total: number }
  synced: boolean
}> {
  const settings = await getSettings()

  // Local stats
  const localStats = await prisma.contact.groupBy({
    by: ['marketingStatus'],
    _count: { marketingStatus: true },
  })

  const local = {
    total: 0,
    unsubscribed: 0,
    suppressed: 0,
  }

  for (const stat of localStats) {
    local.total += stat._count.marketingStatus
    if (stat.marketingStatus === 'UNSUBSCRIBED') {
      local.unsubscribed = stat._count.marketingStatus
    } else if (stat.marketingStatus === 'SUPPRESSED') {
      local.suppressed = stat._count.marketingStatus
    }
  }

  // Postmark stats
  let postmarkTotal = 0
  if (settings.marketingServerToken) {
    try {
      const suppressions = await fetchPostmarkSuppressions(settings.marketingServerToken)
      postmarkTotal = suppressions.length
    } catch {
      // Ignore errors for dump
    }
  }

  return {
    local,
    postmark: { total: postmarkTotal },
    synced: local.unsubscribed + local.suppressed === postmarkTotal,
  }
}
