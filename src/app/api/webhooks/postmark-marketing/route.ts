import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { EmailStatus } from '@prisma/client'
import { logger } from '@/lib'

// Postmark webhook events
interface PostmarkDeliveryEvent {
  RecordType: 'Delivery'
  MessageID: string
  Recipient: string
  DeliveredAt: string
  Tag?: string
  Metadata?: Record<string, string>
}

interface PostmarkBounceEvent {
  RecordType: 'Bounce'
  MessageID: string
  Type: string
  TypeCode: number
  Name: string
  Email: string
  BouncedAt: string
  Description: string
  Metadata?: Record<string, string>
}

interface PostmarkSpamComplaintEvent {
  RecordType: 'SpamComplaint'
  MessageID: string
  Email: string
  BouncedAt: string
  Metadata?: Record<string, string>
}

interface PostmarkOpenEvent {
  RecordType: 'Open'
  MessageID: string
  Recipient: string
  ReceivedAt: string
  FirstOpen: boolean
  Metadata?: Record<string, string>
}

interface PostmarkClickEvent {
  RecordType: 'Click'
  MessageID: string
  Recipient: string
  ReceivedAt: string
  ClickLocation: string
  OriginalLink: string
  Metadata?: Record<string, string>
}

interface PostmarkSubscriptionChangeEvent {
  RecordType: 'SubscriptionChange'
  MessageID: string
  Recipient: string
  SuppressSending: boolean
  SuppressionReason?: string
  ChangedAt: string
  Metadata?: Record<string, string>
}

type PostmarkEvent =
  | PostmarkDeliveryEvent
  | PostmarkBounceEvent
  | PostmarkSpamComplaintEvent
  | PostmarkOpenEvent
  | PostmarkClickEvent
  | PostmarkSubscriptionChangeEvent

/**
 * Verify Basic HTTP Authentication for Marketing Webhooks
 */
function verifyBasicAuth(request: Request): boolean {
  const webhookUsername = process.env.POSTMARK_MARKETING_WEBHOOK_USERNAME
  const webhookPassword = process.env.POSTMARK_MARKETING_WEBHOOK_PASSWORD

  // SECURITY: Require authentication - deny if not configured (fail-closed)
  if (!webhookUsername || !webhookPassword) {
    logger.error('Marketing webhook credentials not configured - denying request')
    return false
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  const base64Credentials = authHeader.slice(6)
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  return username === webhookUsername && password === webhookPassword
}

/**
 * Get campaign recipient by message ID
 */
async function getCampaignRecipient(messageId: string) {
  return prisma.campaignRecipient.findFirst({
    where: { messageId },
    include: { campaign: true },
  })
}

/**
 * Update contact marketing status
 */
async function updateContactStatus(
  email: string,
  status: 'UNSUBSCRIBED' | 'SUPPRESSED',
  reason?: 'HARD_BOUNCE' | 'SPAM_COMPLAINT' | 'MANUAL_SUPPRESSION'
) {
  const updateData: Record<string, unknown> = {
    marketingStatus: status,
  }

  if (status === 'UNSUBSCRIBED') {
    updateData.unsubscribedAt = new Date()
  } else if (status === 'SUPPRESSED' && reason) {
    updateData.suppressionReason = reason
    updateData.suppressedAt = new Date()
  }

  await prisma.contact.updateMany({
    where: { email },
    data: updateData,
  })
}

export async function POST(request: Request) {
  try {
    if (!verifyBasicAuth(request)) {
      logger.warn('Invalid marketing webhook authentication')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = (await request.json()) as PostmarkEvent

    // Find the email log by message ID
    const emailLog = await prisma.emailLog.findUnique({
      where: { messageId: event.MessageID },
    })

    // Get campaign recipient if this is a campaign email
    const campaignRecipient = await getCampaignRecipient(event.MessageID)
    const campaignId = campaignRecipient?.campaignId

    switch (event.RecordType) {
      case 'Delivery':
        // Update email log
        if (emailLog) {
          await prisma.emailLog.update({
            where: { messageId: event.MessageID },
            data: {
              status: EmailStatus.DELIVERED,
              deliveredAt: new Date(event.DeliveredAt),
            },
          })
        }

        // Update campaign recipient and stats
        if (campaignRecipient && campaignId) {
          await prisma.campaignRecipient.update({
            where: { id: campaignRecipient.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date(event.DeliveredAt),
            },
          })

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { deliveredCount: { increment: 1 } },
          })
        }
        break

      case 'Bounce':
        // Update email log
        if (emailLog) {
          await prisma.emailLog.update({
            where: { messageId: event.MessageID },
            data: {
              status: EmailStatus.BOUNCED,
              bouncedAt: new Date(event.BouncedAt),
              bounceType: `${event.Type} (${event.TypeCode}): ${event.Name}`,
            },
          })
        }

        // Update campaign recipient and stats
        if (campaignRecipient && campaignId) {
          await prisma.campaignRecipient.update({
            where: { id: campaignRecipient.id },
            data: {
              bouncedAt: new Date(event.BouncedAt),
              error: `${event.Type}: ${event.Description}`,
            },
          })

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { bouncedCount: { increment: 1 } },
          })
        }

        // Suppress contact for hard bounces (TypeCode 1 = HardBounce)
        if (event.TypeCode === 1) {
          await updateContactStatus(event.Email, 'SUPPRESSED', 'HARD_BOUNCE')
        }
        break

      case 'SpamComplaint':
        // Update email log
        if (emailLog) {
          await prisma.emailLog.update({
            where: { messageId: event.MessageID },
            data: {
              status: EmailStatus.SPAM_COMPLAINT,
              bouncedAt: new Date(event.BouncedAt),
            },
          })
        }

        // Update campaign stats
        if (campaignId) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { bouncedCount: { increment: 1 } },
          })
        }

        // Always suppress contact on spam complaint
        await updateContactStatus(event.Email, 'SUPPRESSED', 'SPAM_COMPLAINT')
        break

      case 'Open':
        // Only update email log to OPENED if not bounced
        if (emailLog && emailLog.status !== EmailStatus.BOUNCED && emailLog.status !== EmailStatus.SPAM_COMPLAINT) {
          await prisma.emailLog.update({
            where: { messageId: event.MessageID },
            data: {
              status: EmailStatus.OPENED,
              openedAt: event.FirstOpen ? new Date(event.ReceivedAt) : emailLog.openedAt,
            },
          })
        }

        // Update campaign recipient and stats (only count first open)
        if (campaignRecipient && campaignId && event.FirstOpen) {
          await prisma.campaignRecipient.update({
            where: { id: campaignRecipient.id },
            data: { openedAt: new Date(event.ReceivedAt) },
          })

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { openedCount: { increment: 1 } },
          })
        }
        break

      case 'Click':
        // Track click in email log metadata
        if (emailLog) {
          const currentMetadata = (emailLog.metadata as Record<string, unknown>) || {}
          const clicks = (currentMetadata.clicks as Array<{ link: string; at: string }>) || []
          clicks.push({
            link: event.OriginalLink,
            at: event.ReceivedAt,
          })
          await prisma.emailLog.update({
            where: { messageId: event.MessageID },
            data: {
              metadata: { ...currentMetadata, clicks },
            },
          })
        }

        // Update campaign recipient and stats
        if (campaignRecipient && campaignId) {
          // Only count first click for campaign stats
          const isFirstClick = !campaignRecipient.clickedAt

          await prisma.campaignRecipient.update({
            where: { id: campaignRecipient.id },
            data: {
              clickedAt: campaignRecipient.clickedAt || new Date(event.ReceivedAt),
            },
          })

          if (isFirstClick) {
            await prisma.campaign.update({
              where: { id: campaignId },
              data: { clickedCount: { increment: 1 } },
            })
          }

          // Track per-link clicks
          await trackLinkClick(campaignId, event.OriginalLink, campaignRecipient.id)
        }
        break

      case 'SubscriptionChange':
        // Update campaign stats if this is from unsubscribe
        if (event.SuppressSending && campaignId) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { unsubscribedCount: { increment: 1 } },
          })

          // Update recipient
          if (campaignRecipient) {
            await prisma.campaignRecipient.update({
              where: { id: campaignRecipient.id },
              data: { unsubscribedAt: new Date(event.ChangedAt) },
            })
          }
        }

        // Update contact status
        if (event.SuppressSending) {
          await updateContactStatus(event.Recipient, 'UNSUBSCRIBED')
        }
        break
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    logger.error('Marketing webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Track link click in CampaignLink table
 */
async function trackLinkClick(
  campaignId: string,
  url: string,
  recipientId: string
) {
  try {
    // Find or create the link record
    let link = await prisma.campaignLink.findFirst({
      where: {
        campaignId,
        url,
      },
    })

    if (!link) {
      link = await prisma.campaignLink.create({
        data: {
          campaignId,
          url,
          clickCount: 0,
          uniqueClickCount: 0,
        },
      })
    }

    // Check if this recipient already clicked this link
    const existingClick = await prisma.campaignLinkClick.findFirst({
      where: {
        linkId: link.id,
        recipientId,
      },
    })

    if (existingClick) {
      // Just increment total clicks
      await prisma.campaignLink.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      })
    } else {
      // New unique click
      await prisma.campaignLinkClick.create({
        data: {
          linkId: link.id,
          recipientId,
          clickedAt: new Date(),
        },
      })

      await prisma.campaignLink.update({
        where: { id: link.id },
        data: {
          clickCount: { increment: 1 },
          uniqueClickCount: { increment: 1 },
        },
      })
    }
  } catch (error) {
    // Don't fail the webhook for link tracking errors
    logger.error('Link tracking error:', error)
  }
}
