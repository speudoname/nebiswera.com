/**
 * UBill SMS API Client
 *
 * API Documentation:
 * - Send SMS: POST /v1/sms/sendXml?key={apiKey}
 * - Delivery Report: GET /v1/sms/report/{smsID}
 * - Balance: GET /v1/sms/balance?key={apiKey}
 */

import { logger } from '@/lib/logger'

const UBILL_BASE_URL = 'https://api.ubill.dev/v1/sms'

// UBill API Response Status IDs
export const UBILL_STATUS = {
  SENT: 0,
  RECEIVED: 1, // Delivered
  NOT_DELIVERED: 2,
  AWAITING_STATUS: 3,
  ERROR: 4,
} as const

export type UBillStatusId = (typeof UBILL_STATUS)[keyof typeof UBILL_STATUS]

// Response types
export interface UBillSendResponse {
  statusID: number
  smsID?: number
  message?: string
}

export interface UBillDeliveryStatus {
  number: string
  statusID: string
}

export interface UBillReportResponse {
  statusID: number
  result?: UBillDeliveryStatus[]
}

export interface UBillBalanceResponse {
  statusID: number
  sms?: number
}

// Input types
export interface SendSmsOptions {
  brandId: number
  numbers: string | string[] // Single number or array of numbers
  text: string
  stopList?: boolean // Enable/disable checking numbers in the stop list
}

export interface UBillClientConfig {
  apiKey: string
}

/**
 * UBill SMS API Client
 */
export class UBillClient {
  private apiKey: string

  constructor(config: UBillClientConfig) {
    this.apiKey = config.apiKey
  }

  /**
   * Send SMS to one or more recipients
   * Supports sending to multiple numbers in a single API call
   */
  async send(options: SendSmsOptions): Promise<UBillSendResponse> {
    const { brandId, numbers, text, stopList = false } = options

    // Normalize numbers to comma-separated string
    const numbersStr = Array.isArray(numbers) ? numbers.join(',') : numbers

    // Build XML body
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<request>
    <brandID>${brandId}</brandID>
    <numbers>${numbersStr}</numbers>
    <text>${this.escapeXml(text)}</text>
    <stopList>${stopList}</stopList>
</request>`

    try {
      const response = await fetch(
        `${UBILL_BASE_URL}/sendXml?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
          },
          body: xmlBody,
        }
      )

      const xmlText = await response.text()
      const parsed = this.parseXmlResponse(xmlText)

      if (parsed.statusID !== UBILL_STATUS.SENT) {
        logger.error('UBill SMS send failed:', {
          statusID: parsed.statusID,
          message: parsed.message,
          numbers: numbersStr,
        })
      } else {
        logger.info('UBill SMS sent:', {
          smsID: parsed.smsID,
          numbers: numbersStr.substring(0, 50) + (numbersStr.length > 50 ? '...' : ''),
        })
      }

      return parsed
    } catch (error) {
      logger.error('UBill API error:', error)
      throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get delivery status report for an SMS
   */
  async getReport(smsId: string | number): Promise<UBillReportResponse> {
    try {
      const response = await fetch(
        `${UBILL_BASE_URL}/report/${smsId}`,
        {
          method: 'GET',
          headers: {
            'key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      )

      const data: UBillReportResponse = await response.json()

      if (data.statusID !== UBILL_STATUS.SENT) {
        logger.warn('UBill delivery report issue:', {
          smsId,
          statusID: data.statusID,
        })
      }

      return data
    } catch (error) {
      logger.error('UBill report API error:', error)
      throw new Error(`Failed to get SMS report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get remaining SMS balance
   */
  async getBalance(): Promise<UBillBalanceResponse> {
    try {
      const response = await fetch(
        `${UBILL_BASE_URL}/balance?key=${this.apiKey}`,
        {
          method: 'GET',
        }
      )

      const data: UBillBalanceResponse = await response.json()

      if (data.statusID !== UBILL_STATUS.SENT) {
        logger.warn('UBill balance check issue:', {
          statusID: data.statusID,
        })
      }

      return data
    } catch (error) {
      logger.error('UBill balance API error:', error)
      throw new Error(`Failed to get SMS balance: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse XML response from UBill
   */
  private parseXmlResponse(xml: string): UBillSendResponse {
    // Simple XML parsing for the expected response format
    const statusMatch = xml.match(/<statusID>(\d+)<\/statusID>/)
    const smsIdMatch = xml.match(/<smsID>(\d+)<\/smsID>/)
    const messageMatch = xml.match(/<message>([^<]*)<\/message>/)

    return {
      statusID: statusMatch ? parseInt(statusMatch[1], 10) : -1,
      smsID: smsIdMatch ? parseInt(smsIdMatch[1], 10) : undefined,
      message: messageMatch ? messageMatch[1] : undefined,
    }
  }

  /**
   * Escape special characters for XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

/**
 * Get a configured UBill client from settings
 */
export async function getUBillClient(): Promise<UBillClient | null> {
  // Lazy import to avoid circular dependency
  const { prisma } = await import('@/lib/db')

  const settings = await prisma.smsSettings.findFirst()

  if (!settings?.apiKey) {
    logger.warn('UBill API key not configured')
    return null
  }

  return new UBillClient({ apiKey: settings.apiKey })
}

/**
 * Map UBill status ID to our SmsStatus enum
 */
export function mapUBillStatusToSmsStatus(
  ubillStatusId: number | string
): 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'AWAITING' | 'ERROR' {
  const statusId = typeof ubillStatusId === 'string' ? parseInt(ubillStatusId, 10) : ubillStatusId

  switch (statusId) {
    case UBILL_STATUS.SENT:
      return 'SENT'
    case UBILL_STATUS.RECEIVED:
      return 'DELIVERED'
    case UBILL_STATUS.NOT_DELIVERED:
      return 'FAILED'
    case UBILL_STATUS.AWAITING_STATUS:
      return 'AWAITING'
    case UBILL_STATUS.ERROR:
      return 'ERROR'
    default:
      return 'PENDING'
  }
}
