import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { EmailStatus } from '@prisma/client'

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

export async function POST(request: Request) {
  try {
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
    console.error('Postmark webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
