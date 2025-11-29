# Component & Library Organization

## Co-location Principle

**ALWAYS co-locate page-specific components with their pages.** Only shared components belong in `/src/components/`.

## Decision Tree: Where Should This Component Live?

```
Is this component used in 3+ unrelated pages?
├─ YES → /src/components/ui/
└─ NO → Is it a layout component (Header/Footer/Nav)?
    ├─ YES → /src/components/layout/
    └─ NO → Is it used across ALL admin pages?
        ├─ YES → /src/components/admin/
        └─ NO → Co-locate it in the page's components/ folder
```

## File Structure

```
src/
├── app/
│   ├── [locale]/           # Localized routes
│   │   ├── (public)/       # Public pages
│   │   │   ├── page.tsx    # Root page (imports from home/)
│   │   │   ├── home/       # Home page components (no page.tsx = no /home route)
│   │   │   │   ├── HomeClient.tsx
│   │   │   │   └── content/
│   │   │   │       └── PhilosophySection.tsx
│   │   │   ├── about/      # About page
│   │   │   │   ├── page.tsx
│   │   │   │   └── content/
│   │   │   ├── collectlove/ # Multi-step testimonial form
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/  # Page-specific components
│   │   │   │       ├── AudioRecorder.tsx
│   │   │   │       ├── VideoRecorder.tsx
│   │   │   │       └── StepIndicator.tsx
│   │   │   └── contact/    # Contact page
│   │   ├── (authenticated)/ # Protected pages
│   │   ├── auth/           # Auth pages
│   │   └── webinar/
│   │       └── [slug]/
│   │           └── watch/
│   │               ├── page.tsx
│   │               ├── WatchPageClient.tsx
│   │               └── components/  # Page-specific webinar components
│   │                   ├── ChatPanel.tsx
│   │                   ├── HLSPlayer.tsx
│   │                   └── WebinarRoom.tsx
│   ├── admin/              # Admin panel (English only)
│   │   ├── campaigns/
│   │   │   ├── components/  # Campaign-specific admin components
│   │   │   │   ├── CampaignEditor.tsx
│   │   │   │   ├── Step1BasicInfo.tsx
│   │   │   │   └── Step2Content.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   └── webinars/
│   │       ├── components/  # Webinar-specific admin components
│   │       │   ├── WebinarEditor.tsx
│   │       │   └── VideoUploader.tsx
│   │       └── [id]/page.tsx
│   └── api/                # API routes
├── components/             # ONLY truly shared components
│   ├── ui/                 # Used across entire site (Button, Input, Card)
│   ├── layout/             # Used on all pages (Header, Footer, Nav)
│   ├── auth/               # Shared auth components
│   └── admin/              # Shared across ALL admin pages (ContactRow, FilterBar)
├── lib/                    # Utilities and business logic
└── types/                  # TypeScript type definitions
```

## Examples from Codebase

| Component | Location | Why |
|-----------|----------|-----|
| Button | `/src/components/ui/` | Used everywhere |
| Header | `/src/components/layout/` | Used on all pages |
| ContactRow | `/src/components/admin/` | Used across multiple admin pages |
| ChatPanel | `/app/.../webinar/.../watch/components/` | Only used on watch page |
| VideoRecorder | `/app/.../collectlove/components/` | Only used on collectlove page |
| CampaignEditor | `/app/admin/campaigns/components/` | Only used in campaign pages |

## Benefits of Co-location

1. **Clarity** - When you open a page folder, you immediately see what components belong to it
2. **Safe Deletion** - Delete a feature by deleting its folder. No orphaned components.
3. **Prevents Coupling** - Clear boundary: "This is page-specific, don't import elsewhere"
4. **Better Code Splitting** - Next.js automatically code-splits co-located components
5. **Easier Maintenance** - All related code in one place

---

## Library (lib/) Organization

**Apply the same co-location principle to lib files as components.**

### Decision Tree: Where Should This Lib File Live?

```
Is this lib file used by 3+ unrelated features?
├─ YES → Keep in /src/lib/
└─ NO → Is it infrastructure-level (db, auth, middleware)?
    ├─ YES → Keep in /src/lib/
    └─ NO → Co-locate it with the feature that uses it
```

### Examples

| Lib File | Location | Why |
|----------|----------|-----|
| `db.ts` | ✅ `/src/lib/` | Database connection - used everywhere |
| `email.ts` | ✅ `/src/lib/` | Email service - used by multiple features |
| `auth/` | ✅ `/src/lib/auth/` | Auth system - used by routes + middleware |
| `storage/r2.ts` | ✅ `/src/lib/storage/` | Storage service - shared uploads |
| `testimonials.ts` | ✅ `/src/lib/` | Used by home + love wall pages (2+ pages) |
| `webinar/*` | ❌ `/src/app/api/webinars/lib/` | Only used by webinar API routes |

### Lib Structure

```
src/lib/                           ← ONLY truly shared utilities
├── auth/                          ✅ Auth system (used by routes + middleware)
├── middleware/                    ✅ Middleware logic (used by root middleware)
├── storage/                       ✅ Storage services (R2, Bunny)
│   ├── r2.ts                      (Cloudflare R2)
│   ├── bunny.ts                   (Bunny video storage)
│   └── upload-helpers.ts
├── db.ts                          ✅ Database connection
├── email.ts                       ✅ Email service
├── locale-storage.ts              ✅ i18n utilities
├── metadata.ts                    ✅ SEO (all pages)
├── rate-limit.ts                  ✅ API protection
├── settings.ts                    ✅ App settings
├── testimonials.ts                ✅ Shared by home + love pages
└── validations.ts                 ✅ Shared validation schemas

src/app/api/webinars/lib/          ← Webinar-specific lib
├── engagement.ts
├── notifications.ts
├── registration.ts
└── session-generator.ts

src/app/api/admin/campaigns/lib/   ← Campaign-specific lib
├── campaign-sender.ts
└── personalization.ts

src/app/api/admin/contacts/lib/    ← Contacts-specific lib
├── contact-activity.ts
├── duplicate-detection.ts
└── import-utils.ts

src/app/api/admin/lib/             ← Shared admin utilities
└── suppression-sync.ts

src/app/api/lib/                   ← Public API utilities
└── unsubscribe-token.ts
```
