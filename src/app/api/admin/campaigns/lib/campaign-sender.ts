import { prisma } from '@/lib/db'
import { getSettings, generateCampaignFooter, type AppSettings } from '@/lib/settings'
import { logger } from '@/lib'
import {
  getWarmupConfig,
  getRemainingToday,
  recordSent,
  recordContactEmailSent,
} from '@/lib/warmup'

const BATCH_SIZE = 500 // Postmark limit
const BATCH_DELAY_MS = 1000 // 1 second between batches to avoid rate limits

interface PostmarkMessage {
  From: string
  To: string
  Subject: string
  HtmlBody: string
  TextBody: string
  ReplyTo?: string
  MessageStream: string
  TrackOpens: boolean
  TrackLinks: string
  Metadata?: Record<string, string>
}

interface PostmarkBatchResult {
  To: string
  SubmittedAt: string
  MessageID: string
  ErrorCode: number
  Message: string
}

interface SendBatchResult {
  success: boolean
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

interface Variables {
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  [key: string]: string | undefined
}

/**
 * Process a campaign and send to all pending recipients
 * Returns when all recipients have been processed
 */
export async function processCampaign(campaignId: string): Promise<{
  success: boolean
  totalSent: number
  totalFailed: number
  message: string
}> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) {
    return { success: false, totalSent: 0, totalFailed: 0, message: 'Campaign not found' }
  }

  if (campaign.status !== 'SENDING') {
    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      message: `Campaign is not in SENDING status (current: ${campaign.status})`,
    }
  }

  const settings = await getSettings()

  if (!settings.marketingServerToken) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    })
    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      message: 'Marketing server token not configured',
    }
  }

  let totalSent = 0
  let totalFailed = 0
  let hasMore = true

  while (hasMore) {
    // Check if campaign was paused or cancelled
    const currentCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    })

    if (!currentCampaign || !['SENDING'].includes(currentCampaign.status)) {
      return {
        success: false,
        totalSent,
        totalFailed,
        message: `Campaign ${currentCampaign?.status || 'deleted'} - stopping`,
      }
    }

    // Fetch batch of pending recipients
    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId,
        status: 'PENDING',
      },
      take: BATCH_SIZE,
    })

    if (recipients.length === 0) {
      hasMore = false
      break
    }

    // Send batch
    const result = await sendBatch(
      campaign,
      recipients,
      settings.marketingServerToken,
      settings.marketingStreamName,
      settings
    )

    totalSent += result.sent
    totalFailed += result.failed

    // Update campaign stats
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: { increment: result.sent },
      },
    })

    // Small delay between batches
    if (hasMore && recipients.length === BATCH_SIZE) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Mark campaign as completed
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  return {
    success: true,
    totalSent,
    totalFailed,
    message: `Campaign completed. Sent: ${totalSent}, Failed: ${totalFailed}`,
  }
}

/**
 * Send a batch of emails via Postmark
 */
async function sendBatch(
  campaign: {
    id: string
    subject: string
    htmlContent: string
    textContent: string
    previewText?: string | null
    fromName: string
    fromEmail: string
    replyTo: string | null
  },
  recipients: Array<{
    id: string
    email: string
    variables: unknown
  }>,
  serverToken: string,
  messageStream: string,
  settings: AppSettings
): Promise<SendBatchResult> {
  // Generate footer for CAN-SPAM compliance (default to Georgian locale)
  const footer = generateCampaignFooter(settings, 'ka')

  // Prepare messages
  const messages: PostmarkMessage[] = recipients.map((recipient) => {
    const variables = (recipient.variables as Variables) || {}
    let personalizedHtml = replaceVariables(campaign.htmlContent, variables)
    let personalizedText = replaceVariables(campaign.textContent, variables)
    const personalizedSubject = replaceVariables(campaign.subject, variables)

    // Inject previewText as hidden div at the start of the email (for inbox preview)
    if (campaign.previewText) {
      const previewHtml = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(campaign.previewText)}</div>`
      // Insert after <body> tag or at the start
      if (personalizedHtml.includes('<body')) {
        personalizedHtml = personalizedHtml.replace(/(<body[^>]*>)/i, `$1${previewHtml}`)
      } else {
        personalizedHtml = previewHtml + personalizedHtml
      }
    }

    // Inject footer before </body> tag or at the end
    // Only inject if unsubscribe link is not already present
    const hasUnsubscribeLink = personalizedHtml.includes('{{{ pm:unsubscribe }}}') ||
                               personalizedHtml.includes('pm:unsubscribe')

    if (!hasUnsubscribeLink) {
      // Add our compliant footer with unsubscribe link
      if (personalizedHtml.toLowerCase().includes('</body>')) {
        personalizedHtml = personalizedHtml.replace(/<\/body>/i, `${footer.html}</body>`)
      } else {
        personalizedHtml = personalizedHtml + footer.html
      }
      personalizedText = personalizedText + footer.text
    }

    return {
      From: `${campaign.fromName} <${campaign.fromEmail}>`,
      To: recipient.email,
      Subject: personalizedSubject,
      HtmlBody: personalizedHtml,
      TextBody: personalizedText,
      ReplyTo: campaign.replyTo || undefined,
      MessageStream: messageStream || 'broadcast',
      TrackOpens: true,
      TrackLinks: 'HtmlAndText',
      Metadata: {
        campaignId: campaign.id,
        recipientId: recipient.id,
      },
    }
  })

  try {
    const response = await fetch('https://api.postmarkapp.com/email/batch', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': serverToken,
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      // Entire batch failed
      const errorData = await response.json().catch(() => ({}))
      logger.error('Postmark batch error:', errorData)

      // Mark all recipients as failed
      await prisma.campaignRecipient.updateMany({
        where: {
          id: { in: recipients.map((r) => r.id) },
        },
        data: {
          status: 'FAILED',
          error: errorData.Message || 'Batch send failed',
        },
      })

      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        errors: recipients.map((r) => ({
          email: r.email,
          error: errorData.Message || 'Batch send failed',
        })),
      }
    }

    const results: PostmarkBatchResult[] = await response.json()

    // OPTIMIZED: Collect all updates first, then batch execute
    const successfulRecipients: Array<{
      id: string
      messageId: string
      sentAt: Date
      email: string
      subject: string
      variables: Variables
    }> = []
    const failedRecipients: Array<{
      id: string
      error: string
      email: string
      errorCode: number
    }> = []
    const errors: Array<{ email: string; error: string }> = []

    // First pass: categorize results
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const recipient = recipients[i]

      if (result.ErrorCode === 0) {
        successfulRecipients.push({
          id: recipient.id,
          messageId: result.MessageID,
          sentAt: new Date(result.SubmittedAt),
          email: recipient.email,
          subject: replaceVariables(campaign.subject, (recipient.variables as Variables) || {}),
          variables: (recipient.variables as Variables) || {},
        })
      } else {
        const errorMsg = result.Message || `Error code: ${result.ErrorCode}`
        errors.push({ email: recipient.email, error: errorMsg })
        failedRecipients.push({
          id: recipient.id,
          error: errorMsg,
          email: recipient.email,
          errorCode: result.ErrorCode,
        })
      }
    }

    // Second pass: batch database operations using transaction
    await prisma.$transaction(async (tx) => {
      // Update successful recipients
      for (const recipient of successfulRecipients) {
        await tx.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'SENT',
            messageId: recipient.messageId,
            sentAt: recipient.sentAt,
          },
        })
      }

      // Create email logs for successful sends (batch create)
      if (successfulRecipients.length > 0) {
        await tx.emailLog.createMany({
          data: successfulRecipients.map((r) => ({
            messageId: r.messageId,
            to: r.email,
            subject: r.subject,
            type: 'CAMPAIGN' as const,
            status: 'SENT' as const,
            category: 'MARKETING' as const,
            metadata: {
              campaignId: campaign.id,
              fromName: campaign.fromName,
              fromEmail: campaign.fromEmail,
            },
          })),
        })
      }

      // Update failed recipients
      for (const recipient of failedRecipients) {
        await tx.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'FAILED',
            error: recipient.error,
          },
        })
      }

      // Batch handle suppression cases by error code
      const hardBounceEmails = failedRecipients
        .filter((r) => r.errorCode === 406)
        .map((r) => r.email)

      const invalidEmails = failedRecipients
        .filter((r) => r.errorCode === 300)
        .map((r) => r.email)

      if (hardBounceEmails.length > 0) {
        await tx.contact.updateMany({
          where: { email: { in: hardBounceEmails } },
          data: {
            marketingStatus: 'SUPPRESSED',
            suppressionReason: 'HARD_BOUNCE',
            suppressedAt: new Date(),
          },
        })
      }

      if (invalidEmails.length > 0) {
        await tx.contact.updateMany({
          where: { email: { in: invalidEmails } },
          data: { status: 'BOUNCED' },
        })
      }
    })

    return {
      success: true,
      sent: successfulRecipients.length,
      failed: failedRecipients.length,
      errors,
    }
  } catch (error) {
    logger.error('Postmark batch request failed:', error)

    // Mark all as failed
    await prisma.campaignRecipient.updateMany({
      where: {
        id: { in: recipients.map((r) => r.id) },
      },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Network error',
      },
    })

    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      errors: recipients.map((r) => ({
        email: r.email,
        error: error instanceof Error ? error.message : 'Network error',
      })),
    }
  }
}

/**
 * Escape HTML entities to prevent XSS when inserting user data into HTML emails
 */
function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char)
}

/**
 * Replace personalization variables in content
 * Values are HTML-escaped to prevent XSS attacks
 */
function replaceVariables(content: string, variables: Variables): string {
  let result = content

  // Replace {{variableName}} patterns with HTML-escaped values
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    result = result.replace(regex, escapeHtml(value))
  })

  // Handle variables with fallbacks: {{variableName|fallback}}
  result = result.replace(/\{\{\s*(\w+)\s*\|\s*([^}]+)\s*\}\}/g, (match, varName, fallback) => {
    const value = variables[varName]
    return escapeHtml(value || fallback.trim())
  })

  return result
}

/**
 * Process a single batch of a campaign (for use in cron jobs)
 * Returns true if there are more recipients to process
 * Respects warmup limits and engagement tier ordering
 */
export async function processCampaignBatch(campaignId: string): Promise<{
  processed: boolean
  hasMore: boolean
  sent: number
  failed: number
  warmupLimited: boolean
}> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign || campaign.status !== 'SENDING') {
    return { processed: false, hasMore: false, sent: 0, failed: 0, warmupLimited: false }
  }

  const settings = await getSettings()

  if (!settings.marketingServerToken) {
    return { processed: false, hasMore: false, sent: 0, failed: 0, warmupLimited: false }
  }

  // Check warmup status and limits
  const warmupConfig = await getWarmupConfig()
  const warmupStatus = await getRemainingToday()

  // If warmup is active and no remaining capacity, pause until tomorrow
  if (warmupConfig.status === 'WARMING_UP' && warmupStatus.remaining <= 0) {
    logger.info(`Campaign ${campaignId}: Daily warmup limit reached, will continue tomorrow`)
    return {
      processed: false,
      hasMore: true,
      sent: 0,
      failed: 0,
      warmupLimited: true,
    }
  }

  // Determine batch size (respect warmup limits)
  let batchSize = BATCH_SIZE
  if (warmupConfig.status === 'WARMING_UP' && warmupStatus.remaining < BATCH_SIZE) {
    batchSize = warmupStatus.remaining
    logger.info(`Campaign ${campaignId}: Limiting batch to ${batchSize} (warmup limit)`)
  }

  // Fetch recipients ordered by engagement tier (HOT first, then NEW, WARM, COOL, COLD)
  // Join with Contact to get engagement tier for sorting
  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      campaignId,
      status: 'PENDING',
    },
    include: {
      campaign: false,
    },
    take: batchSize,
  })

  // If warmup is active, filter and order by engagement tier
  let orderedRecipients = recipients
  if (warmupConfig.status === 'WARMING_UP' && warmupStatus.allowedTiers.length > 0) {
    // Get contacts with their tiers
    const emails = recipients.map((r) => r.email)
    const contacts = await prisma.contact.findMany({
      where: { email: { in: emails } },
      select: { email: true, engagementTier: true },
    })

    const contactTierMap = new Map(contacts.map((c) => [c.email, c.engagementTier]))

    // Define tier priority (lower = better)
    const tierPriority: Record<string, number> = {
      HOT: 1,
      NEW: 2,
      WARM: 3,
      COOL: 4,
      COLD: 5,
    }

    // Filter to allowed tiers and sort by priority
    orderedRecipients = recipients
      .filter((r) => {
        const tier = contactTierMap.get(r.email) || 'NEW'
        return warmupStatus.allowedTiers.includes(tier)
      })
      .sort((a, b) => {
        const tierA = contactTierMap.get(a.email) || 'NEW'
        const tierB = contactTierMap.get(b.email) || 'NEW'
        return (tierPriority[tierA] || 99) - (tierPriority[tierB] || 99)
      })

    // If some recipients were filtered out due to tier restrictions
    if (orderedRecipients.length < recipients.length) {
      logger.info(
        `Campaign ${campaignId}: Filtered ${recipients.length - orderedRecipients.length} recipients (tier restrictions)`
      )
    }
  }

  if (orderedRecipients.length === 0) {
    // Check if there are still pending recipients (just not eligible yet)
    const remainingCount = await prisma.campaignRecipient.count({
      where: {
        campaignId,
        status: 'PENDING',
      },
    })

    if (remainingCount === 0) {
      // No more recipients - mark as completed
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
      return { processed: true, hasMore: false, sent: 0, failed: 0, warmupLimited: false }
    } else {
      // Recipients exist but not eligible for current warmup phase
      logger.info(
        `Campaign ${campaignId}: ${remainingCount} recipients waiting for higher warmup phase`
      )
      return {
        processed: false,
        hasMore: true,
        sent: 0,
        failed: 0,
        warmupLimited: true,
      }
    }
  }

  const result = await sendBatch(
    campaign,
    orderedRecipients,
    settings.marketingServerToken,
    settings.marketingStreamName,
    settings
  )

  // Update campaign stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount: { increment: result.sent },
    },
  })

  // Update warmup sent counter
  if (warmupConfig.status === 'WARMING_UP' && result.sent > 0) {
    await recordSent(result.sent)
  }

  // Update contact email received tracking
  if (result.sent > 0) {
    const sentEmails = orderedRecipients.slice(0, result.sent).map((r) => r.email)
    const sentContacts = await prisma.contact.findMany({
      where: { email: { in: sentEmails } },
      select: { id: true },
    })

    // Update in parallel (fire and forget for performance)
    Promise.all(
      sentContacts.map((c) => recordContactEmailSent(c.id).catch(() => {}))
    ).catch(() => {})
  }

  // Check if there are more recipients
  const remainingCount = await prisma.campaignRecipient.count({
    where: {
      campaignId,
      status: 'PENDING',
    },
  })

  return {
    processed: true,
    hasMore: remainingCount > 0,
    sent: result.sent,
    failed: result.failed,
    warmupLimited: false,
  }
}

/**
 * Get campaigns that need processing
 */
export async function getCampaignsToProcess(): Promise<
  Array<{ id: string; name: string; status: string }>
> {
  // Get scheduled campaigns ready to send
  const scheduled = await prisma.campaign.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        lte: new Date(),
      },
    },
    select: { id: true, name: true, status: true },
    orderBy: { scheduledAt: 'asc' },
  })

  // Update scheduled campaigns to SENDING
  for (const campaign of scheduled) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'SENDING',
        sendingStartedAt: new Date(),
      },
    })
  }

  // During warmup, process campaigns in FIFO order (oldest first)
  // This ensures Campaign A completes before Campaign B starts
  const warmupConfig = await getWarmupConfig()

  if (warmupConfig.status === 'WARMING_UP') {
    // Only return the OLDEST sending campaign (FIFO queue)
    const oldest = await prisma.campaign.findFirst({
      where: { status: 'SENDING' },
      select: { id: true, name: true, status: true },
      orderBy: { sendingStartedAt: 'asc' },
    })
    return oldest ? [oldest] : []
  }

  // When fully warmed, process all campaigns in parallel
  const sending = await prisma.campaign.findMany({
    where: { status: 'SENDING' },
    select: { id: true, name: true, status: true },
    orderBy: { sendingStartedAt: 'asc' },
  })

  return sending
}
