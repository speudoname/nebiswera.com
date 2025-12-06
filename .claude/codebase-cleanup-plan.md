# Codebase Cleanup Plan

> Created: 2024-12-06
> Status: **APPROVED** - Ready for Implementation

---

## Summary of Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| N+1 Queries | **Fix** | Good practice, prevents future issues |
| HLS Duplication | **Skip** (low priority) | Only ~30 LOC shared, components are intentionally different |
| NotificationsEditor | **Skip** | Intentionally divergent - different domains |
| Component Organization | **Fix** | Follow documented standard |
| TypeScript `any` | **Partial fix** | Only for fields we control |
| Console.log | **Partial fix** | Keep client-side, replace server-side |
| Blog i18n | **Skip** | Current SEO setup is correct |
| API key | **Skip** | `.env` is gitignored |

---

## Final Task List

### Priority 1: Performance (Database)

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Fix N+1 query - batch notification stats | `src/app/api/admin/webinars/[id]/notifications/route.ts` | [ ] |
| 2 | Fix nested loops - use WHERE clause | `src/app/api/admin/video-analytics/[videoId]/route.ts` | [ ] |
| 3 | Fix sequential import - batch operations | `src/app/api/admin/contacts/import/route.ts` | [ ] |
| 4 | Fix duplicate detection - filter in DB | `src/app/api/admin/contacts/lib/duplicate-detection.ts` | [ ] |

---

### Priority 2: Error Handling

| # | Task | File | Status |
|---|------|------|--------|
| 5 | Add try-catch wrapper | `src/app/api/admin/contacts/export/route.ts` | [ ] |

---

### Priority 3: Cleanup Deprecated Code

| # | Task | File | Status |
|---|------|------|--------|
| 6 | Update 26 imports to use `@/lib/storage` | Various files importing `bunny-storage.ts` | [ ] |
| 7 | Delete deprecated file | `src/lib/bunny-storage.ts` | [ ] |

---

### Priority 4: Console.log → Logger (Server-side only)

| # | Task | File | Status |
|---|------|------|--------|
| 8 | Replace console.error with logger | `src/lib/lms/progress.ts` (lines 129, 148, 547, 556, 601, 675, 696) | [ ] |
| 9 | Replace console.error with logger | `src/lib/storage/files.ts` (lines 312, 378) | [ ] |
| 10 | Replace console.error with logger | `src/middleware.ts` (line 90) | [ ] |
| 11 | Replace console.error with logger | `src/app/api/admin/contacts/lib/duplicate-detection.ts` (line 311) | [ ] |

**Keep as-is (client-side debugging):**
- `HeroVideoPlayer.tsx` - video error fallback
- `WebinarPlayer.tsx` - video error handling
- `lms/local-storage.ts` - localStorage errors
- `metadata.ts` - SEO warnings

---

### Priority 5: Component Organization

| # | Task | From | To | Status |
|---|------|------|-----|--------|
| 12 | Move to components folder | `src/app/[locale]/(authenticated)/profile/MyCertificates.tsx` | `src/app/[locale]/(authenticated)/profile/components/MyCertificates.tsx` | [ ] |
| 13 | Move to components folder | `src/app/[locale]/(authenticated)/profile/ProfileClient.tsx` | `src/app/[locale]/(authenticated)/profile/components/ProfileClient.tsx` | [ ] |
| 14 | Move to components folder | `src/app/[locale]/(public)/blog/BlogHeroSection.tsx` | `src/app/[locale]/(public)/blog/components/BlogHeroSection.tsx` | [ ] |
| 15 | Move to components folder | `src/app/[locale]/(public)/blog/BlogPostCard.tsx` | `src/app/[locale]/(public)/blog/components/BlogPostCard.tsx` | [ ] |
| 16 | Move to components folder | `src/app/[locale]/webinar/[slug]/WebinarLandingClient.tsx` | `src/app/[locale]/webinar/[slug]/components/WebinarLandingClient.tsx` | [ ] |
| 17 | Move to components folder | `src/app/[locale]/webinar/[slug]/watch/WatchPageClient.tsx` | `src/app/[locale]/webinar/[slug]/watch/components/WatchPageClient.tsx` | [ ] |

---

### Priority 6: Quick Wins

| # | Task | File | Status |
|---|------|------|--------|
| 18 | Export CardContent and CardFooter | `src/components/ui/index.ts` | [ ] |
| 19 | Consolidate email validation to Zod | `src/lib/validation-utils.ts` | [ ] |
| 20 | Add env var validation | `src/lib/storage/files.ts` (lines 8-11) | [ ] |

---

### Priority 7: TypeScript Improvements (Optional)

| # | Task | File | Status |
|---|------|------|--------|
| 21 | Create interface for `targetCriteria` | `src/app/admin/campaigns/components/CampaignEditor.tsx` | [ ] |
| 22 | Use `unknown` for `customFieldResponses` | `src/lib/contact-sync.ts` | [ ] |

**Skip (external library shapes):**
- `designJson` - Maily editor controls this

---

## NOT Doing

| Item | Reason |
|------|--------|
| HLS hook extraction | Only ~30 LOC, components intentionally different |
| NotificationsEditor consolidation | Different domains, divergent by design |
| Blog i18n migration | Current SEO is correct (hreflang, canonical, language-specific slugs) |
| API key rotation | `.env` is in `.gitignore` |
| Giant component splitting | Working fine, would be disruptive |

---

## Progress Tracking

- [x] Plan created
- [x] Plan reviewed and approved
- [ ] Priority 1 completed (Performance)
- [ ] Priority 2 completed (Error Handling)
- [ ] Priority 3 completed (Deprecated Code)
- [ ] Priority 4 completed (Console.log)
- [ ] Priority 5 completed (Component Organization)
- [ ] Priority 6 completed (Quick Wins)
- [ ] Priority 7 completed (TypeScript - Optional)

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-06 | Keep blog outside i18n | SEO is correct - hreflang, canonical, unique slugs per language |
| 2024-12-06 | Skip API key rotation | `.env` is gitignored, not exposed |
| 2024-12-06 | Skip NotificationsEditor merge | Webinar and Course have different trigger types, intentionally separate |
| 2024-12-06 | Skip HLS hook extraction | Small win (~30 LOC), players are intentionally different |
| 2024-12-06 | Keep client-side console.error | Useful for video/localStorage debugging |
| 2024-12-06 | Replace server-side console with logger | Proper logging infrastructure |

---

## Estimated Effort

| Priority | Tasks | Complexity |
|----------|-------|------------|
| 1 | 4 tasks | Medium - requires careful query optimization |
| 2 | 1 task | Easy - add try-catch |
| 3 | 2 tasks | Easy - find/replace imports |
| 4 | 4 tasks | Easy - swap console for logger |
| 5 | 6 tasks | Easy - move files, update imports |
| 6 | 3 tasks | Easy - quick fixes |
| 7 | 2 tasks | Optional - type improvements |

**Total: 22 tasks** (20 required + 2 optional)
