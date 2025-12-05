# LMS Refactoring Plan

## Overview
This plan addresses code redundancies, inefficiencies, and UX issues in the LMS/courses system.

## Issues to Fix

### Part 1: Shared Utilities & Query Builders

#### 1.1 Create `/src/lib/lms/queries.ts`
Centralized Prisma query builders to eliminate duplicate include patterns.

```typescript
// Reusable Prisma includes
export const courseStructureInclude = { ... }
export const courseWithEnrollmentInclude = { ... }
export const enrollmentWithProgressInclude = { ... }

// Query functions
export async function getCourseBySlug(slug: string, options?: {...})
export async function getCourseById(id: string, options?: {...})
export async function getEnrollmentWithCourse(enrollmentId: string)
export async function getUserEnrollment(userId: string, courseId: string)
```

**Files to update after creation:**
- `src/app/api/admin/courses/[id]/route.ts`
- `src/app/api/courses/[slug]/progress/route.ts`
- `src/app/api/profile/courses/route.ts`
- `src/app/api/courses/migrate-progress/route.ts`
- `src/lib/lms/progress.ts`
- `src/app/api/courses/lib/analytics.ts`
- `src/app/api/courses/lib/notifications.ts`

#### 1.2 Create `/src/lib/lms/course-utils.ts`
Shared utilities for course structure manipulation.

```typescript
// Part utilities
export function getAllParts(course: CourseStructure): PartWithContext[]
export function getPartById(course: CourseStructure, partId: string): PartWithContext | null
export function getPartIndex(course: CourseStructure, partId: string): number
export function getTotalPartCount(course: CourseStructure): number
export function getCompletedPartCount(progress: PartProgress[]): number

// Navigation utilities
export function getNextPart(course: CourseStructure, currentPartId: string): PartWithContext | null
export function getPrevPart(course: CourseStructure, currentPartId: string): PartWithContext | null
export function getFirstUncompletedPart(course: CourseStructure, progress: PartProgress[]): PartWithContext | null

// Progress calculation
export function calculateProgressPercent(totalParts: number, completedParts: number): number
```

**Files to update after creation:**
- `src/lib/lms/progress.ts`
- `src/app/[locale]/(public)/courses/[slug]/learn/CoursePlayer.tsx`
- `src/app/api/courses/migrate-progress/route.ts`
- `src/app/api/profile/courses/route.ts`
- `src/app/[locale]/(public)/courses/page.tsx`
- `src/app/[locale]/(public)/courses/[slug]/page.tsx`

---

### Part 2: Consolidate Progress Logic

#### 2.1 Refactor `/src/lib/lms/progress.ts`
Single source of truth for all progress operations.

**Changes:**
1. Import and use utilities from `course-utils.ts`
2. Remove duplicate nested loop patterns
3. Simplify `calculateEnrollmentProgress()` to use shared utilities
4. Add `uncompletepart()` function for marking parts incomplete

**New functions to add:**
```typescript
export async function uncompletePart(
  enrollmentId: string,
  partId: string
): Promise<{ progressPercent: number; isCompleted: boolean }>
```

#### 2.2 Update `/src/app/api/courses/migrate-progress/route.ts`
- Import types from `@/lib/lms/types` instead of redefining
- Use `prisma.partProgress.upsert()` instead of find+create pattern
- Use batch operations for quiz attempts
- Use shared utilities for progress calculation

---

### Part 3: Fix N+1 Queries & Inefficiencies

#### 3.1 Fix `/src/app/api/courses/lib/analytics.ts`
**Line 592-619:** Include user data in initial query instead of separate lookup.

```typescript
// Before
const events = await prisma.lmsAnalyticsEvent.findMany({...})
const userIds = events.map(e => e.userId).filter(Boolean)
const users = await prisma.user.findMany({ where: { id: { in: userIds } } })

// After
const events = await prisma.lmsAnalyticsEvent.findMany({
  ...
  include: { user: { select: { id: true, name: true, email: true } } }
})
```

#### 3.2 Consolidate notification queries in `/src/app/api/courses/lib/notifications.ts`
Create shared `getEnrollmentForNotifications()` function to replace duplicate fetches in:
- `queueEnrollmentNotifications()` (line 287)
- `queueCourseStartNotifications()` (line 309)
- `queueQuizNotifications()` (line 400)
- `queueCertificateNotifications()` (line 439)

---

### Part 4: UX Improvements - Optimistic Updates

#### 4.1 Update CoursePlayer with optimistic updates
**File:** `src/app/[locale]/(public)/courses/[slug]/learn/CoursePlayer.tsx`

**Changes needed:**

1. **Add uncomplete functionality:**
```typescript
const unmarkPartComplete = async () => {
  if (!currentPart || isCompleting) return

  // Optimistic update
  const updatedProgress = { ...localProgress }
  delete updatedProgress[currentPart.id]
  setLocalProgress(updatedProgress)

  // Update progress bar immediately
  const newPercent = calculateProgressFromLocal(updatedProgress)
  setLocalProgressPercent(newPercent)

  // Server update
  if (enrollment) {
    await fetch(`/api/courses/${course.slug}/progress`, {
      method: 'POST',
      body: JSON.stringify({ partId: currentPart.id, action: 'uncomplete' })
    })
  }

  // localStorage update for open courses
  if (isOpenCourse) {
    unmarkPartCompleteLocal(course.id, currentPart.id)
  }
}
```

2. **Add optimistic progress updates:**
- Update `localProgress` state immediately on mark complete
- Update `localProgressPercent` immediately
- Only call `router.refresh()` on error to resync

3. **Add toggle button UI:**
```tsx
{isPartCompleted(currentPart.id) ? (
  <button onClick={unmarkPartComplete}>
    <XCircle /> Mark as Incomplete
  </button>
) : (
  <button onClick={markPartComplete}>
    <CheckCircle /> Mark as Complete
  </button>
)}
```

#### 4.2 Add uncomplete to localStorage utilities
**File:** `src/lib/lms/local-storage.ts`

```typescript
export function unmarkPartCompleteLocal(courseId: string, partId: string): void {
  const data = getLmsData()
  if (data.courses[courseId]?.parts[partId]) {
    data.courses[courseId].parts[partId].status = 'not_started'
    delete data.courses[courseId].parts[partId].completedAt
    saveLmsData(data)
  }
}
```

#### 4.3 Add uncomplete API endpoint
**File:** `src/app/api/courses/[slug]/progress/route.ts`

Handle `action: 'uncomplete'` in POST handler:
```typescript
if (action === 'uncomplete') {
  await prisma.partProgress.update({
    where: { enrollmentId_partId: { enrollmentId, partId } },
    data: { status: 'NOT_STARTED', completedAt: null }
  })
  const result = await updateEnrollmentProgress(enrollmentId)
  return successResponse(result)
}
```

---

### Part 5: Clean Up Dead/Unused Code

#### 5.1 Verify and document progress migration
- Check if `ProgressMigrationBanner` is actually shown to users
- Add usage documentation or remove if unused

#### 5.2 Remove duplicate type definitions
- `src/app/api/courses/migrate-progress/route.ts` lines 7-29
- Import from `@/lib/lms/types` instead

---

## Implementation Order

### Phase 1: Foundation (Do First)
- [x] 1.1 Create `/src/lib/lms/queries.ts`
- [x] 1.2 Create `/src/lib/lms/course-utils.ts`

### Phase 2: Refactor Core Logic
- [x] 2.1 Add `uncompletePart()` function to `/src/lib/lms/progress.ts`
- [ ] 2.2 Refactor `/src/app/api/courses/migrate-progress/route.ts` (optional, low priority)

### Phase 3: Fix Performance Issues
- [x] 3.1 Verified analytics.ts already batches user queries (not N+1)
- [x] 3.2 Notification queries are already efficient (simple lookups)

### Phase 4: UX Improvements ✅ CRITICAL
- [x] 4.1 Add optimistic updates to CoursePlayer
- [x] 4.2 Add uncomplete to localStorage (`unmarkPartCompleteLocal`)
- [x] 4.3 Add uncomplete to API (`action: 'uncomplete'`)
- [x] 4.4 Add uncomplete button UI (toggle between complete/incomplete)

### Phase 5: Cleanup
- [ ] 5.1 Update all files to use shared utilities (optional, as needed)
- [ ] 5.2 Remove duplicate type definitions (optional)
- [ ] 5.3 Verify/document migration feature (optional)
- [x] 5.4 Build verified passing

---

## Expected Outcomes

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Shared utilities | None | queries.ts, course-utils.ts | ✅ Done |
| Progress update latency | ~500ms (wait for refresh) | ~0ms (optimistic) | ✅ Done |
| User can uncomplete | No | Yes (toggle button) | ✅ Done |
| Duplicate code blocks | 15+ | Partially reduced | In Progress |
| DB queries per page load | Good (was not N+1) | Good | ✅ Verified |

---

## Files Summary

**New files to create:**
- `/src/lib/lms/queries.ts`
- `/src/lib/lms/course-utils.ts`

**Files to modify:**
- `/src/lib/lms/progress.ts`
- `/src/lib/lms/local-storage.ts`
- `/src/app/[locale]/(public)/courses/[slug]/learn/CoursePlayer.tsx`
- `/src/app/api/courses/[slug]/progress/route.ts`
- `/src/app/api/courses/migrate-progress/route.ts`
- `/src/app/api/courses/lib/analytics.ts`
- `/src/app/api/courses/lib/notifications.ts`
- `/src/app/api/profile/courses/route.ts`
- `/src/app/[locale]/(public)/courses/page.tsx`
- `/src/app/[locale]/(public)/courses/[slug]/page.tsx`
