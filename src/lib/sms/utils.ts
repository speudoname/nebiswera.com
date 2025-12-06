/**
 * SMS Utility Functions
 */

// Georgian phone number formats:
// - +995XXXXXXXXX (international with +)
// - 995XXXXXXXXX (international without +)
// - 5XXXXXXXX (local mobile, 9 digits starting with 5)
// - 0XXXXXXXXX (local with leading 0)

/**
 * Normalize a Georgian phone number to international format (995XXXXXXXXX)
 * Returns null if the number is invalid
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // Handle different formats
  if (cleaned.startsWith('995') && cleaned.length === 12) {
    // Already in international format: 995XXXXXXXXX
    return cleaned
  }

  if (cleaned.startsWith('5') && cleaned.length === 9) {
    // Local mobile format: 5XXXXXXXX
    return `995${cleaned}`
  }

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Local with leading 0: 0XXXXXXXXX -> remove 0 and add 995
    return `995${cleaned.substring(1)}`
  }

  // Invalid format
  return null
}

/**
 * Validate a Georgian phone number
 */
export function isValidGeorgianPhone(phone: string | null | undefined): boolean {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return false

  // Must be 12 digits starting with 995
  if (normalized.length !== 12) return false
  if (!normalized.startsWith('995')) return false

  // Mobile numbers in Georgia start with 5 after country code
  // Valid mobile prefixes: 5XX
  const localPart = normalized.substring(3)
  if (!localPart.startsWith('5')) return false

  return true
}

/**
 * Format phone number for display
 * E.g., 995551234567 -> +995 551 234 567
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return phone || ''

  return `+${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 9)} ${normalized.substring(9)}`
}

/**
 * Calculate SMS segment count
 * Standard GSM-7 encoding: 160 chars per segment (or 153 if multi-part)
 * Unicode (Georgian): 70 chars per segment (or 67 if multi-part)
 */
export function calculateSmsSegments(text: string): { segments: number; encoding: 'gsm7' | 'unicode' } {
  // Check if text contains non-GSM characters (like Georgian)
  const isUnicode = /[^\x00-\x7F@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-Zäöñü§¿a-zäöñüà]/.test(text)

  if (isUnicode) {
    // Unicode encoding
    if (text.length <= 70) return { segments: 1, encoding: 'unicode' }
    return { segments: Math.ceil(text.length / 67), encoding: 'unicode' }
  } else {
    // GSM-7 encoding
    if (text.length <= 160) return { segments: 1, encoding: 'gsm7' }
    return { segments: Math.ceil(text.length / 153), encoding: 'gsm7' }
  }
}

/**
 * Get character limit info for SMS
 */
export function getSmsCharacterInfo(text: string): {
  charCount: number
  segments: number
  encoding: 'gsm7' | 'unicode'
  maxCharsPerSegment: number
  remainingInCurrentSegment: number
} {
  const { segments, encoding } = calculateSmsSegments(text)
  const maxCharsPerSegment = encoding === 'unicode' ? 70 : 160
  const multiPartMax = encoding === 'unicode' ? 67 : 153

  let remainingInCurrentSegment: number
  if (segments === 1) {
    remainingInCurrentSegment = maxCharsPerSegment - text.length
  } else {
    const charsInFullSegments = (segments - 1) * multiPartMax
    const charsInLastSegment = text.length - charsInFullSegments
    remainingInCurrentSegment = multiPartMax - charsInLastSegment
  }

  return {
    charCount: text.length,
    segments,
    encoding,
    maxCharsPerSegment,
    remainingInCurrentSegment,
  }
}

/**
 * Render SMS template with variables
 * Variables are in format: {{variableName}}
 */
export function renderSmsTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key]
    return value != null ? String(value) : ''
  })
}

/**
 * Extract variable names from an SMS template
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || []
  return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ''))))
}

/**
 * Truncate message to fit within SMS character limits
 */
export function truncateForSms(
  text: string,
  maxSegments: number = 3
): { text: string; truncated: boolean } {
  const { encoding } = calculateSmsSegments(text)
  const multiPartMax = encoding === 'unicode' ? 67 : 153
  const maxChars = maxSegments * multiPartMax

  if (text.length <= maxChars) {
    return { text, truncated: false }
  }

  // Truncate and add ellipsis
  const truncated = text.substring(0, maxChars - 3) + '...'
  return { text: truncated, truncated: true }
}
