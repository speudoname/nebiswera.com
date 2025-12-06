/**
 * Facebook Conversions API (Server-Side Tracking)
 * Sends events to Facebook's server-side API for better accuracy
 */

import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getPixelConfig, isServerSideEnabled, isTestMode } from './config'
import { hashUserData, generateEventId, getUnixTimestamp, getUserDataFieldsSummary } from './utils'
import type {
  PixelEventName,
  PageType,
  PixelEventParams,
  UserData,
  ConversionsAPIEvent,
  ConversionsAPIRequest,
  ConversionsAPIResponse,
  PixelEventLogEntry,
} from './types'

const FACEBOOK_API_VERSION = 'v18.0'
const FACEBOOK_API_BASE_URL = 'https://graph.facebook.com'
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch with exponential backoff retry logic
 * Retries on network errors and 5xx server errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // Don't retry on client errors (4xx) - these are permanent failures
      if (response.status >= 400 && response.status < 500) {
        return response
      }

      // Retry on server errors (5xx)
      if (response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
          console.warn(`[Pixel] Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await sleep(delay)
          continue
        }
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Network error - retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
        console.warn(`[Pixel] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, lastError.message)
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

interface TrackServerEventParams {
  eventName: PixelEventName
  eventId?: string
  pageType: PageType
  pageUrl: string
  params?: PixelEventParams
  userData?: UserData
  browserData?: {
    clientIpAddress?: string
    clientUserAgent?: string
    fbp?: string
    fbc?: string
  }
  userId?: string
  contactId?: string
}

/**
 * Send event to Facebook Conversions API
 */
export async function trackServerEvent({
  eventName,
  eventId,
  pageType,
  pageUrl,
  params,
  userData,
  browserData,
  userId,
  contactId,
}: TrackServerEventParams): Promise<{
  success: boolean
  eventId: string
  response?: ConversionsAPIResponse
  error?: string
}> {
  const finalEventId = eventId || generateEventId(eventName)

  // Check if server-side tracking is enabled
  const serverEnabled = await isServerSideEnabled()
  if (!serverEnabled) {
    return {
      success: false,
      eventId: finalEventId,
      error: 'Server-side tracking not enabled or not configured',
    }
  }

  const config = await getPixelConfig()
  const testMode = await isTestMode()

  try {
    // Hash user data
    const hashedUserData = hashUserData(userData || {}, browserData)

    // Build the event
    const event: ConversionsAPIEvent = {
      event_name: eventName,
      event_time: getUnixTimestamp(),
      event_id: finalEventId,
      event_source_url: pageUrl,
      action_source: 'website',
      user_data: hashedUserData,
    }

    // Add custom data if provided
    if (params && Object.keys(params).length > 0) {
      event.custom_data = params
    }

    // Build request body
    const requestBody: ConversionsAPIRequest = {
      data: [event],
    }

    // Add test event code if in test mode
    if (testMode && config.fbTestEventCode) {
      requestBody.test_event_code = config.fbTestEventCode
    }

    // Send to Facebook
    const apiUrl = `${FACEBOOK_API_BASE_URL}/${FACEBOOK_API_VERSION}/${config.fbPixelId}/events`

    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestBody,
        access_token: config.fbAccessToken,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      const errorMessage = responseData.error?.message || 'Unknown error from Facebook API'

      // Log failed event
      await logPixelEvent({
        eventId: finalEventId,
        eventName,
        source: 'server',
        pageType,
        pageUrl,
        userId,
        contactId,
        fbp: browserData?.fbp,
        fbc: browserData?.fbc,
        eventData: params,
        userData: userData ? getUserDataFieldsSummary(userData) : undefined,
        status: 'failed',
        errorMsg: errorMessage,
      })

      return {
        success: false,
        eventId: finalEventId,
        error: errorMessage,
      }
    }

    // Log successful event
    await logPixelEvent({
      eventId: finalEventId,
      eventName,
      source: 'server',
      pageType,
      pageUrl,
      userId,
      contactId,
      fbp: browserData?.fbp,
      fbc: browserData?.fbc,
      eventData: params,
      userData: userData ? getUserDataFieldsSummary(userData) : undefined,
      status: testMode ? 'test' : 'sent',
      fbResponse: responseData as ConversionsAPIResponse,
    })

    return {
      success: true,
      eventId: finalEventId,
      response: responseData as ConversionsAPIResponse,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log error
    await logPixelEvent({
      eventId: finalEventId,
      eventName,
      source: 'server',
      pageType,
      pageUrl,
      userId,
      contactId,
      fbp: browserData?.fbp,
      fbc: browserData?.fbc,
      eventData: params,
      userData: userData ? getUserDataFieldsSummary(userData) : undefined,
      status: 'failed',
      errorMsg: errorMessage,
    })

    return {
      success: false,
      eventId: finalEventId,
      error: errorMessage,
    }
  }
}

/**
 * Log pixel event to database for debugging
 */
async function logPixelEvent(entry: PixelEventLogEntry): Promise<void> {
  try {
    await prisma.pixelEventLog.create({
      data: {
        eventId: entry.eventId,
        eventName: entry.eventName,
        source: entry.source,
        pageType: entry.pageType,
        pageUrl: entry.pageUrl,
        userId: entry.userId,
        contactId: entry.contactId,
        fbp: entry.fbp,
        fbc: entry.fbc,
        eventData: entry.eventData || undefined,
        userData: entry.userData || undefined,
        status: entry.status,
        errorMsg: entry.errorMsg,
        fbResponse: entry.fbResponse ? (entry.fbResponse as unknown as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch (error) {
    console.error('[Pixel] Failed to log event:', error)
  }
}

/**
 * Send multiple events in a batch (more efficient for high-volume)
 */
export async function trackServerEventsBatch(
  events: TrackServerEventParams[]
): Promise<{
  success: boolean
  results: Array<{ eventId: string; success: boolean; error?: string }>
}> {
  const results = await Promise.all(
    events.map((event) => trackServerEvent(event))
  )

  return {
    success: results.every((r) => r.success),
    results: results.map((r) => ({
      eventId: r.eventId,
      success: r.success,
      error: r.error,
    })),
  }
}

/**
 * Cleanup old event logs (called by cron job)
 */
export async function cleanupOldEventLogs(daysToKeep: number = 7): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await prisma.pixelEventLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  })

  return result.count
}

/**
 * Get event logs for admin panel
 */
export async function getEventLogs(options: {
  page?: number
  limit?: number
  eventName?: string
  source?: 'client' | 'server'
  status?: 'sent' | 'failed' | 'test'
  pageType?: string
  startDate?: Date
  endDate?: Date
}): Promise<{
  logs: Array<{
    id: string
    eventId: string
    eventName: string
    source: string
    pageType: string
    pageUrl: string
    status: string
    createdAt: Date
    errorMsg?: string | null
  }>
  total: number
  page: number
  totalPages: number
}> {
  const page = options.page || 1
  const limit = options.limit || 50
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (options.eventName) {
    where.eventName = options.eventName
  }
  if (options.source) {
    where.source = options.source
  }
  if (options.status) {
    where.status = options.status
  }
  if (options.pageType) {
    where.pageType = options.pageType
  }
  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      (where.createdAt as Record<string, Date>).gte = options.startDate
    }
    if (options.endDate) {
      (where.createdAt as Record<string, Date>).lte = options.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.pixelEventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        eventId: true,
        eventName: true,
        source: true,
        pageType: true,
        pageUrl: true,
        status: true,
        createdAt: true,
        errorMsg: true,
      },
    }),
    prisma.pixelEventLog.count({ where }),
  ])

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get single event log with full details
 */
export async function getEventLogDetails(id: string) {
  return prisma.pixelEventLog.findUnique({
    where: { id },
  })
}
