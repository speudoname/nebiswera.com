/**
 * CRON Authentication Middleware
 *
 * Provides authentication helpers for CRON endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { unauthorizedResponse } from '@/lib/api-response'
import crypto from 'crypto'

export interface CronAuthResult {
  success: boolean
  response?: NextResponse
}

/**
 * Verify CRON secret from request authorization header
 *
 * @param request - The incoming request
 * @returns Object with success status and optional error response
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const auth = verifyCronSecret(request)
 *   if (!auth.success) return auth.response
 *   // ... handle cron job
 * }
 * ```
 */
export function verifyCronSecret(request: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    logger.error('CRON_SECRET environment variable is not configured')
    return {
      success: false,
      response: NextResponse.json({ error: 'Cron endpoint not configured' }, { status: 503 }),
    }
  }

  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '') || ''

  // Use timing-safe comparison to prevent timing attacks
  try {
    const providedBuffer = Buffer.from(providedSecret)
    const expectedBuffer = Buffer.from(cronSecret)

    const isValid =
      providedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(providedBuffer, expectedBuffer)

    if (!isValid) {
      logger.warn('Unauthorized cron request')
      return {
        success: false,
        response: unauthorizedResponse(),
      }
    }
  } catch {
    logger.warn('Unauthorized cron request - comparison failed')
    return {
      success: false,
      response: unauthorizedResponse(),
    }
  }

  return { success: true }
}
