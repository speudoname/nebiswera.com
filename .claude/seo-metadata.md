# SEO & Metadata System

The project uses a centralized SEO system. **Never hardcode metadata in individual pages.**

## Architecture

```
content/seo/
├── en.json          # English titles & descriptions
└── ka.json          # Georgian titles & descriptions

src/config/seo.ts    # Page registry, sitemap config, OG settings
src/lib/metadata.ts  # Helper functions for generating metadata
src/app/robots.ts    # Auto-generated from seo.ts config
src/app/sitemap.ts   # Auto-generated from seo.ts config

public/og/           # OG images (named by pageKey: home.png, about.png)
```

## How Pages Use Metadata

Every page must use the server/client component pattern:

```tsx
// page.tsx (Server Component)
import { generatePageMetadata } from '@/lib/metadata'
import { MyPageClient } from './MyPageClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return generatePageMetadata('myPage', locale)
}

export default function MyPage() {
  return <MyPageClient />
}
```

```tsx
// MyPageClient.tsx (Client Component)
'use client'
// ... all interactive code here
```

## Updating Metadata

To change titles, descriptions, or OG content:
1. Edit `content/seo/en.json` and `content/seo/ka.json`
2. For OG images, place `{pageKey}.png` in `/public/og/`
3. **No need to touch individual page files**

## Adding New Pages (CRITICAL CHECKLIST)

When creating a new page, you MUST update these files:

| Step | File | Action |
|------|------|--------|
| 1 | `src/config/seo.ts` | Add to `indexedPages` (public) or `noIndexPages` (private) |
| 2 | `content/seo/en.json` | Add `title` and `description` under `pages.{pageKey}` |
| 3 | `content/seo/ka.json` | Add Georgian `title` and `description` |
| 4 | `/public/og/` | (Optional) Add `{pageKey}.png` (1200x630px) |

**Example - Adding a "courses" page:**

```ts
// src/config/seo.ts
indexedPages: [
  // ... existing pages
  { path: '/courses', key: 'courses', priority: 0.9, changefreq: 'weekly' },
]
```

```json
// content/seo/en.json
{
  "pages": {
    "courses": {
      "title": "Courses - Nebiswera",
      "description": "Browse our Georgian language courses..."
    }
  }
}
```

## Public vs Private Pages

- **`indexedPages`**: Appear in sitemap, allowed by robots.txt, indexed by Google
- **`noIndexPages`**: Blocked in robots.txt, get `noindex` meta tag (auth, dashboard, etc.)

## JSON-LD Schema (Already Implemented)

The following schemas are automatically included in the root layout:
- `getOrganizationSchema(locale)` - Brand info
- `getWebSiteSchema(locale)` - Site info with language

These are already set up in `src/app/[locale]/layout.tsx` — no action needed.
