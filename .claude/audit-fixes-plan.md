# Codebase Audit Fixes Plan

> **Created:** 2025-12-06
> **Status:** In Progress
> **Total Issues:** 19

---

## Progress Overview

| Priority | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| Critical | 4 | 4 | 0 |
| High | 11 | 1 | 10 |
| Medium | 8 | 0 | 8 |
| Low | 4 | 0 | 4 |
| **TOTAL** | **27** | **5** | **22** |

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
- **Status:** [ ] Not Started
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
- **Status:** [ ] Not Started
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
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** 1 hour

**Problem:**
Same types defined in multiple files instead of centralized location.

**8a. InteractionData (6 locations):**
- `/src/app/[locale]/webinar/[slug]/watch/hooks/useFeedItems.ts`
- `/src/app/[locale]/webinar/[slug]/watch/hooks/useInteractionTiming.ts`
- `/src/app/[locale]/webinar/[slug]/watch/components/InteractionOverlay.tsx`
- `/src/app/[locale]/webinar/[slug]/watch/components/InteractiveWidgets.tsx`
- `/src/app/[locale]/webinar/[slug]/watch/components/WebinarRoom.tsx`
- `/src/app/admin/webinars/components/timeline/InteractionCreator.tsx`

**8b. WebinarData (5 locations):**
- `/src/app/[locale]/webinar/[slug]/watch/components/WebinarRoom.tsx`
- `/src/app/[locale]/webinar/[slug]/templates/types.ts`
- `/src/app/admin/webinars/components/tabs/VideoTab.tsx`
- `/src/app/admin/webinars/components/tabs/BasicInfoTab.tsx`
- `/src/app/admin/webinars/components/WebinarEditor.tsx`

**8c. TestimonialType/Status (3 locations):**
- `/src/lib/testimonials.ts`
- `/src/app/[locale]/(public)/home/content/TestimonialShowcase.tsx`
- `/src/app/admin/testimonials/TestimonialsTable.tsx`

**8d. Status Enums (5+ locations):**
CourseStatus, EnrollmentStatus, WebinarStatus, CampaignStatus redefined locally instead of importing from `@prisma/client`.

**Action Steps:**
1. [ ] Create `/src/types/interaction.ts` with InteractionData type
2. [ ] Create `/src/types/webinar-data.ts` with WebinarData type
3. [ ] Create `/src/types/testimonial.ts` with TestimonialType, TestimonialStatus
4. [ ] Update `/src/types/index.ts` to export all new types
5. [ ] Update all files to import from centralized location
6. [ ] Replace local enum definitions with imports from `@prisma/client`
7. [ ] Verify build passes

---

### Issue #9: Duplicate Time Formatting Functions
- **Status:** [ ] Not Started
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
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** 30 minutes

**Problem:**
Two files with confusing names handle different Bunny services:
- `/src/lib/bunny-storage.ts` (409 lines) - File storage (images, etc.)
- `/src/lib/storage/bunny.ts` (358 lines) - Video streaming (Bunny Stream)

**Action Steps:**
1. [ ] Move `/src/lib/bunny-storage.ts` → `/src/lib/storage/storage.ts`
2. [ ] Update all 13 imports that use bunny-storage
3. [ ] Create/update `/src/lib/storage/index.ts` with clear exports
4. [ ] Update `/src/lib/index.ts` if needed
5. [ ] Verify build passes

---

### Issue #11: Inconsistent Auth Patterns in API Routes
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** 1 hour

**Problem:**
Three different auth check patterns used inconsistently:

```typescript
// Pattern A - isAdmin helper (preferred for admin routes)
if (!(await isAdmin(request))) return unauthorizedResponse()

// Pattern B - getAuthToken (preferred for user routes)
const token = await getAuthToken(request)
if (!token?.email) return unauthorizedResponse()

// Pattern C - auth() session (avoid - more overhead)
const session = await auth()
if (session?.user?.role !== 'ADMIN') return NextResponse.json(...)
```

**Standard to Adopt:**
- Admin routes: Use `isAdmin(request)` + `unauthorizedResponse()`
- User routes: Use `getAuthToken(request)` + `unauthorizedResponse()`
- Never use Pattern C in API routes

**Files Needing Updates:**
- [ ] `/src/app/api/admin/campaigns/[id]/route.ts` - Uses raw NextResponse
- [ ] `/src/app/api/admin/users/[id]/route.ts` - Mixes patterns
- [ ] `/src/app/api/testimonials/route.ts` - Uses auth() session
- [ ] Search for other inconsistencies

**Action Steps:**
1. [ ] Audit all admin routes for auth pattern
2. [ ] Standardize on isAdmin() for admin routes
3. [ ] Standardize on getAuthToken() for user routes
4. [ ] Remove auth() usage in API routes
5. [ ] Test each endpoint

---

### Issue #12: Missing Database Indexes
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** 20 minutes

**Problem:**
Common query patterns lack proper indexes for performance.

**Indexes to Add:**

```prisma
// User model
@@index([role])

// Enrollment model
@@index([userId, status])
@@index([enrolledAt])

// WebinarRegistration model
@@index([webinarId, status, registeredAt])

// EmailLog model
@@index([status, sentAt])

// ContactActivity model
@@index([type])

// CampaignLinkClick model
@@index([createdAt])
```

**Action Steps:**
1. [ ] Add indexes to prisma/schema.prisma
2. [ ] Run `prisma generate`
3. [ ] Run `prisma db push` or create migration
4. [ ] Verify indexes created in database

---

### Issue #13: LMS Index Exports Incomplete
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** 15 minutes

**Problem:**
`/src/lib/lms/index.ts` only exports 2 of 6 modules.

**Current:**
```typescript
export * from './types'
export * from './progress'
```

**Missing:**
- `certificates.ts`
- `local-storage.ts`
- `course-utils.ts`
- `queries.ts`

**Action Steps:**
1. [ ] Update `/src/lib/lms/index.ts` to export all modules
2. [ ] Verify no circular dependencies
3. [ ] Update imports if beneficial

---

### Issue #14: Unimplemented TODO - Payment Verification
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** Varies (document for now)

**Problem:**
**File:** `/src/app/api/courses/[slug]/enroll/route.ts:62`
```typescript
// TODO: Implement payment verification
```

Currently all PAID course enrollments return 400 error.

**Action Steps:**
1. [ ] Document current behavior
2. [ ] Create issue/task for payment implementation
3. [ ] Add better error message for users
4. [ ] Consider if PAID courses should be hidden until implemented

---

### Issue #15: Duplicate CRON Auth Logic
- **Status:** [ ] Not Started
- **Priority:** HIGH
- **Estimated Time:** 30 minutes

**Problem:**
CRON secret verification duplicated in multiple routes:
- `/src/app/api/cron/course-notifications/route.ts`
- `/src/app/api/cron/process-campaigns/route.ts`
- `/src/app/api/cron/webinar-notifications/route.ts`

**Action Steps:**
1. [ ] Create `/src/lib/middleware/cron.ts` with `verifyCronSecret()` helper
2. [ ] Update all cron routes to use the helper
3. [ ] Test cron endpoints

---

## Phase 3: Medium Priority Issues

### Issue #16: Hardcoded Strings Needing Translation
- **Status:** [ ] Not Started
- **Priority:** MEDIUM
- **Estimated Time:** 1 hour

**Problem:**
~40 hardcoded strings in locale-aware components.

**Files Affected:**
- [ ] `/src/app/[locale]/(public)/home/content/HeroVideoPlayer.tsx` - "Turn on sound", aria-labels
- [ ] `/src/app/[locale]/(authenticated)/profile/ProfileClient.tsx` - Placeholder examples
- [ ] `/src/components/lms/EmptyStates.tsx` - 20+ strings using ternary pattern

**Note:** Admin panel hardcoded strings are acceptable per CLAUDE.md.

**Action Steps:**
1. [ ] Add new keys to `/content/messages/en.json`
2. [ ] Add corresponding keys to `/content/messages/ka.json`
3. [ ] Update HeroVideoPlayer to use translations
4. [ ] Update ProfileClient to use translations
5. [ ] Update EmptyStates to use useTranslations hook
6. [ ] Test both locales

---

### Issue #17: `any` Type Usage (62 instances)
- **Status:** [ ] Not Started
- **Priority:** MEDIUM
- **Estimated Time:** 2 hours

**Problem:**
62 instances of `any` or `as any` that should have proper types.

**High-Risk Examples:**
```typescript
// /src/lib/testimonials.ts:31
const where: any = { status: 'APPROVED' }
// Should be: Prisma.TestimonialWhereInput

// /src/app/admin/campaigns/components/CampaignEditor.tsx
designJson?: any
// Should have proper EasyEmail type

// /src/app/admin/webinars/components/timeline/TimelineEditor.tsx
config: any
// Should be InteractionConfig type
```

**Action Steps:**
1. [ ] Search: `grep -rn ": any" src/`
2. [ ] Prioritize API routes and lib files
3. [ ] Replace with proper Prisma types where applicable
4. [ ] Create types for external JSON structures
5. [ ] Use `unknown` instead of `any` where type is truly unknown

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
- **Status:** [ ] Not Started
- **Priority:** LOW
- **Estimated Time:** 30 minutes

**Problem:**
32 Json fields in schema without structure documentation.

**Example Fix:**
```prisma
// Before
customFields  Json?

// After
/// Structure: { [key: string]: string | number | boolean }
customFields  Json?
```

**Action Steps:**
1. [ ] Document each Json field's expected structure
2. [ ] Add triple-slash comments to schema
3. [ ] Consider creating TypeScript types that mirror Json structures

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
| 2025-12-06 | #6 | 🔄 STARTED | Fixed campaigns/[id]/route.ts as example. 59 more files remain |
| | | | |

---

## Notes

- Always run `npm run build` after changes to verify nothing breaks
- Create git commits after each issue is resolved
- Test affected functionality manually
- Update this document as issues are completed
