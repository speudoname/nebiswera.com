# Checklist: Creating a New Page

Use this checklist when adding a new page to the application.

## Required Steps

### 1. SEO & Metadata
- [ ] Add page to `src/config/seo.ts`
  - Use `indexedPages` for public pages (will appear in sitemap)
  - Use `noIndexPages` for private pages (auth, dashboard, etc.)
- [ ] Add `title` and `description` to `content/seo/en.json`
- [ ] Add `title` and `description` to `content/seo/ka.json`
- [ ] (Optional) Add OG image to `/public/og/{pageKey}.png` (1200x630px)

### 2. Page Structure
- [ ] Use server/client component pattern:
  - `page.tsx` - Server component with `generatePageMetadata()`
  - `{PageName}Client.tsx` - Client component with interactivity
- [ ] Import and use `generatePageMetadata` from `@/lib/metadata`

### 3. Translations
- [ ] Add all UI text to translation files:
  - `content/messages/en.json`
  - `content/messages/ka.json`
- [ ] Use appropriate namespace (e.g., `auth.login`, `dashboard`, etc.)
- [ ] Use `useTranslations()` in client components
- [ ] Use `getTranslations()` in server components

### 4. Content Organization
- [ ] Page sections with paragraphs go in `content/` subfolder
- [ ] Use bilingual components with `Record<Locale, {...}>` pattern
- [ ] Short UI strings (buttons, labels) use translation files

### 5. Component Organization
- [ ] Page-specific components in `components/` subfolder
- [ ] Only move to `/src/components/` if used in 3+ unrelated pages

## Example Structure

```
src/app/[locale]/(public)/courses/
├── page.tsx                    # Server component + metadata
├── CoursesClient.tsx           # Client component
├── components/                 # Page-specific components
│   ├── CourseCard.tsx
│   └── FilterBar.tsx
└── content/                    # Page content sections
    ├── IntroSection.tsx
    └── PricingSection.tsx
```

## Quick Reference

- **SEO docs**: [seo-metadata.md](../seo-metadata.md)
- **Translation docs**: [i18n.md](../i18n.md)
- **Component organization**: [component-organization.md](../component-organization.md)
