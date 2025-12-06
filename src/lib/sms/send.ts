/**
 * SMS Sending Functions
 *
 * High-level functions for sending SMS through various triggers
 */

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { getUBillClient, UBILL_STATUS, mapUBillStatusToSmsStatus } from './ubill-client'
import { normalizePhoneNumber, isValidGeorgianPhone, renderSmsTemplate } from './utils'
import type { SmsType } from '@prisma/client'

interface SendSmsOptions {
  phone: string
  message: string
  contactId?: string
  type: SmsType
  referenceType?: string
  referenceId?: string
  brandId?: number
}

interface SendSmsResult {
  success: boolean
  smsLogId?: string
  ubillSmsId?: number
  error?: string
}

interface QueueSmsOptions {
  phones: string[]
  message: string
  contactIds?: string[]
  type: SmsType
  referenceType?: string
  referenceId?: string
  brandId?: number
}

/**
 * Send a single SMS immediately
 */
export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const { phone, message, contactId, type, referenceType, referenceId, brandId } = options

  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phone)
  if (!normalizedPhone || !isValidGeorgianPhone(normalizedPhone)) {
    return { success: false, error: 'Invalid phone number' }
  }

  // Get settings
  const settings = await prisma.smsSettings.findFirst()
  if (!settings?.apiKey) {
    return { success: false, error: 'SMS not configured' }
  }

  const useBrandId = brandId ?? settings.defaultBrandId
  if (!useBrandId) {
    return { success: false, error: 'No brand ID configured' }
  }

  // Check daily limit if set
  if (settings.dailySendLimit) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sentToday = await prisma.smsLog.count({
      where: {
        createdAt: { gte: today },
        status: { in: ['SENT', 'DELIVERED', 'AWAITING'] },
      },
    })

    if (sentToday >= settings.dailySendLimit) {
      logger.warn('Daily SMS limit reached:', { limit: settings.dailySendLimit, sent: sentToday })
      return { success: false, error: 'Daily send limit reached' }
    }
  }

  // Check if contact is unsubscribed (for campaign SMS)
  if (type === 'CAMPAIGN' && contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { smsMarketingStatus: true },
    })

    if (contact?.smsMarketingStatus !== 'SUBSCRIBED') {
      return { success: false, error: 'Contact is unsubscribed from SMS marketing' }
    }
  }

  // Create log entry first (PENDING)
  const smsLog = await prisma.smsLog.create({
    data: {
      phone: normalizedPhone,
      message,
      brandId: useBrandId,
      type,
      referenceType,
      referenceId,
      contactId,
      status: 'PENDING',
    },
  })

  try {
    // Get client and send
    const client = await getUBillClient()
    if (!client) {
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { status: 'ERROR', error: 'Failed to initialize SMS client' },
      })
      return { success: false, smsLogId: smsLog.id, error: 'Failed to initialize SMS client' }
    }

    const response = await client.send({
      brandId: useBrandId,
      numbers: normalizedPhone,
      text: message,
    })

    // Update log with result
    const status = mapUBillStatusToSmsStatus(response.statusID)
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status,
        ubillSmsId: response.smsID ? String(response.smsID) : null,
        error: response.statusID !== UBILL_STATUS.SENT ? response.message : null,
      },
    })

    // Update contact stats if we have contactId
    if (contactId && response.statusID === UBILL_STATUS.SENT) {
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          lastSmsReceivedAt: new Date(),
          totalSmsReceived: { increment: 1 },
        },
      }).catch((err) => {
        logger.warn('Failed to update contact SMS stats:', err)
      })
    }

    if (response.statusID !== UBILL_STATUS.SENT) {
      return {
        success: false,
        smsLogId: smsLog.id,
        error: response.message || 'Failed to send SMS',
      }
    }

    return {
      success: true,
      smsLogId: smsLog.id,
      ubillSmsId: response.smsID,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: { status: 'ERROR', error: errorMessage },
    })
    logger.error('SMS send error:', error)
    return { success: false, smsLogId: smsLog.id, error: errorMessage }
  }
}

/**
 * Queue multiple SMS for batch sending
 * Creates PENDING log entries that will be processed by the queue processor
 */
export async function queueSms(options: QueueSmsOptions): Promise<{ queued: number; skipped: number }> {
  const { phones, message, contactIds, type, referenceType, referenceId, brandId } = options

  // Get settings
  const settings = await prisma.smsSettings.findFirst()
  if (!settings?.apiKey) {
    throw new Error('SMS not configured')
  }

  const useBrandId = brandId ?? settings.defaultBrandId
  if (!useBrandId) {
    throw new Error('No brand ID configured')
  }

  let queued = 0
  let skipped = 0

  // Create log entries for each phone
  const logsToCreate = []

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i]
    const contactId = contactIds?.[i]

    // Normalize and validate
    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone || !isValidGeorgianPhone(normalizedPhone)) {
      skipped++
      continue
    }

    // Check if contact is unsubscribed (for campaign SMS)
    if (type === 'CAMPAIGN' && contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { smsMarketingStatus: true },
      })

      if (contact?.smsMarketingStatus !== 'SUBSCRIBED') {
        skipped++
        continue
      }
    }

    logsToCreate.push({
      phone: normalizedPhone,
      message,
      brandId: useBrandId,
      type,
      referenceType,
      referenceId,
      contactId,
      status: 'PENDING' as const,
    })
  }

  // Bulk create
  if (logsToCreate.length > 0) {
    await prisma.smsLog.createMany({
      data: logsToCreate,
    })
    queued = logsToCreate.length
  }

  logger.info('SMS queued:', { queued, skipped, type, referenceType })

  return { queued, skipped }
}

/**
 * Send SMS using a template
 */
export async function sendTemplatedSms(options: {
  phone: string
  templateSlug: string
  variables: Record<string, string | number | null | undefined>
  locale?: 'ka' | 'en'
  contactId?: string
  type: SmsType
  referenceType?: string
  referenceId?: string
  brandId?: number
}): Promise<SendSmsResult> {
  const { phone, templateSlug, variables, locale = 'ka', contactId, type, referenceType, referenceId, brandId } = options

  // Get template
  const template = await prisma.smsTemplate.findUnique({
    where: { slug: templateSlug },
  })

  if (!template) {
    return { success: false, error: `Template not found: ${templateSlug}` }
  }

  if (!template.isActive) {
    return { success: false, error: `Template is inactive: ${templateSlug}` }
  }

  // Get message for locale
  const messageTemplate = locale === 'ka' ? template.messageKa : template.messageEn

  // Render with variables
  const message = renderSmsTemplate(messageTemplate, variables)

  // Send
  return sendSms({
    phone,
    message,
    contactId,
    type,
    referenceType: referenceType || 'template',
    referenceId: referenceId || template.id,
    brandId,
  })
}

/**
 * Append unsubscribe footer to campaign messages
 */
export async function appendUnsubscribeFooter(message: string, locale: 'ka' | 'en' = 'ka'): Promise<string> {
  const settings = await prisma.smsSettings.findFirst()
  if (!settings) return message

  const footer = locale === 'ka' ? settings.unsubscribeFooterKa : settings.unsubscribeFooterEn

  return `${message}\n\n${footer}`
}
