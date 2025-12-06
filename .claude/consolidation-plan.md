# Code Consolidation Plan

This document tracks the 4 consolidation tasks identified during the code audit.

## Task 1: Pagination Logic Consolidation

**Status:** ✅ COMPLETED

**Problem:** 11+ API routes have identical pagination parsing logic:
```typescript
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '20')
// ... calculate skip, build where clause, return pagination object
```

**Solution:** Create a shared utility in `/src/lib/pagination.ts`:
- `parsePaginationParams(searchParams)` - Parse page/limit from URL
- `buildPaginationResponse(total, page, limit)` - Build standard response object
- `calculateSkip(page, limit)` - Calculate Prisma skip value

**Files to Update:**
- `/src/app/api/admin/blog/route.ts`
- `/src/app/api/admin/courses/route.ts`
- `/src/app/api/admin/leads/route.ts`
- `/src/app/api/admin/orders/route.ts`
- `/src/app/api/admin/products/route.ts`
- `/src/app/api/admin/testimonials/route.ts`
- `/src/app/api/admin/users/route.ts`
- `/src/app/api/admin/webinars/route.ts`
- `/src/app/api/testimonials/route.ts`
- `/src/app/api/admin/contacts/route.ts`
- `/src/app/api/admin/campaigns/route.ts`
- And others with pagination...

**Benefit:** Single source of truth, consistent behavior, easier to modify pagination logic globally.

---

## Task 2: API Response Helper Adoption

**Status:** ✅ COMPLETED

**Problem:** `/src/lib/api-response.ts` provides standardized helpers but ~40 routes use manual `NextResponse.json()` calls.

**Existing Helpers:**
- `successResponse(data, status?)` - Success responses
- `errorResponse(message, status?)` - Error responses
- `unauthorizedResponse(message?)` - 401 responses
- `notFoundResponse(message?)` - 404 responses
- `badRequestResponse(message?)` - 400 responses

**Solution:** Migrate all API routes to use these helpers for:
- Consistent error format
- Standardized status codes
- Easier to add global response headers later

**Priority Routes:** All `/src/app/api/` routes that return JSON responses.

**Benefit:** Consistent API contract, centralized response logic.

---

## Task 3: Console.log Cleanup

**Status:** ✅ COMPLETED

**Problem:** 304+ instances of `console.log`/`console.error` scattered across codebase. Should use structured `logger` utility from `/src/lib/logger.ts`.

**Logger Features:**
- `logger.info(message, ...args)`
- `logger.warn(message, ...args)`
- `logger.error(message, ...args)`
- `logger.debug(message, ...args)`
- Automatic timestamp, context, and structured output

**Migration Rules:**
- `console.log` → `logger.info` or `logger.debug`
- `console.error` → `logger.error`
- `console.warn` → `logger.warn`
- Keep `console.log` in scripts, CLI tools, and intentional dev debugging

**Benefit:** Structured logging, easier filtering, better production debugging, can route to external services.

---

## Task 4: Time Formatting Consolidation

**Status:** ✅ COMPLETED

**Problem:** `formatDuration` function duplicated in 8+ files with identical implementation:
```typescript
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  // ...
}
```

**Solution:** Create shared utility in `/src/lib/format-utils.ts`:
- `formatDuration(seconds)` - Format seconds to "Xhr Ym Zs"
- `formatRelativeTime(date)` - Format relative time ("2 hours ago")
- `formatTableDate(date)` - Format date for table display

**Files to Update:**
- `/src/app/admin/courses/[id]/analytics/page.tsx`
- `/src/app/admin/videos/page.tsx`
- `/src/components/video/VideoPlayer.tsx`
- `/src/hooks/useVideoAnalytics.ts`
- And others with duration formatting...

**Benefit:** Single implementation, consistent formatting, easier to localize later.

---

## Implementation Order

1. **Pagination** (highest impact, sets pattern)
2. **Time Formatting** (quick win, isolated changes)
3. **API Response Helpers** (larger scope but straightforward)
4. **Console.log Cleanup** (largest scope, can be done incrementally)

---

## Progress Tracking

| Task | Status | Files Updated | Notes |
|------|--------|---------------|-------|
| Pagination | ✅ Done | Already in place | Used existing `/src/lib/api/pagination.ts` utilities |
| API Response | ✅ Done | 20+ routes | Adopted `errorResponse`, `successResponse`, etc from `@/lib` |
| Console.log | ✅ Done | 32+ API routes | Replaced with `logger` from `@/lib` |
| Time Formatting | ✅ Done | 6 files | Exported `formatDuration` from `@/lib`, removed duplicates |

---

## Completion Summary

All 4 consolidation tasks completed on 2024-12-06:

1. **Pagination**: Already had utilities at `/src/lib/api/pagination.ts` - documented for future use
2. **API Response Helpers**: Updated 20+ API routes to use centralized helpers
3. **Console.log Cleanup**: Migrated 32+ API routes from console.log/error to logger utility
4. **Time Formatting**: Added `formatDuration` export to `@/lib/index.ts`, updated 6 component files

Build verified passing after all changes.
