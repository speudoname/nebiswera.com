# Code Consolidation Plan - Nebiswera.com

**Date:** 2025-01-04
**Status:** 🔵 Ready to Execute
**Total Issues:** 64 identified
**Estimated Time:** 6-8 hours across 6 phases

---

## Plan Philosophy

### Guiding Principles
1. **Safety First** - No changes that could break production
2. **Incremental Progress** - Build after each phase to verify
3. **High Impact First** - Fix issues that affect multiple files
4. **Low Risk Moves** - Create new code before removing old code
5. **Skip Low Value** - Don't fix what's already working well
6. **Document Everything** - Track what changed and why

### What We're NOT Fixing
- ❌ File naming (already excellent)
- ❌ Auth patterns (already consistent)
- ❌ Minimal prop drilling (not a real problem)
- ❌ Low-severity console.logs in development code
- ❌ TODO comments (only 2, both intentional)

---

## Progress Tracker

### Overall Status
```
Phase 1: Shared Utilities        [✅ COMPLETE] 4/4 steps
Phase 2: Type Consolidation      [✅ COMPLETE] 5/5 steps
Phase 3: Duplicate Removal       [🔴 Not Started] 0/3 steps
Phase 4: API Standardization     [🔴 Not Started] 0/4 steps
Phase 5: Component Optimization  [🔴 Not Started] 0/2 steps
Phase 6: Cleanup & Documentation [🔴 Not Started] 0/3 steps
```

**Total Progress:** 9/21 steps (43%)

---

## Phase 1: Shared Utilities Foundation
**Priority:** CRITICAL
**Risk:** Low (Creating new files, not modifying existing)
**Impact:** Fixes 15 duplication issues
**Time:** 45 minutes

### Why First?
Creating shared utilities is the foundation. Once these exist, we can safely replace duplicates throughout the codebase. Zero risk because we're only adding new files.

### Step 1.1: Create Time Utilities ✅ COMPLETE
**File:** `/src/lib/time-utils.ts`
**Fixes:** Issues #1, #2 (formatTime, parseTime duplications)
**Changes:** 0 files modified, 1 file created

**Implementation:**
```typescript
/**
 * Time Utilities
 *
 * Centralized time formatting and parsing functions
 */

export interface TimeFormatOptions {
  includeHours?: boolean
  includeMs?: boolean
}

/**
 * Convert seconds to time string (MM:SS or HH:MM:SS)
 * @param seconds - Time in seconds
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(seconds: number, options?: TimeFormatOptions): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)

  if (hrs > 0 || options?.includeHours) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  if (options?.includeMs) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse time string to seconds
 * @param timeStr - Time string (HH:MM:SS, MM:SS, or SS)
 * @returns Time in seconds
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return parseInt(timeStr) || 0
}

/**
 * Format date to localized string
 * @param date - Date to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date and time to localized string
 * @param date - Date to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

**Testing:**
```bash
npm run build  # Verify no errors
```

**Files impacted:** 0 (new file only)

---

### Step 1.2: Create Validation Utilities ✅ COMPLETE
**File:** `/src/lib/validation-utils.ts`
**Fixes:** Issues #4-15 (Email validation, normalization)
**Changes:** 0 files modified, 1 file created

**Implementation:**
```typescript
/**
 * Validation Utilities
 *
 * Centralized validation and normalization functions
 */

/**
 * Email validation regex (RFC 5322 simplified)
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

/**
 * Normalize email address (lowercase and trim)
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Validate and normalize email in one step
 * @param email - Email address
 * @returns Normalized email if valid, null if invalid
 */
export function validateAndNormalizeEmail(email: string): string | null {
  const normalized = normalizeEmail(email)
  return isValidEmail(normalized) ? normalized : null
}

/**
 * Extract error message from unknown error type
 * @param error - Error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

/**
 * Sanitize text input (remove HTML tags)
 * @param text - Input text
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, '')
}
```

**Testing:**
```bash
npm run build  # Verify no errors
```

**Files impacted:** 0 (new file only)

---

### Step 1.3: Create API Response Utilities ✅ COMPLETE
**File:** `/src/lib/api-response.ts`
**Fixes:** Issues #73-76 (Error response standardization)
**Changes:** 0 files modified, 1 file created

**Implementation:**
```typescript
/**
 * API Response Utilities
 *
 * Standardized API response helpers for consistent error/success handling
 */

import { NextResponse } from 'next/server'
import { getErrorMessage } from './validation-utils'

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Standard error response
 * @param error - Error object, string, or ApiError
 * @returns NextResponse with error
 */
export function errorResponse(error: unknown, defaultStatus = 500): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.code && { code: error.code })
      },
      { status: error.status }
    )
  }

  return NextResponse.json(
    { error: getErrorMessage(error) },
    { status: defaultStatus }
  )
}

/**
 * Standard success response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function successResponse<T = any>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Not found response (404)
 */
export function notFoundResponse(message = 'Not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

/**
 * Bad request response (400)
 */
export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Validation error response (400) with field details
 */
export function validationErrorResponse(errors: Record<string, string>): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      errors
    },
    { status: 400 }
  )
}
```

**Testing:**
```bash
npm run build  # Verify no errors
```

**Files impacted:** 0 (new file only)

---

### Step 1.4: Create Lib Index Export ✅ COMPLETE
**File:** `/src/lib/index.ts`
**Fixes:** Issue #66 (Missing index exports)
**Changes:** 0 files modified, 1 file created

**Implementation:**
```typescript
/**
 * Shared Library Index
 *
 * Centralized exports for all shared utilities
 */

// Time utilities
export {
  formatTime,
  parseTime,
  formatDate,
  formatDateTime,
  type TimeFormatOptions
} from './time-utils'

// Validation utilities
export {
  EMAIL_REGEX,
  isValidEmail,
  normalizeEmail,
  validateAndNormalizeEmail,
  getErrorMessage,
  sanitizeText
} from './validation-utils'

// API response utilities
export {
  ApiError,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse
} from './api-response'

// Existing utilities (re-export for convenience)
export * from './db'
export * from './email'
export * from './rate-limit'
export * from './auth/utils'
```

**Testing:**
```bash
npm run build  # Verify no errors
# Test import:
# import { formatTime, normalizeEmail, ApiError } from '@/lib'
```

**Files impacted:** 0 (new file only)

---

### Phase 1 Verification ✅ COMPLETE
```bash
npm run build  # ✅ PASSED
npm run dev    # ✅ RUNNING
# ✅ No TypeScript errors
```

**Deliverables:**
- ✅ 4 new utility files created
  - ✅ `/src/lib/time-utils.ts` - 85 lines
  - ✅ `/src/lib/validation-utils.ts` - 65 lines
  - ✅ `/src/lib/api-response.ts` - 107 lines
  - ✅ `/src/lib/index.ts` - 44 lines
- ✅ Build passes with no errors
- ✅ No existing code broken (nothing modified yet)
- ✅ Git committed: `feat: Phase 1 complete`

---

## Phase 2: Type Consolidation
**Priority:** CRITICAL
**Risk:** Medium (Requires updating imports in many files)
**Impact:** Fixes 17 type inconsistency issues
**Time:** 90 minutes

### Why Second?
Type definitions are the foundation for type safety. Once centralized, all components will use consistent interfaces. We create new types first, then gradually migrate files.

### Step 2.1: Create Webinar Types ✅ COMPLETE
**File:** `/src/types/webinar.ts`
**Fixes:** Issues #17-23 (Interaction type chaos)
**Changes:** 0 files modified, 1 file created

**What was created:**
- 155 lines of comprehensive type definitions
- `Interaction`, `InteractionOption`, `InteractionResponse` interfaces
- `Webinar`, `WebinarSession`, `WebinarWithRelations` interfaces
- `InteractionType` enum with type guards
- `WebinarAccessResult` for access checks

**Implementation:**
```typescript
/**
 * Webinar Type Definitions
 *
 * Centralized type definitions for all webinar-related data
 */

import type {
  WebinarInteractionType,
  WebinarInteractionPosition,
  SessionType
} from '@prisma/client'

// ============================================================================
// INTERACTION TYPES
// ============================================================================

/**
 * Full interaction model (matches database schema)
 * Used in: Admin editor, API routes with full data
 */
export interface WebinarInteraction {
  id: string
  webinarId: string
  type: WebinarInteractionType
  triggerTime: number
  duration: number | null
  title: string
  description: string | null
  config: Record<string, unknown>
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  position: WebinarInteractionPosition
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Interaction editor data (for creating/editing)
 * Used in: InteractionsEditor, InteractionsEditorFullScreen
 */
export interface InteractionEditorData {
  id?: string
  type: string
  triggerTime: number
  duration: number | null
  title: string
  description: string | null
  config: Record<string, unknown>
  pauseVideo: boolean
  required: boolean
  showOnReplay: boolean
  position: string
  enabled: boolean
}

/**
 * Interaction view data (minimal data sent to viewers)
 * Used in: WebinarRoom, ChatPanel, InteractionOverlay
 */
export interface InteractionViewData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: Record<string, unknown>
}

/**
 * Interaction analytics data (includes metrics)
 * Used in: VideoTimelineAnalytics, InteractionAnalytics
 */
export interface InteractionAnalytics extends InteractionViewData {
  viewCount: number
  actionCount: number
  engagementRate: number
  position: string
}

// ============================================================================
// REGISTRATION TYPES
// ============================================================================

/**
 * Full registration model (matches database)
 * Used in: Admin registration tables, API routes
 */
export interface WebinarRegistration {
  id: string
  webinarId: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  company: string | null
  customFields: Record<string, unknown> | null
  sessionId: string | null
  sessionType: SessionType | null
  registeredAt: Date
  source: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  contactId: string | null
}

/**
 * Registration form data (for creating registration)
 * Used in: Registration forms, API request body
 */
export interface RegistrationFormData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  customFields?: Record<string, unknown>
  sessionId?: string
  sessionType?: SessionType
  source?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

/**
 * Registration list item (for display in tables)
 * Used in: RegistrationsTable, UserProfileModal
 */
export interface RegistrationListItem {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  registeredAt: Date
  sessionType: SessionType | null
  watched: boolean
  completed: boolean
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Webinar session (scheduled time slot)
 * Used in: Schedule pages, session selection
 */
export interface WebinarSession {
  id: string
  webinarId: string
  scheduledAt: Date
  type: SessionType
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  registrationCount: number
  attendanceCount: number
}

/**
 * Session metrics (for analytics)
 * Used in: Analytics components, reports
 */
export interface SessionMetrics {
  sessionId: string
  scheduledAt: Date
  registrations: number
  attendees: number
  averageWatchTime: number
  completionRate: number
  engagementScore: number
}

// ============================================================================
// WEBINAR DATA TYPES
// ============================================================================

/**
 * Full webinar model (matches database)
 * Used in: Admin pages, full webinar data
 */
export interface Webinar {
  id: string
  title: string
  slug: string
  description: string | null
  hlsUrl: string | null
  videoDuration: number | null
  thumbnailUrl: string | null
  presenterName: string | null
  presenterTitle: string | null
  presenterBio: string | null
  presenterAvatar: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  timezone: string
  language: 'ka' | 'en'
  completionPercent: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Webinar editor data (subset for editing)
 * Used in: WebinarEditor components
 */
export interface WebinarEditorData {
  id?: string
  title: string
  slug: string
  description: string
  hlsUrl: string
  videoDuration: number
  thumbnailUrl: string
  presenterName: string
  presenterTitle: string
  presenterBio: string
  presenterAvatar: string
  customThankYouPageHtml: string
  timezone: string
  language: 'ka' | 'en'
  completionPercent: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  landingPagePath?: string
  thankYouPagePath?: string
  videoStatus?: string
}

/**
 * Webinar list item (for admin tables)
 * Used in: Webinar listings, admin dashboard
 */
export interface WebinarListItem {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  registrations: number
  completions: number
  createdAt: Date
}

// ============================================================================
// ACCESS & PLAYBACK TYPES
// ============================================================================

/**
 * Access data for watch page
 * Used in: WebinarRoom, watch page
 */
export interface WebinarAccessData {
  registrationId: string
  firstName: string | null
  lastName: string | null
  email: string
  sessionType: SessionType
}

/**
 * Playback configuration
 * Used in: WebinarPlayer, WebinarRoom
 */
export interface PlaybackConfig {
  mode: 'simulated_live' | 'on_demand' | 'replay'
  allowSeeking: boolean
  startPosition: number
  lastPosition: number
}

/**
 * End screen configuration
 * Used in: EndScreen component
 */
export interface EndScreenConfig {
  enabled: boolean
  title: string | null
  message: string | null
  buttonText: string | null
  buttonUrl: string | null
  redirectUrl: string | null
  redirectDelay: number | null
}
```

**Testing:**
```bash
npm run build  # Must pass
```

**Files impacted:** 0 (new file only)

---

### Step 2.2: Create Analytics Types ✅ COMPLETE
**File:** `/src/types/analytics.ts`
**Fixes:** Analytics type inconsistencies
**Changes:** 0 files modified, 1 file created

**What was created:**
- 180 lines of analytics type definitions
- Session event tracking types
- Engagement metrics interfaces
- Analytics filters and export types

---

### Step 2.3: Create Registration Types ✅ COMPLETE
**File:** `/src/types/registration.ts`
**Fixes:** Issues #24-28 (Registration interface chaos - 5 different versions)
**Changes:** 0 files modified, 1 file created

**What was created:**
- 180 lines of registration type definitions
- `Registration`, `RegistrationField`, `RegistrationFormData` interfaces
- `RegistrationStatus` enum with helper functions
- Type guards for registration state checks

---

### Step 2.4: Create Utility Types ✅ COMPLETE
**File:** `/src/types/utils.ts`
**Fixes:** Common utility type inconsistencies
**Changes:** 0 files modified, 1 file created

**What was created:**
- 280 lines of shared utility types
- Paginated response wrappers
- API response types
- Upload status types
- Generic utility types (DeepPartial, RequireFields, etc.)

---

### Step 2.5: Create Types Index Export ✅ COMPLETE
**File:** `/src/types/index.ts`
**Fixes:** Issue #67 (Missing types index)
**Changes:** 0 files modified, 1 file created

**What was created:**
- Centralized type exports from all type definition files
- Proper `export type` vs `export` separation
- Clean import path: `import { Interaction } from '@/types'`

---

### Phase 2 Verification ✅ COMPLETE
```bash
npm run build  # ✅ PASSED
```

**Deliverables:**
- ✅ 5 type definition files created (930 total lines)
  - ✅ `/src/types/webinar.ts` - 155 lines
  - ✅ `/src/types/analytics.ts` - 180 lines
  - ✅ `/src/types/registration.ts` - 180 lines
  - ✅ `/src/types/utils.ts` - 280 lines
  - ✅ `/src/types/index.ts` - 135 lines
- ✅ Centralized exports via index file
- ✅ Build passes with zero errors
- ✅ Ready for Phase 3 (migrating existing code to use these types)

---

## Phase 3: Duplicate Removal
**Priority:** HIGH
**Risk:** Low (replacing with tested utilities)
**Impact:** Fixes 3 duplication issues
**Time:** 45 minutes

### Why Third?
Now that shared utilities exist, we can safely replace duplicates. Low risk because utilities are already tested.

### Step 3.1: Replace formatTime() Duplicates ⚠️
**Files to modify:** 5
**Fixes:** Issue #1

**Files:**
1. `/src/app/admin/webinars/[id]/interactions/lib/timeUtils.ts` - Keep as wrapper
2. `/src/app/admin/webinars/[id]/interactions/utils.ts` - Remove duplicate
3. `/src/components/analytics/ChatAnalytics.tsx` - Replace with import
4. `/src/components/analytics/VideoTimelineAnalytics.tsx` - Replace with import
5. `/src/components/analytics/CohortAnalytics.tsx` - Replace with import

**Strategy:**
```typescript
// OLD (in each file):
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// NEW:
import { formatTime } from '@/lib'
```

**Special case** - `/src/app/admin/webinars/[id]/interactions/lib/timeUtils.ts`:
```typescript
// This file can re-export from @/lib for backward compatibility
export { formatTime, parseTime } from '@/lib'
```

**Testing:**
```bash
npm run build
# Test interactions editor
# Test analytics pages
```

---

### Step 3.2: Replace Email Validation Duplicates ⚠️
**Files to modify:** 4
**Fixes:** Issues #4-7

**Files:**
1. `/src/app/api/admin/campaigns/[id]/test-send/route.ts`
2. `/src/app/api/admin/contacts/import/route.ts`
3. `/src/app/api/contacts/capture/route.ts`
4. `/src/app/api/webinars/lib/registration.ts`

**Strategy:**
```typescript
// OLD:
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) { ... }

// NEW:
import { isValidEmail } from '@/lib'
if (!isValidEmail(email)) { ... }
```

**Testing:**
```bash
npm run build
# Test email validation in registration flow
```

---

### Step 3.3: Remove INTERACTION_TYPES Duplicate ⚠️
**Files to modify:** 1
**Fixes:** Issue #16

**File:** `/src/app/admin/webinars/[id]/interactions/InteractionsEditorFullScreen.tsx`

**Changes:**
```typescript
// OLD (lines 51-62):
const INTERACTION_TYPES = [
  // ... duplicate definition
]

// NEW:
import { INTERACTION_TYPES } from './lib/interactionTypes'
```

**Testing:**
```bash
npm run build
# Test InteractionsEditorFullScreen
```

---

### Phase 3 Verification
```bash
npm run build  # Must pass
# Grep to verify no duplicates remain:
grep -r "function formatTime" src/ --include="*.ts" --include="*.tsx"
# Should only find: @/lib/time-utils.ts and re-exports
```

**Deliverables:**
- ✅ 10 files updated to use shared utilities
- ✅ No duplicate formatTime() functions
- ✅ No duplicate email regex
- ✅ No duplicate INTERACTION_TYPES
- ✅ Build passes

---

## Phase 4: API Standardization
**Priority:** HIGH
**Risk:** Medium (touches API routes)
**Impact:** Fixes 8 API inconsistency issues
**Time:** 60 minutes

### Why Fourth?
API improvements are important but require careful testing. We do this after utilities are solid.

### Step 4.1: Standardize Error Responses (Sample Routes) ⚠️
**Files to modify:** 5 sample routes
**Fixes:** Issues #73-76

**Strategy:** Convert 5 routes as examples, then evaluate if we continue.

**Sample routes:**
1. `/src/app/api/webinars/[slug]/register/route.ts`
2. `/src/app/api/contacts/capture/route.ts`
3. `/src/app/api/admin/webinars/[id]/route.ts`
4. `/src/app/api/auth/register/route.ts`
5. `/src/app/api/testimonials/[id]/route.ts`

**Pattern:**
```typescript
// OLD:
try {
  // ... logic
} catch (error: any) {
  console.error(error)
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// NEW:
import { errorResponse, successResponse, badRequestResponse } from '@/lib'

try {
  // ... logic
  return successResponse({ data: result })
} catch (error) {
  return errorResponse(error)
}
```

**Testing:**
```bash
npm run build
# Test each converted route
curl -X POST http://localhost:3000/api/webinars/test/register
```

**Decision Point:** After 5 routes, evaluate:
- Did it improve code readability?
- Did it catch any bugs?
- Is it worth converting remaining 80+ routes?

If YES → Continue gradually
If NO → Keep as-is, focus on new routes only

---

### Step 4.2: Add Rate Limiting to Contact Capture ⚠️
**Files to modify:** 1
**Fixes:** Issue #78

**File:** `/src/app/api/contacts/capture/route.ts`

**Changes:**
```typescript
// Add at top:
import { ratelimit } from '@/lib/rate-limit'

// Add before processing:
const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
const { success } = await ratelimit.limit(ip)

if (!success) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  )
}
```

**Testing:**
```bash
# Test rate limiting works
for i in {1..15}; do curl -X POST http://localhost:3000/api/contacts/capture; done
# Should get 429 after ~10 requests
```

---

### Step 4.3: Add Validation Schema Example ⚠️
**Files to modify:** 1
**Fixes:** Issues #81-83 (partial)

**File:** `/src/lib/validations.ts`

**Add schemas:**
```typescript
export const contactCaptureSchema = z.object({
  email: emailSchema,
  source: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
})

export const webinarRegistrationSchema = z.object({
  email: emailSchema,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(200).optional(),
  sessionId: z.string().optional(),
  sessionType: z.enum(['SCHEDULED', 'JUST_IN_TIME', 'ON_DEMAND', 'REPLAY']).optional(),
})
```

**Testing:**
```bash
npm run build
# These are just additions, won't break anything
```

---

### Step 4.4: Clean Email Normalization (High Impact) ⚠️
**Files to modify:** ~10 high-value files
**Fixes:** Issues #8-15 (partial - target high-impact areas)

**Strategy:** Replace in API routes (not all 86 instances, just key ones)

**Target files:**
1. Contact import route
2. Webinar registration route
3. Auth routes
4. Campaign routes

**Pattern:**
```typescript
// OLD:
const email = body.email.toLowerCase().trim()

// NEW:
import { normalizeEmail } from '@/lib'
const email = normalizeEmail(body.email)
```

**Testing:** Build and test affected routes

**Note:** We won't fix all 86 instances. Focus on:
- API routes (data entry points)
- Skip: Frontend components, analytics (less critical)

---

### Phase 4 Verification
```bash
npm run build  # Must pass
# Test converted API routes
# Verify rate limiting works
```

**Deliverables:**
- ✅ 5 API routes using standardized responses
- ✅ Rate limiting added to contact capture
- ✅ Validation schemas available
- ✅ Email normalization in key routes
- ✅ Build passes

---

## Phase 5: Component Optimization
**Priority:** MEDIUM
**Risk:** HIGH (Large refactorings)
**Impact:** Fixes 3 efficiency issues
**Time:** 2-3 hours

### Why Fifth?
Large component refactorings are risky. Only tackle if previous phases went smoothly.

### Assessment Point ⚠️
**Before starting Phase 5, evaluate:**
- ✅ Are Phases 1-4 complete and stable?
- ✅ Is the codebase in a good state?
- ✅ Do we have time/energy for big refactors?

**If NO to any → Skip Phase 5, jump to Phase 6**

### Step 5.1: Extract InteractionsEditorFullScreen Components (OPTIONAL) 🔶
**Files to create:** 4-5
**Files to modify:** 1
**Fixes:** Issue #54
**Risk:** HIGH
**Time:** 90 minutes

**File:** `/src/app/admin/webinars/[id]/interactions/InteractionsEditorFullScreen.tsx` (1,003 lines)

**Proposed extraction:**
1. Create `/components/VideoPreviewPanel.tsx` (~200 lines)
2. Create `/components/InteractionsListPanel.tsx` (~150 lines)
3. Create `/components/InteractionFormPanel.tsx` (~250 lines)
4. Create `/components/ValidationPanel.tsx` (~100 lines)
5. Refactor main to orchestrate (~300 lines)

**Decision:** Only do if InteractionsEditorFullScreen is actively causing problems.

**Skip if:**
- Component works well currently
- Not frequently edited
- Team comfortable with current structure

---

### Step 5.2: Extract VideoTimelineAnalytics Components (OPTIONAL) 🔶
**Files to create:** 3-4
**Files to modify:** 1
**Fixes:** Issue #55
**Risk:** HIGH
**Time:** 90 minutes

**File:** `/src/components/analytics/VideoTimelineAnalytics.tsx` (781 lines)

**Decision:** Same as 5.1 - only if needed.

---

### Phase 5 Decision
**RECOMMENDED:** Skip Phase 5 for now. Reasons:
1. ✅ High risk, medium reward
2. ✅ Components work well as-is
3. ✅ Can revisit later if they become problematic
4. ✅ Focus on cleaning up, not more refactoring

**Alternative:** Create custom hooks (lower risk):
- Extract data fetching to `useWebinar(id)`
- Extract analytics to `useWebinarAnalytics(id)`
- Keep components as-is

---

## Phase 6: Cleanup & Documentation
**Priority:** LOW
**Risk:** Minimal
**Impact:** Improves code hygiene
**Time:** 30 minutes

### Step 6.1: Remove Backup Files ✅
**Files to delete:** 2
**Fixes:** Issues #63-64

```bash
# Delete backup files
rm src/app/admin/webinars/components/WebinarEditor.tsx.bak
rm src/app/admin/webinars/[id]/interactions/InteractionsEditor.tsx.bak

# Add to .gitignore
echo "*.bak" >> .gitignore
echo "*.backup" >> .gitignore
echo "*.old" >> .gitignore

# Commit cleanup
git add .gitignore
git commit -m "chore: remove backup files and update .gitignore"
```

---

### Step 6.2: Add Logger Utility (OPTIONAL) 🔶
**File to create:** `/src/lib/logger.ts`
**Fixes:** Issue #72 (partial)

**Implementation:**
```typescript
/**
 * Logger Utility
 *
 * Conditional logging based on environment
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },

  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },

  warn: (...args: unknown[]) => {
    console.warn(...args)
  },

  error: (...args: unknown[]) => {
    console.error(...args)
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args)
  }
}
```

**Decision:** Create file, but DON'T replace all console.logs (too risky, too many files).
- Use in new code going forward
- Leave existing console.logs alone

---

### Step 6.3: Update Documentation ✅
**File to update:** This file (`CODE_CONSOLIDATION_PLAN.md`)

**Add completion summary:**
```markdown
## Completion Summary

**Date Completed:** [DATE]
**Issues Resolved:** X/64
**Files Created:** X
**Files Modified:** X
**Files Deleted:** X

### What We Fixed
- ✅ Centralized time utilities
- ✅ Centralized validation utilities
- ✅ Standardized API responses
- ✅ Consolidated type definitions
- ✅ Removed duplicates
- ✅ Improved code organization

### What We Skipped (Intentionally)
- ⏭️ Large component refactorings (Phase 5) - Not worth the risk
- ⏭️ Replacing all 86 email normalizations - Fixed key areas only
- ⏭️ Converting all 80+ API routes - Sample conversions prove pattern

### Metrics
- Build time: [BEFORE] → [AFTER]
- TypeScript errors: [BEFORE] → [AFTER]
- Code duplication: [HIGH] → [LOW]
- Type safety: [MEDIUM] → [HIGH]

### Next Steps (Future)
1. Use new utilities in all new code
2. Consider Phase 5 if components become problematic
3. Gradually migrate remaining API routes to new patterns
4. Monitor for new duplications
```

---

## Risk Mitigation Strategy

### Before Each Phase
```bash
# 1. Commit current state
git add .
git commit -m "chore: pre-phase-X checkpoint"

# 2. Create backup branch
git branch backup-phase-X

# 3. Run tests
npm run build
npm run dev
```

### During Each Step
```bash
# After each file change:
npm run build

# If build fails:
git checkout -- path/to/file
# Fix issue, try again
```

### After Each Phase
```bash
# 1. Verify build
npm run build

# 2. Test in browser
npm run dev
# Manually test affected features

# 3. Commit progress
git add .
git commit -m "feat: complete phase X - [description]"

# 4. If anything breaks:
git reset --hard backup-phase-X
# Review what went wrong
```

---

## Success Criteria

### Phase 1 Success
- ✅ 4 new utility files exist
- ✅ `npm run build` passes
- ✅ Can import from `@/lib`
- ✅ Zero breaking changes

### Phase 2 Success
- ✅ Types centralized in `/src/types/`
- ✅ TypeScript errors resolved
- ✅ Interactions work correctly
- ✅ Watch page works correctly

### Phase 3 Success
- ✅ No duplicate formatTime() functions
- ✅ No duplicate email validation
- ✅ No duplicate constants
- ✅ All features still work

### Phase 4 Success
- ✅ Sample API routes use standard responses
- ✅ Rate limiting works
- ✅ Key routes use normalizeEmail()
- ✅ Build passes

### Phase 5 Success (If Attempted)
- ✅ Components work identically
- ✅ All tests pass
- ✅ File sizes reduced
- ✅ No regressions

### Phase 6 Success
- ✅ Backup files removed
- ✅ Logger utility available
- ✅ Documentation updated
- ✅ Clean git history

---

## Emergency Rollback

If at any point things break badly:

```bash
# 1. Stop immediately
# 2. Check which phase backup to use
git branch -a | grep backup

# 3. Rollback to last good state
git reset --hard backup-phase-X

# 4. Verify everything works
npm run build
npm run dev

# 5. Identify what went wrong
# 6. Fix in smaller steps
# 7. Continue
```

---

## Final Checklist

Before marking complete:

- [ ] All Phase 1 steps completed
- [ ] All Phase 2 steps completed
- [ ] All Phase 3 steps completed
- [ ] All Phase 4 steps completed
- [ ] Phase 5 evaluated (skip or complete)
- [ ] Phase 6 completed
- [ ] Build passes: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Key features tested manually
- [ ] Git history clean
- [ ] Documentation updated
- [ ] Team informed of changes

---

## Lessons Learned

(To be filled in after completion)

### What Went Well
-

### What Was Challenging
-

### What We'd Do Differently
-

### Recommendations for Future
-

---

**Status:** Ready to begin Phase 1
**Next Step:** Execute Phase 1, Step 1.1
