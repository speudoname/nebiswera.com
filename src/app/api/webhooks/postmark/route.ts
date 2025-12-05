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
}

interface PostmarkSpamComplaintEvent {
  RecordType: 'SpamComplaint'
  MessageID: string
  Email: string
  BouncedAt: string
}

interface PostmarkOpenEvent {
  RecordType: 'Open'
  MessageID: string
  Recipient: string
  ReceivedAt: string
  FirstOpen: boolean
}

type PostmarkEvent =
  | PostmarkDeliveryEvent
  | PostmarkBounceEvent
  | PostmarkSpamComplaintEvent
  | PostmarkOpenEvent

/**
 * Verify Basic HTTP Authentication
 * Postmark recommends using Basic Auth by embedding credentials in the webhook URL:
 * https://username:password@yourdomain.com/api/webhooks/postmark
 *
 * The credentials are sent in the Authorization header as "Basic base64(username:password)"
 */
function verifyBasicAuth(request: Request): boolean {
  const webhookUsername = process.env.POSTMARK_WEBHOOK_USERNAME
  const webhookPassword = process.env.POSTMARK_WEBHOOK_PASSWORD

  // SECURITY: Require authentication in production - deny if not configured
  if (!webhookUsername || !webhookPassword) {
    logger.error('Postmark webhook credentials not configured - denying request')
    return false
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }

  // Decode the base64 credentials
  const base64Credentials = authHeader.slice(6) // Remove "Basic "
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [username, password] = credentials.split(':')

  return username === webhookUsername && password === webhookPassword
}

export async function POST(request: Request) {
  try {
    // Verify Basic HTTP Authentication
    if (!verifyBasicAuth(request)) {
      logger.warn('Invalid webhook authentication')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = (await request.json()) as PostmarkEvent

    // Find the email log by message ID
    const emailLog = await prisma.emailLog.findUnique({
      where: { messageId: event.MessageID },
    })

    if (!emailLog) {
      // Email not found in our logs - might be from a different system
      return NextResponse.json({ received: true, processed: false })
    }

    // Update the email log based on the event type
    switch (event.RecordType) {
      case 'Delivery':
        await prisma.emailLog.update({
          where: { messageId: event.MessageID },
          data: {
            status: EmailStatus.DELIVERED,
            deliveredAt: new Date(event.DeliveredAt),
          },
        })
        break

      case 'Bounce':
        await prisma.emailLog.update({
          where: { messageId: event.MessageID },
          data: {
            status: EmailStatus.BOUNCED,
            bouncedAt: new Date(event.BouncedAt),
            bounceType: `${event.Type} (${event.TypeCode}): ${event.Name}`,
          },
        })
        break

      case 'SpamComplaint':
        await prisma.emailLog.update({
          where: { messageId: event.MessageID },
          data: {
            status: EmailStatus.SPAM_COMPLAINT,
            bouncedAt: new Date(event.BouncedAt),
          },
        })
        break

      case 'Open':
        // Only update to OPENED if it hasn't bounced
        if (emailLog.status !== EmailStatus.BOUNCED && emailLog.status !== EmailStatus.SPAM_COMPLAINT) {
          await prisma.emailLog.update({
            where: { messageId: event.MessageID },
            data: {
              status: EmailStatus.OPENED,
              openedAt: event.FirstOpen ? new Date(event.ReceivedAt) : emailLog.openedAt,
            },
          })
        }
        break
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (error) {
    logger.error('Postmark webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
