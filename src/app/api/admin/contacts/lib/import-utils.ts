// Smart CSV/JSON import utilities

import { EMAIL_REGEX } from '@/lib'

export type FieldType = 'email' | 'firstName' | 'lastName' | 'fullName' | 'phone' | 'notes' | 'unknown'

export interface ColumnMapping {
  originalHeader: string
  detectedType: FieldType
  confidence: 'high' | 'medium' | 'low'
  sampleValues: string[]
}

export interface DetectionResult {
  mappings: ColumnMapping[]
  hasEmail: boolean
  hasFullName: boolean
  hasSplitName: boolean
}

// Header name variations for each field type
const HEADER_PATTERNS: Record<FieldType, RegExp[]> = {
  email: [
    /^e[-_]?mail$/i,
    /^email[-_]?addr(ess)?$/i,
    /^ელ[-_.]?(ფოსტა)?$/i,
    /^მეილი?$/i,
  ],
  firstName: [
    /^first[-_]?name$/i,
    /^fname$/i,
    /^given[-_]?name$/i,
    /^სახელი$/i,
  ],
  lastName: [
    /^last[-_]?name$/i,
    /^lname$/i,
    /^surname$/i,
    /^family[-_]?name$/i,
    /^გვარი$/i,
  ],
  fullName: [
    /^(full[-_]?)?name$/i,
    /^სრული[-_]?სახელი$/i,
    /^სახელი[-_]?გვარი$/i,
  ],
  phone: [
    /^phone$/i,
    /^tel(ephone)?$/i,
    /^mobile$/i,
    /^cell$/i,
    /^ტელ(ეფონი)?$/i,
    /^მობ(ილური)?$/i,
  ],
  notes: [
    /^notes?$/i,
    /^comment(s)?$/i,
    /^description$/i,
    /^შენიშვნა$/i,
  ],
  unknown: [],
}

// Content-based detection patterns
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/

/**
 * Detect the type of a column based on its header name
 */
function detectByHeader(header: string): { type: FieldType; confidence: 'high' | 'medium' } | null {
  const normalizedHeader = header.trim()

  for (const [fieldType, patterns] of Object.entries(HEADER_PATTERNS)) {
    if (fieldType === 'unknown') continue

    for (const pattern of patterns) {
      if (pattern.test(normalizedHeader)) {
        return { type: fieldType as FieldType, confidence: 'high' }
      }
    }
  }

  // Fuzzy matching for common variations
  const lower = normalizedHeader.toLowerCase()
  if (lower.includes('email') || lower.includes('mail')) {
    return { type: 'email', confidence: 'medium' }
  }
  if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile')) {
    return { type: 'phone', confidence: 'medium' }
  }
  if (lower.includes('first') && lower.includes('name')) {
    return { type: 'firstName', confidence: 'medium' }
  }
  if (lower.includes('last') && lower.includes('name')) {
    return { type: 'lastName', confidence: 'medium' }
  }
  if (lower.includes('name') && !lower.includes('first') && !lower.includes('last')) {
    return { type: 'fullName', confidence: 'medium' }
  }
  if (lower.includes('note') || lower.includes('comment')) {
    return { type: 'notes', confidence: 'medium' }
  }

  return null
}

/**
 * Detect the type of a column based on its content
 */
function detectByContent(values: string[]): { type: FieldType; confidence: 'high' | 'medium' | 'low' } | null {
  const nonEmptyValues = values.filter(v => v && v.trim())
  if (nonEmptyValues.length === 0) return null

  // Check for email pattern
  const emailMatches = nonEmptyValues.filter(v => EMAIL_REGEX.test(v.trim()))
  if (emailMatches.length / nonEmptyValues.length > 0.8) {
    return { type: 'email', confidence: 'high' }
  }
  if (emailMatches.length / nonEmptyValues.length > 0.5) {
    return { type: 'email', confidence: 'medium' }
  }

  // Check for phone pattern
  const phoneMatches = nonEmptyValues.filter(v => PHONE_REGEX.test(v.trim()))
  if (phoneMatches.length / nonEmptyValues.length > 0.7) {
    return { type: 'phone', confidence: 'medium' }
  }

  // Check for full name pattern (two or more words)
  const multiWordValues = nonEmptyValues.filter(v => v.trim().split(/\s+/).length >= 2)
  if (multiWordValues.length / nonEmptyValues.length > 0.6) {
    // Likely full names
    return { type: 'fullName', confidence: 'low' }
  }

  // Check for single word values (could be first or last name)
  const singleWordValues = nonEmptyValues.filter(v => v.trim().split(/\s+/).length === 1)
  if (singleWordValues.length / nonEmptyValues.length > 0.8) {
    // Could be first name or last name - need context
    return { type: 'firstName', confidence: 'low' }
  }

  return null
}

/**
 * Analyze columns and detect their types
 */
export function detectColumns(data: Record<string, string>[]): DetectionResult {
  if (data.length === 0) {
    return { mappings: [], hasEmail: false, hasFullName: false, hasSplitName: false }
  }

  const headers = Object.keys(data[0])
  const mappings: ColumnMapping[] = []
  const detectedTypes = new Set<FieldType>()

  for (const header of headers) {
    const values = data.map(row => row[header] || '')
    const sampleValues = values.slice(0, 5).filter(v => v.trim())

    // Try header-based detection first
    const headerDetection = detectByHeader(header)

    // Then try content-based detection
    const contentDetection = detectByContent(values)

    let finalType: FieldType = 'unknown'
    let confidence: 'high' | 'medium' | 'low' = 'low'

    if (headerDetection) {
      finalType = headerDetection.type
      confidence = headerDetection.confidence
    } else if (contentDetection) {
      finalType = contentDetection.type
      confidence = contentDetection.confidence
    }

    // Avoid duplicate type assignments (except unknown)
    if (finalType !== 'unknown' && detectedTypes.has(finalType)) {
      // If we already have this type, check if this one has higher confidence
      const existing = mappings.find(m => m.detectedType === finalType)
      if (existing && confidence === 'high' && existing.confidence !== 'high') {
        existing.detectedType = 'unknown'
        existing.confidence = 'low'
      } else {
        finalType = 'unknown'
        confidence = 'low'
      }
    }

    if (finalType !== 'unknown') {
      detectedTypes.add(finalType)
    }

    mappings.push({
      originalHeader: header,
      detectedType: finalType,
      confidence,
      sampleValues,
    })
  }

  // Post-processing: if we have fullName but no firstName/lastName, mark it
  const hasFullName = detectedTypes.has('fullName')
  const hasSplitName = detectedTypes.has('firstName') || detectedTypes.has('lastName')
  const hasEmail = detectedTypes.has('email')

  return {
    mappings,
    hasEmail,
    hasFullName,
    hasSplitName,
  }
}

/**
 * Split a full name into first and last name
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || !fullName.trim()) {
    return { firstName: '', lastName: '' }
  }

  const parts = fullName.trim().split(/\s+/)

  if (parts.length === 1) {
    // Single word - assume it's the first name
    return { firstName: parts[0], lastName: '' }
  }

  if (parts.length === 2) {
    // Two words - first and last
    return { firstName: parts[0], lastName: parts[1] }
  }

  // Three or more words - first word is first name, rest is last name
  // This handles cases like "John van der Berg"
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * Transform raw data using the column mappings
 */
export function transformData(
  data: Record<string, string>[],
  mappings: ColumnMapping[]
): {
  email: string
  firstName: string
  lastName: string
  phone: string
  notes: string
}[] {
  return data.map(row => {
    const result = {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      notes: '',
    }

    let fullNameValue = ''

    for (const mapping of mappings) {
      const value = row[mapping.originalHeader]?.trim() || ''

      switch (mapping.detectedType) {
        case 'email':
          result.email = value.toLowerCase()
          break
        case 'firstName':
          result.firstName = value
          break
        case 'lastName':
          result.lastName = value
          break
        case 'fullName':
          fullNameValue = value
          break
        case 'phone':
          result.phone = value
          break
        case 'notes':
          result.notes = value
          break
      }
    }

    // If we have a full name but no split names, split it
    if (fullNameValue && !result.firstName && !result.lastName) {
      const { firstName, lastName } = splitFullName(fullNameValue)
      result.firstName = firstName
      result.lastName = lastName
    }

    return result
  })
}

/**
 * Validate transformed data
 */
export function validateTransformedData(
  data: ReturnType<typeof transformData>
): { valid: typeof data; invalid: { row: number; data: typeof data[0]; error: string }[] } {
  const valid: typeof data = []
  const invalid: { row: number; data: typeof data[0]; error: string }[] = []

  data.forEach((row, index) => {
    if (!row.email) {
      invalid.push({ row: index + 1, data: row, error: 'Missing email' })
    } else if (!EMAIL_REGEX.test(row.email)) {
      invalid.push({ row: index + 1, data: row, error: 'Invalid email format' })
    } else {
      valid.push(row)
    }
  })

  return { valid, invalid }
}
