import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/webinar/constants'

// Rate limiters for different endpoints
// Using memory storage - for production with multiple instances, consider Redis

// Auth endpoints: 5 requests per minute per IP
const authLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.AUTH_PER_MINUTE,
  duration: 60, // 1 minute
  blockDuration: 60, // Block for 1 minute if exceeded
})

// Email sending endpoints: 3 requests per 5 minutes per IP
const emailLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.EMAIL_PER_5_MINUTES,
  duration: RATE_LIMITS.EMAIL_DURATION_SECONDS,
  blockDuration: RATE_LIMITS.EMAIL_DURATION_SECONDS,
})

// General API endpoints: 60 requests per minute per IP
const generalLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.GENERAL_API_PER_MINUTE,
  duration: 60,
  blockDuration: 60,
})

// Webinar registration: 5 registrations per hour per IP (prevent spam)
const registrationLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.REGISTRATION_PER_HOUR,
  duration: RATE_LIMITS.REGISTRATION_DURATION_SECONDS,
  blockDuration: RATE_LIMITS.REGISTRATION_DURATION_SECONDS,
})

// Webinar chat: 20 messages per minute per user (prevent spam/flooding)
const chatLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.CHAT_MESSAGES_PER_MINUTE,
  duration: RATE_LIMITS.CHAT_DURATION_SECONDS,
  blockDuration: RATE_LIMITS.CHAT_BLOCK_DURATION_SECONDS,
})

// Analytics events: 100 events per minute per user (generous but prevents abuse)
const analyticsLimiter = new RateLimiterMemory({
  points: RATE_LIMITS.ANALYTICS_EVENTS_PER_MINUTE,
  duration: RATE_LIMITS.ANALYTICS_DURATION_SECONDS,
  blockDuration: RATE_LIMITS.ANALYTICS_DURATION_SECONDS,
})

type LimiterType = 'auth' | 'email' | 'general' | 'registration' | 'chat' | 'analytics'

const limiters: Record<LimiterType, RateLimiterMemory> = {
  auth: authLimiter,
  email: emailLimiter,
  general: generalLimiter,
  registration: registrationLimiter,
  chat: chatLimiter,
  analytics: analyticsLimiter,
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: Request): string {
  // Check common headers for client IP (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default (in development or direct connections)
  return '127.0.0.1'
}

/**
 * Rate limit response helper
 */
export function rateLimitExceeded(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfter)),
        'X-RateLimit-Retry-After': String(Math.ceil(retryAfter)),
      },
    }
  )
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or NextResponse if rate limited
 */
export async function checkRateLimit(
  request: Request,
  type: LimiterType = 'general'
): Promise<NextResponse | null> {
  const ip = getClientIp(request)
  const limiter = limiters[type]

  try {
    await limiter.consume(ip)
    return null // Request allowed
  } catch (rejRes) {
    // Type assertion for rate limiter rejection response
    const rejection = rejRes as { msBeforeNext: number }
    const retryAfter = rejection.msBeforeNext / 1000
    return rateLimitExceeded(retryAfter)
  }
}

/**
 * Check rate limit by access token (for authenticated endpoints)
 * Returns null if allowed, or NextResponse if rate limited
 */
export async function checkRateLimitByToken(
  token: string,
  type: LimiterType = 'general'
): Promise<NextResponse | null> {
  const limiter = limiters[type]

  try {
    await limiter.consume(token)
    return null // Request allowed
  } catch (rejRes) {
    const rejection = rejRes as { msBeforeNext: number }
    const retryAfter = rejection.msBeforeNext / 1000
    return rateLimitExceeded(retryAfter)
  }
}

/**
 * Higher-order function to wrap route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  type: LimiterType = 'general'
) {
  return async (request: Request): Promise<NextResponse> => {
    const rateLimitResponse = await checkRateLimit(request, type)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(request)
  }
}
