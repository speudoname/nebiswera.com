import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { logger } from '@/lib'

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
      settings.marketingStreamName
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
  messageStream: string
): Promise<SendBatchResult> {
  // Prepare messages
  const messages: PostmarkMessage[] = recipients.map((recipient) => {
    const variables = (recipient.variables as Variables) || {}
    const personalizedHtml = replaceVariables(campaign.htmlContent, variables)
    const personalizedText = replaceVariables(campaign.textContent, variables)
    const personalizedSubject = replaceVariables(campaign.subject, variables)

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
 * Update contact suppression status
 */
async function updateContactSuppression(
  email: string,
  reason: 'HARD_BOUNCE' | 'SPAM_COMPLAINT' | 'MANUAL_SUPPRESSION'
): Promise<void> {
  await prisma.contact.updateMany({
    where: { email },
    data: {
      marketingStatus: 'SUPPRESSED',
      suppressionReason: reason,
      suppressedAt: new Date(),
    },
  })
}

/**
 * Process a single batch of a campaign (for use in cron jobs)
 * Returns true if there are more recipients to process
 */
export async function processCampaignBatch(campaignId: string): Promise<{
  processed: boolean
  hasMore: boolean
  sent: number
  failed: number
}> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign || campaign.status !== 'SENDING') {
    return { processed: false, hasMore: false, sent: 0, failed: 0 }
  }

  const settings = await getSettings()

  if (!settings.marketingServerToken) {
    return { processed: false, hasMore: false, sent: 0, failed: 0 }
  }

  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      campaignId,
      status: 'PENDING',
    },
    take: BATCH_SIZE,
  })

  if (recipients.length === 0) {
    // No more recipients - mark as completed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
    return { processed: true, hasMore: false, sent: 0, failed: 0 }
  }

  const result = await sendBatch(
    campaign,
    recipients,
    settings.marketingServerToken,
    settings.marketingStreamName
  )

  // Update campaign stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      sentCount: { increment: result.sent },
    },
  })

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

  // Get all SENDING campaigns
  const sending = await prisma.campaign.findMany({
    where: { status: 'SENDING' },
    select: { id: true, name: true, status: true },
  })

  return sending
}
