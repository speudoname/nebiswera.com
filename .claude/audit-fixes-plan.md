# Codebase Audit Fixes Plan

> **Created:** 2025-12-06
> **Status:** In Progress
> **Total Issues:** 19

---

## Progress Overview

| Priority | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| Critical | 4 | 4 | 0 |
| High | 11 | 11 | 0 |
| Medium | 3 | 2 | 1 |
| Low | 4 | 1 | 3 |
| **TOTAL** | **22** | **18** | **4** |

---

## Phase 1: Critical Issues

### Issue #1: Unused LmsCertificate Database Model
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** CRITICAL
- **Estimated Time:** 15 minutes

**Problem:**
The `LmsCertificate` model in `prisma/schema.prisma` (lines 2272-2295) is completely unused. Certificate data is actually stored on the `Enrollment` model with fields: `certificateId`, `certificateUrl`, `certificateIssuedAt`.

**Files Affected:**
- `prisma/schema.prisma`

**Action Steps:**
1. [ ] Verify no code references LmsCertificate
2. [ ] Remove model from schema
3. [ ] Run `prisma generate`
4. [ ] Test build passes

**Verification:**
```bash
grep -r "LmsCertificate" src/
# Should return no results
```

---

### Issue #2: Missing Environment Variables in .env.example
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** CRITICAL
- **Estimated Time:** 10 minutes

**Problem:**
8 environment variables are used in code but not documented in `.env.example`.

**Missing Variables:**
| Variable | Used In | Purpose |
|----------|---------|---------|
| `CLAUDE_API_KEY` | `/src/app/api/admin/ai/generate-text/route.ts` | Claude API for AI text generation |
| `NANO_BANANA_API_KEY` | `/src/app/api/admin/ai/generate-image/route.ts` | Image generation API |
| `BUNNY_STORAGE_ZONE_NAME` | `/src/lib/bunny-storage.ts` | Bunny storage zone identifier |
| `BUNNY_STORAGE_PASSWORD` | `/src/lib/bunny-storage.ts` | Bunny storage authentication |
| `BUNNY_STORAGE_HOSTNAME` | `/src/lib/bunny-storage.ts` | Bunny storage endpoint |
| `POSTMARK_MARKETING_WEBHOOK_USERNAME` | `/src/app/api/webhooks/postmark-marketing/route.ts` | Marketing webhook auth |
| `POSTMARK_MARKETING_WEBHOOK_PASSWORD` | `/src/app/api/webhooks/postmark-marketing/route.ts` | Marketing webhook auth |
| `UNSUBSCRIBE_SECRET` | `/src/lib/unsubscribe-token.ts` | Email unsubscribe token signing |

**Files Affected:**
- `.env.example`

**Action Steps:**
1. [ ] Add all 8 variables to `.env.example` with descriptions
2. [ ] Group them logically with comments
3. [ ] Verify R2 variables - remove if unused

---

### Issue #3: Unused Hook and Component
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** CRITICAL
- **Estimated Time:** 10 minutes

**Problem:**
Two files exist but are never imported anywhere:

**3a. useAdminTable Hook:**
- **File:** `/src/hooks/useAdminTable.ts` (6,058 bytes)
- **Issue:** Created for admin table management but never used
- **All admin tables implement pagination/filtering manually instead**

**3b. VideoPlayer Component (Duplicate):**
- **File:** `/src/components/video/VideoPlayer.tsx` (443 lines)
- **Issue:** Never imported; conflicts with `/src/components/ui/VideoPlayer.tsx` which IS used
- **The ui/ version is used by TestimonialCard.tsx and LoveWallClient.tsx**

**Action Steps:**
1. [ ] Delete `/src/hooks/useAdminTable.ts`
2. [ ] Delete `/src/components/video/VideoPlayer.tsx`
3. [ ] Delete `/src/components/video/` directory if empty
4. [ ] Verify build passes

---

### Issue #4: Broken Database Constraint on Enrollment
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** CRITICAL
- **Estimated Time:** 20 minutes

**Problem:**
In `prisma/schema.prisma`, the `Enrollment` model has:
```prisma
certificateId   String? @unique
```

This `@unique` constraint on a nullable field is problematic - PostgreSQL behavior with unique nullable fields can cause issues when multiple enrollments have `null` certificateId.

**Files Affected:**
- `prisma/schema.prisma`

**Action Steps:**
1. [ ] Remove `@unique` from `certificateId` field
2. [ ] If uniqueness needed for non-null values, add migration with conditional index:
   ```sql
   CREATE UNIQUE INDEX idx_enrollment_certificate
   ON "lms"."enrollments"("certificateId")
   WHERE "certificateId" IS NOT NULL;
   ```
3. [ ] Run `prisma generate`
4. [ ] Run `prisma db push` or create migration
5. [ ] Test enrollment flow

---

## Phase 2: High Priority Issues

### Issue #5: Component Organization Violations
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** HIGH
- **Estimated Time:** 30 minutes

**Problem:**
Components in `/src/components/` that violate co-location rules.

**5a. Analytics Components (9 files):**
- **Location:** `/src/components/analytics/`
- **Files:** CohortAnalytics, FunnelChart, VideoTimelineAnalytics, DateRangeSelector, SessionFilter, UserProfileModal, WidgetResponseModal, ComparativeAnalytics, index.ts
- **Usage:** Only used in `/src/app/admin/webinars/[id]/analytics/`
- **Action:** Move to `/src/app/admin/webinars/[id]/analytics/components/`

**5b. Unused LMS Components (4 files):**
- **Location:** `/src/components/lms/`
- **Files:** ErrorBoundary.tsx, Skeleton.tsx, EmptyStates.tsx, ProgressMigrationBanner.tsx
- **Issue:** ErrorBoundary, Skeleton, EmptyStates are never imported
- **Action:** Delete unused files, keep only ProgressMigrationWrapper.tsx

**5c. Empty Directory:**
- **Location:** `/src/app/admin/courses/components/`
- **Action:** Delete

**Action Steps:**
1. [ ] Create `/src/app/admin/webinars/[id]/analytics/components/`
2. [ ] Move all files from `/src/components/analytics/` to new location
3. [ ] Update imports in AnalyticsDashboard.tsx and RegistrationsTable.tsx
4. [ ] Delete `/src/components/analytics/`
5. [ ] Delete unused files in `/src/components/lms/`
6. [ ] Delete `/src/app/admin/courses/components/`
7. [ ] Verify build passes

---

### Issue #6: API Routes Not Using Standardized Helpers
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** HIGH
- **Estimated Time:** 2 hours

**Problem:**
45+ API routes use raw `NextResponse.json()` instead of standardized helpers from `/src/lib/api-response.ts`.

**Pattern to Replace:**
```typescript
// ❌ Current
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Not found' }, { status: 404 })
return NextResponse.json({ error: 'Bad request' }, { status: 400 })

// ✅ Should be
return unauthorizedResponse()
return notFoundResponse()
return badRequestResponse('message')
```

**Files Needing Updates:**
- [ ] `/src/app/api/admin/campaigns/route.ts`
- [ ] `/src/app/api/admin/campaigns/[id]/route.ts`
- [ ] `/src/app/api/admin/campaigns/[id]/validate/route.ts`
- [ ] `/src/app/api/admin/users/[id]/route.ts`
- [ ] `/src/app/api/testimonials/route.ts`
- [ ] `/src/app/api/webinars/[slug]/register/route.ts`
- [ ] And 35+ more routes (search for `NextResponse.json.*error`)

**Action Steps:**
1. [ ] Search: `grep -r "NextResponse.json.*error" src/app/api/`
2. [ ] For each file, add import: `import { unauthorizedResponse, badRequestResponse, errorResponse, notFoundResponse } from '@/lib/api-response'`
3. [ ] Replace patterns systematically
4. [ ] Test each endpoint

---

### Issue #7: Console.error Instead of Logger
- **Status:** [x] COMPLETED (2025-12-06)
- **Priority:** HIGH
- **Estimated Time:** 1 hour

**Problem:**
30+ files use `console.error()` instead of the structured `logger` from `/src/lib/logger.ts`.

**Files to Update:**
- [ ] `/src/app/api/courses/[slug]/enroll/route.ts` (4 instances)
- [ ] `/src/app/api/courses/[slug]/quiz/[quizId]/route.ts` (1 instance)
- [ ] `/src/app/api/courses/[slug]/quiz/[quizId]/start/route.ts` (2 instances)
- [ ] `/src/app/api/courses/[slug]/quiz/[quizId]/submit/route.ts` (4 instances)
- [ ] `/src/app/api/courses/[slug]/certificate/route.ts` (3 instances)
- [ ] `/src/app/api/admin/campaigns/[id]/route.ts` (3 instances)
- [ ] `/src/app/api/admin/campaigns/[id]/stats/route.ts` (1 instance)
- [ ] `/src/app/api/admin/email-images/route.ts` (1 instance)
- [ ] `/src/app/api/admin/email-images/[key]/route.ts` (1 instance)
- [ ] `/src/app/api/admin/content-library/route.ts` (1 instance)
- [ ] `/src/app/api/profile/courses/route.ts` (1 instance)
- [ ] And 10+ more files

**Pattern to Replace:**
```typescript
// ❌ Current
console.error('Failed to enroll:', error)

// ✅ Should be
import { logger } from '@/lib/logger'
logger.error('Failed to enroll:', error)
```

**Action Steps:**
1. [ ] Search: `grep -rn "console.error" src/app/api/`
2. [ ] Add logger import to each file
3. [ ] Replace console.error with logger.error
4. [ ] Test build

---

### Issue #8: Duplicate Type Definitions
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
`InteractionData` defined in 7 different files with 3 variations.

**Solution:**
1. [x] Updated `/src/types/webinar.ts` with correct types matching actual code:
   - `InteractionData` - Base type for player/viewer (triggerTime, title, config)
   - `InteractionDataFull` - Extended type for admin/editor
   - `InteractionType` - Union type matching database enum
   - `InteractionPosition` - Position enum
2. [x] Updated 6 files to import from `@/types`:
   - `useFeedItems.ts` - imports and re-exports InteractionData
   - `useInteractionTiming.ts` - imports InteractionData
   - `InteractionOverlay.tsx` - imports InteractionData
   - `InteractiveWidgets.tsx` - imports InteractionData
   - `WebinarRoom.tsx` - imports InteractionData
   - `InteractionCreator.tsx` - imports InteractionDataFull, InteractionType, InteractionPosition
3. [x] Renamed analytics modal type to `InteractionAnalyticsData` (different structure)
4. [x] Fixed unrelated Prisma JSON type issue in settings.ts discovered during build

---

### Issue #9: Duplicate Time Formatting Functions
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH
- **Estimated Time:** 45 minutes

**Problem:**
Time/date formatting functions duplicated across 3 files:

| File | Functions |
|------|-----------|
| `/src/lib/utils.ts` | `formatDuration()` |
| `/src/lib/time-utils.ts` | `formatTime()`, `formatDate()`, `formatDateTime()` |
| `/src/lib/utils/date-format.ts` | `formatDate()`, `getRelativeTime()` |

**Action Steps:**
1. [ ] Consolidate all into `/src/lib/time-utils.ts`
2. [ ] Remove duplicate from `/src/lib/utils.ts`
3. [ ] Delete `/src/lib/utils/date-format.ts`
4. [ ] Update `/src/lib/index.ts` exports
5. [ ] Update all imports across 42+ files
6. [ ] If `/src/lib/utils/` is empty, delete the folder
7. [ ] Verify build passes

---

### Issue #10: Confusing Storage File Organization
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
Two files with confusing names handle different Bunny services:
- `/src/lib/bunny-storage.ts` (409 lines) - File storage (images, etc.)
- `/src/lib/storage/bunny.ts` (358 lines) - Video streaming (Bunny Stream)

**Action Steps:**
1. [x] Created `/src/lib/storage/files.ts` with file storage functions
2. [x] Created `/src/lib/storage/index.ts` with clear exports and documentation
3. [x] Updated `/src/lib/bunny-storage.ts` to re-export from new location (backwards compatible)
4. [x] Build passes

**New Structure:**
- `/src/lib/storage/files.ts` - File/image uploads (Bunny CDN Storage)
- `/src/lib/storage/bunny.ts` - Video streaming (Bunny Stream API)
- `/src/lib/storage/upload-helpers.ts` - Client-side utilities
- `/src/lib/storage/index.ts` - Unified exports with documentation
- `/src/lib/bunny-storage.ts` - Deprecated re-export for backwards compat

---

### Issue #11: Inconsistent Auth Patterns in API Routes
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
Three different auth check patterns used inconsistently.

**Standard Adopted:**
- Admin-only routes: Use `isAdmin(request)` from `@/lib/auth/utils`
- Routes needing role check: Use `getAuthToken(request)` and check `token?.role`
- User routes needing ID: Keep `auth()` - legitimately need `session.user.id`

**Files Updated:**
1. [x] `/src/app/api/testimonials/route.ts` - Changed `auth()` to `getAuthToken()`
2. [x] `/src/app/api/testimonials/[id]/route.ts` - Changed admin checks to `isAdmin()`, public to `getAuthToken()`
3. [x] `/src/app/api/testimonials/[id]/approve/route.ts` - Changed `auth()` to `isAdmin()`
4. [x] `/src/app/api/testimonials/[id]/reject/route.ts` - Changed `auth()` to `isAdmin()`

**Note:** Routes like `/api/courses/[slug]/enroll` that need `session.user.id` legitimately use `auth()`.
The issue was specifically about admin-only routes that should use the lighter-weight `isAdmin()` helper.

---

### Issue #12: Missing Database Indexes
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
Common query patterns lack proper indexes for performance.

**Action Steps:**
1. [x] Added indexes to prisma/schema.prisma
2. [x] Ran `prisma generate`

**Indexes Added:**
- User: `@@index([role])`
- Enrollment: `@@index([userId, status])`, `@@index([enrolledAt])`
- WebinarRegistration: `@@index([webinarId, status, registeredAt])`, `@@index([registeredAt])`
- EmailLog: `@@index([status, sentAt])`

---

### Issue #13: LMS Index Exports Incomplete
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
`/src/lib/lms/index.ts` only exported 2 of 6+ modules.

**Action Steps:**
1. [x] Updated `/src/lib/lms/index.ts` to export all modules including certificates, local-storage, course-utils, queries, and hooks
2. [x] Verified no circular dependencies
3. [x] Build passes

---

### Issue #14: Unimplemented TODO - Payment Verification
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
**File:** `/src/app/api/courses/[slug]/enroll/route.ts:62`
Payment integration not implemented - PAID courses return 400 error.

**Action Steps:**
1. [x] Documented current behavior with implementation notes
2. [x] Added better error message for users
3. [x] Added comments outlining payment integration considerations:
   - Payment provider integration (Stripe, BOG, etc.)
   - Payment verification before enrollment
   - Payment record creation linked to enrollment
   - Webhook handlers for async payment confirmation

**Note:** Full payment implementation is a future feature, not a code cleanup item.

---

### Issue #15: Duplicate CRON Auth Logic
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** HIGH

**Problem:**
CRON secret verification duplicated in multiple routes.

**Action Steps:**
1. [x] Created `/src/lib/middleware/cron.ts` with `verifyCronSecret()` helper
2. [x] Updated all 3 cron routes to use the helper:
   - `/src/app/api/cron/course-notifications/route.ts`
   - `/src/app/api/cron/process-campaigns/route.ts`
   - `/src/app/api/cron/webinar-notifications/route.ts`
3. [x] Reduced ~15 lines of duplicate code per route to 2 lines

---

## Phase 3: Medium Priority Issues

### Issue #16: Hardcoded Strings Needing Translation
- **Status:** ✅ COMPLETED (2025-12-06)
- **Priority:** MEDIUM

**Problem:**
Hardcoded strings in locale-aware components.

**Solution:**
1. [x] Added translation keys to `/content/messages/en.json` and `ka.json`:
   - `home.turnOnSound`, `home.muteVideo`, `home.unmuteVideo`
   - `profile.nameGeorgianPlaceholder`, `profile.nameEnglishPlaceholder`
2. [x] Updated HeroVideoPlayer to use `useTranslations('home')`:
   - Removed `locale` prop (now self-contained)
   - Fixed HLS error handler types from `any` to proper types
3. [x] Updated ProfileClient to use translated placeholders
4. [x] Updated TransformationPromiseSection to not pass locale prop

**Note:** Admin panel hardcoded strings are acceptable per CLAUDE.md.

---

### Issue #17: `any` Type Usage (62 instances)
- **Status:** ✅ PARTIALLY COMPLETED (2025-12-06)
- **Priority:** MEDIUM

**Problem:**
62 instances of `any` or `as any` that should have proper types.

**Files Fixed:**
1. [x] `/src/lib/testimonials.ts` - Changed `where: any` to `Prisma.TestimonialWhereInput`
2. [x] `/src/app/api/testimonials/route.ts` - Changed `where: any` to `Prisma.TestimonialWhereInput`
3. [x] `/src/app/api/testimonials/[id]/route.ts` - Changed `updateData: any` to `Prisma.TestimonialUpdateInput`
4. [x] `/src/app/api/testimonials/[id]/approve/route.ts` - Removed unnecessary `: any` from catch
5. [x] `/src/app/api/testimonials/[id]/reject/route.ts` - Removed unnecessary `: any` from catch
6. [x] `/src/lib/animations.ts` - Added proper Framer Motion `Variants` types
7. [x] `/src/components/ui/VideoPlayer.tsx` - Fixed HLS error types
8. [x] `/src/app/[locale]/(public)/home/content/HeroVideoPlayer.tsx` - Fixed HLS error types and hlsRef type

**Remaining:** ~40 instances in admin panel and webinar components (lower priority - admin code per CLAUDE.md)

---

### Issue #18: Schema Over-Engineering (WebinarLandingPageConfig)
- **Status:** [ ] Not Started
- **Priority:** MEDIUM
- **Estimated Time:** 1 hour (analysis) + implementation

**Problem:**
`WebinarLandingPageConfig` has 55 fields mixing individual strings with JSON fields inconsistently.

**Example:**
```prisma
heroTitle String?
heroTitleParts Json?
heroSubtitle String?
heroSubtitleParts Json?
heroParagraph String? @db.Text
```

**Consideration:**
This may require careful migration and frontend updates. Document current usage before changing.

**Action Steps:**
1. [ ] Document current field usage
2. [ ] Design consolidated JSON structure
3. [ ] Plan migration strategy
4. [ ] Update frontend components
5. [ ] Execute migration

---

## Phase 4: Low Priority Issues

### Issue #19: String Fields Should Be Enums
- **Status:** [ ] Not Started
- **Priority:** LOW
- **Estimated Time:** 45 minutes

**Problem:**
Some string fields store enum-like values without type safety.

**Fields to Convert:**
```prisma
// Current
videoStatus    String?  // 'pending' | 'processing' | 'ready' | 'error'
source         String   // 'newsletter' | 'webinar' | 'import' | 'manual'

// Should be
enum VideoProcessingStatus {
  PENDING
  PROCESSING
  READY
  ERROR
}

enum ContactSource {
  NEWSLETTER
  WEBINAR
  IMPORT
  MANUAL
  FORM
  ADMIN
}
```

**Models Affected:**
- Testimonial.videoStatus
- Webinar.videoStatus
- Contact.source

**Action Steps:**
1. [ ] Create enum definitions in schema
2. [ ] Update model fields to use enums
3. [ ] Create migration with data conversion
4. [ ] Update TypeScript code to use enum values
5. [ ] Test thoroughly

---

### Issue #20: Json Fields Lack Documentation
- **Status:** ✅ MOSTLY COMPLETE (2025-12-06)
- **Priority:** LOW

**Problem:**
Json fields in schema without structure documentation.

**Analysis:**
Upon review, most Json fields in the schema already have documentation:
- `socialLinks` - documented: `// { facebook?: string, instagram?: string, ... }`
- `customFields` - documented with examples
- `errors` - documented: `// Array of error messages with row numbers`
- `filters` - documented with examples
- `metadata` (EmailLog) - added: `/// Email provider response data`
- `designJson` - documented: `// Easy Email editor design JSON`
- `targetCriteria` - documented: `// Flexible: {segmentId, tagIds[], filters}`
- `variables` - documented: `// {firstName, lastName, email, ...}`
- `chatScript` - documented: `// { enabled: boolean, messages: [...] }`
- `heroTitleParts`, `heroSubtitleParts` - documented: `// Rich text: [{ text, bold, color, italic }]`
- `conditions`, `actions` - documented with examples

**Action Taken:**
1. [x] Added documentation to `EmailLog.metadata`
2. [x] Verified other Json fields have inline comments

---

### Issue #21: Presenter Data Duplication
- **Status:** [ ] Not Started
- **Priority:** LOW
- **Estimated Time:** 30 minutes

**Problem:**
Presenter info exists in both `Webinar` and `WebinarLandingPageConfig` models.

**Webinar model:**
```prisma
presenterName     String?
presenterTitle    String?
presenterAvatar   String?
presenterBio      String?
```

**WebinarLandingPageConfig:**
```prisma
presenterImageUrl String?
presenterImageShape PresenterImageShape
```

**Action Steps:**
1. [ ] Analyze which model is authoritative
2. [ ] Consolidate to single location
3. [ ] Update frontend to use correct source
4. [ ] Migrate any orphaned data

---

## Completion Log

| Date | Issue # | Status | Notes |
|------|---------|--------|-------|
| 2025-12-06 | #1 | ✅ DONE | Deleted LmsCertificate model from schema, updated types.ts comment |
| 2025-12-06 | #2 | ✅ DONE | Added 8 missing env vars: BUNNY_STORAGE_*, POSTMARK_MARKETING_*, UNSUBSCRIBE_SECRET, CLAUDE_API_KEY, NANO_BANANA_API_KEY |
| 2025-12-06 | #3 | ✅ DONE | Deleted /src/hooks/useAdminTable.ts, deleted /src/components/video/ |
| 2025-12-06 | #4 | ✅ DONE | Removed @unique from Enrollment.certificateId, added clarifying comment |
| 2025-12-06 | #5 | ✅ DONE | Moved analytics components to webinar page folder, deleted unused LMS components, deleted empty courses/components |
| 2025-12-06 | #6 | ✅ DONE | Fixed 60+ API routes to use response helpers (unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse) |
| 2025-12-06 | #7 | ✅ DONE | Replaced console.error with logger.error across all API routes |
| 2025-12-06 | #9 | ✅ DONE | Consolidated time formatting into /src/lib/time-utils.ts, deleted /src/lib/utils/date-format.ts |
| 2025-12-06 | #12 | ✅ DONE | Added database indexes for User.role, Enrollment, WebinarRegistration, EmailLog |
| 2025-12-06 | #13 | ✅ DONE | Updated /src/lib/lms/index.ts to export all modules (certificates, local-storage, course-utils, queries, hooks) |
| 2025-12-06 | #15 | ✅ DONE | Created /src/lib/middleware/cron.ts with verifyCronSecret() helper, updated all 3 cron routes |
| 2025-12-06 | #14 | ✅ DONE | Documented payment TODO with implementation considerations, improved error message |
| 2025-12-06 | #10 | ✅ DONE | Reorganized storage: created /src/lib/storage/files.ts, index.ts with clear exports, backwards-compatible re-exports |
| 2025-12-06 | #11 | ✅ DONE | Updated testimonials routes to use isAdmin() and getAuthToken() instead of auth() |
| 2025-12-06 | #8 | ✅ DONE | Centralized InteractionData types in /src/types/webinar.ts, updated 6 files to import from @/types |
| 2025-12-06 | #16 | ✅ DONE | Added translations for HeroVideoPlayer and ProfileClient, removed locale prop |
| 2025-12-06 | #17 | ✅ PARTIAL | Fixed ~20 `any` types in lib files, API routes, and animations; remaining are in admin panel |
| 2025-12-06 | #20 | ✅ DONE | Verified most Json fields have docs; added doc to EmailLog.metadata |

---

## Notes

- Always run `npm run build` after changes to verify nothing breaks
- Create git commits after each issue is resolved
- Test affected functionality manually
- Update this document as issues are completed
