/**
 * Facebook Conversions API (Server-Side Tracking)
 * Sends events to Facebook's server-side API for better accuracy
 */

import { getPixelConfig, isServerSideEnabled, isTestMode } from './config'
import { hashUserData, generateEventId, getUnixTimestamp } from './utils'
import type {
  PixelEventName,
  PageType,
  PixelEventParams,
  UserData,
  ConversionsAPIEvent,
  ConversionsAPIRequest,
  ConversionsAPIResponse,
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
      console.error('[Pixel] Facebook API error:', errorMessage)

      return {
        success: false,
        eventId: finalEventId,
        error: errorMessage,
      }
    }

    return {
      success: true,
      eventId: finalEventId,
      response: responseData as ConversionsAPIResponse,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Pixel] Server tracking error:', errorMessage)

    return {
      success: false,
      eventId: finalEventId,
      error: errorMessage,
    }
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
