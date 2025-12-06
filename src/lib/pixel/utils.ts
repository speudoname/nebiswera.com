/**
 * Facebook Pixel Utility Functions
 * - SHA-256 hashing for user data
 * - Event ID generation
 * - Data normalization
 */

import { createHash } from 'crypto'
import type { UserData, HashedUserData } from './types'

/**
 * Generate a UUID that works in both browser and Node.js environments
 */
function getRandomUUID(): string {
  // Browser environment
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Node.js environment
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  // Fallback: generate a simple UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate SHA-256 hash of a string
 * Facebook requires lowercase hex-encoded SHA-256 hashes
 */
export function sha256Hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Normalize and hash a value according to Facebook's requirements
 * - Trim whitespace
 * - Convert to lowercase
 * - Hash with SHA-256
 */
export function normalizeAndHash(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') return undefined
  const normalized = value.trim().toLowerCase()
  return sha256Hash(normalized)
}

/**
 * Normalize phone number according to Facebook's requirements
 * - Remove all non-digit characters
 * - Include country code without + or 0
 */
export function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')
  // If starts with 00, remove them
  if (digits.startsWith('00')) {
    digits = digits.substring(2)
  }
  // Georgian numbers: if starts with 5 and is 9 digits, add country code 995
  if (digits.length === 9 && digits.startsWith('5')) {
    digits = '995' + digits
  }
  return digits || undefined
}

/**
 * Hash user data for Facebook Advanced Matching
 * All values are normalized (trimmed, lowercased) and SHA-256 hashed
 */
export function hashUserData(
  userData: UserData,
  browserData?: {
    clientIpAddress?: string
    clientUserAgent?: string
    fbp?: string
    fbc?: string
  }
): HashedUserData {
  const hashed: HashedUserData = {}

  // Hash email
  if (userData.email) {
    hashed.em = normalizeAndHash(userData.email)
  }

  // Hash phone (after normalization)
  if (userData.phone) {
    const normalizedPhone = normalizePhone(userData.phone)
    if (normalizedPhone) {
      hashed.ph = sha256Hash(normalizedPhone)
    }
  }

  // Hash first name
  if (userData.firstName) {
    hashed.fn = normalizeAndHash(userData.firstName)
  }

  // Hash last name
  if (userData.lastName) {
    hashed.ln = normalizeAndHash(userData.lastName)
  }

  // Hash city
  if (userData.city) {
    // Remove spaces, special characters, and lowercase
    const normalizedCity = userData.city.replace(/[^a-zA-Z]/g, '').toLowerCase()
    if (normalizedCity) {
      hashed.ct = sha256Hash(normalizedCity)
    }
  }

  // Hash state
  if (userData.state) {
    hashed.st = normalizeAndHash(userData.state)
  }

  // Hash zip code (just digits)
  if (userData.zipCode) {
    const normalizedZip = userData.zipCode.replace(/\D/g, '')
    if (normalizedZip) {
      hashed.zp = sha256Hash(normalizedZip)
    }
  }

  // Country code (ISO 2-letter, lowercase, NOT hashed)
  if (userData.country) {
    hashed.country = userData.country.toLowerCase()
  }

  // Hash date of birth (YYYYMMDD format)
  if (userData.dateOfBirth) {
    const normalizedDob = userData.dateOfBirth.replace(/\D/g, '')
    if (normalizedDob.length === 8) {
      hashed.db = sha256Hash(normalizedDob)
    }
  }

  // Hash gender
  if (userData.gender) {
    hashed.ge = sha256Hash(userData.gender.toLowerCase())
  }

  // Hash external ID
  if (userData.externalId) {
    hashed.external_id = sha256Hash(userData.externalId)
  }

  // Add browser data (not hashed)
  if (browserData) {
    if (browserData.clientIpAddress) {
      hashed.client_ip_address = browserData.clientIpAddress
    }
    if (browserData.clientUserAgent) {
      hashed.client_user_agent = browserData.clientUserAgent
    }
    if (browserData.fbp) {
      hashed.fbp = browserData.fbp
    }
    if (browserData.fbc) {
      hashed.fbc = browserData.fbc
    }
  }

  return hashed
}

/**
 * Generate a unique event ID for deduplication
 * Format: timestamp-uuid-eventName
 * Uses crypto.randomUUID() for collision-resistant IDs
 * Client and server should use the SAME event ID for the same event
 */
export function generateEventId(eventName: string): string {
  const timestamp = Date.now()
  const uuid = getRandomUUID()
  return `${timestamp}-${uuid}-${eventName}`
}

/**
 * Get current Unix timestamp in seconds (for Conversions API)
 */
export function getUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Parse _fbp cookie value
 * Format: fb.1.{timestamp}.{random}
 */
export function parseFbpCookie(fbp: string | undefined): string | undefined {
  if (!fbp) return undefined
  // Validate format
  if (fbp.startsWith('fb.')) {
    return fbp
  }
  return undefined
}

/**
 * Parse _fbc cookie value or generate from fbclid URL parameter
 * Format: fb.1.{timestamp}.{fbclid}
 */
export function parseFbcCookie(fbc: string | undefined, fbclid?: string): string | undefined {
  if (fbc && fbc.startsWith('fb.')) {
    return fbc
  }
  // Generate from fbclid if available
  if (fbclid) {
    const timestamp = Date.now()
    return `fb.1.${timestamp}.${fbclid}`
  }
  return undefined
}

/**
 * Extract fbclid from URL if present
 */
export function extractFbclid(url: string): string | undefined {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('fbclid') || undefined
  } catch {
    return undefined
  }
}

/**
 * Get user data field names (for logging purposes, not values)
 * Returns which fields were provided without exposing actual values
 */
export function getUserDataFieldsSummary(userData: UserData): Record<string, boolean> {
  return {
    email: !!userData.email,
    phone: !!userData.phone,
    firstName: !!userData.firstName,
    lastName: !!userData.lastName,
    city: !!userData.city,
    state: !!userData.state,
    country: !!userData.country,
    zipCode: !!userData.zipCode,
    dateOfBirth: !!userData.dateOfBirth,
    gender: !!userData.gender,
    externalId: !!userData.externalId,
  }
}
