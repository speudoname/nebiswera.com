import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib/logger'
import { queueSms, appendUnsubscribeFooter, normalizePhoneNumber, isValidGeorgianPhone, renderSmsTemplate } from '@/lib/sms'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/sms/campaigns/[id]/send
 * Queue campaign recipients and start sending
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch campaign
    const campaign = await prisma.smsCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only allow sending draft or scheduled campaigns
    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Campaign cannot be sent in current status' },
        { status: 400 }
      )
    }

    // Build target query based on targetType and targetCriteria
    const contactWhere = buildContactQuery(campaign.targetType, campaign.targetCriteria as Record<string, unknown> | null)

    // Get eligible contacts
    const contacts = await prisma.contact.findMany({
      where: {
        ...contactWhere,
        status: 'ACTIVE',
        phone: { not: null },
        smsMarketingStatus: 'SUBSCRIBED',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    })

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients found' },
        { status: 400 }
      )
    }

    // Filter contacts with valid phone numbers
    const validContacts = contacts.filter((c) => {
      const normalized = normalizePhoneNumber(c.phone)
      return normalized && isValidGeorgianPhone(normalized)
    })

    if (validContacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts with valid phone numbers found' },
        { status: 400 }
      )
    }

    // Update campaign status to SENDING
    await prisma.smsCampaign.update({
      where: { id },
      data: {
        status: 'SENDING',
        sendingStartedAt: new Date(),
        totalRecipients: validContacts.length,
      },
    })

    // Append unsubscribe footer to campaign message
    const messageWithFooter = await appendUnsubscribeFooter(campaign.message, 'ka')

    // Create recipient records and queue SMS
    const recipientData = validContacts.map((contact) => {
      const variables = {
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
      }

      const personalizedMessage = renderSmsTemplate(messageWithFooter, variables)

      return {
        campaignId: id,
        contactId: contact.id,
        phone: normalizePhoneNumber(contact.phone)!,
        variables,
        finalMessage: personalizedMessage,
        status: 'PENDING' as const,
      }
    })

    // Create recipients in batches
    await prisma.smsCampaignRecipient.createMany({
      data: recipientData,
      skipDuplicates: true,
    })

    // Queue SMS for all recipients
    const phones = recipientData.map((r) => r.phone)
    const contactIds = recipientData.map((r) => r.contactId)

    const { queued, skipped } = await queueSms({
      phones,
      message: messageWithFooter,
      contactIds,
      type: 'CAMPAIGN',
      referenceType: 'sms_campaign',
      referenceId: id,
      brandId: campaign.brandId,
    })

    // Update campaign stats
    await prisma.smsCampaign.update({
      where: { id },
      data: {
        sentCount: queued,
        failedCount: skipped,
        status: queued > 0 ? 'SENDING' : 'COMPLETED',
        completedAt: queued === 0 ? new Date() : null,
      },
    })

    logger.info('SMS campaign queued:', {
      campaignId: id,
      totalRecipients: validContacts.length,
      queued,
      skipped,
    })

    return NextResponse.json({
      success: true,
      totalRecipients: validContacts.length,
      queued,
      skipped,
    })
  } catch (error) {
    logger.error('Failed to send SMS campaign:', error)

    // Try to update campaign status to indicate failure
    try {
      const { id } = await params
      await prisma.smsCampaign.update({
        where: { id },
        data: { status: 'PAUSED' },
      })
    } catch {
      // Ignore update error
    }

    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}

/**
 * Build Prisma where clause based on target type and criteria
 */
function buildContactQuery(
  targetType: string,
  criteria: Record<string, unknown> | null
): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  switch (targetType) {
    case 'ALL':
      // No additional filters
      break

    case 'TAGS':
      if (criteria?.tagIds && Array.isArray(criteria.tagIds)) {
        where.tags = {
          some: {
            tagId: { in: criteria.tagIds },
          },
        }
      }
      break

    case 'SEGMENT':
      // Segments would require more complex query building
      // For now, treat as ALL
      break

    case 'WEBINAR_REGISTRANTS':
      if (criteria?.webinarId) {
        where.webinarRegistrations = {
          some: {
            webinarId: criteria.webinarId,
          },
        }
      }
      break

    case 'COURSE_ENROLLEES':
      if (criteria?.courseId) {
        where.user = {
          enrollments: {
            some: {
              courseId: criteria.courseId,
            },
          },
        }
      }
      break

    default:
      break
  }

  return where
}
