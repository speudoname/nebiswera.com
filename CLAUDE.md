# Nebiswera - Development Guide

> **⚠️ IMPORTANT FOR CLAUDE:**
> This file is an **index only**. Keep it under 100 lines.
>
> **When adding new documentation:**
> 1. ❌ **DO NOT** add details to this file
> 2. ✅ **DO** create/update a file in `.claude/` folder
> 3. ✅ **DO** add a brief link here pointing to that file
>
> **Purpose:** This file loads on every conversation. Keep it minimal to save context.

## Quick Reference

**Tech Stack:** Next.js 14 (App Router) | PostgreSQL + Prisma | NextAuth.js v5 | next-intl | Postmark

**Deployment:** DigitalOcean Droplet (standalone output)

## Critical Rules

### 1. NO Hardcoded Strings
All user-facing text MUST use translations from `content/messages/`.

👉 See [.claude/i18n.md](.claude/i18n.md) for full guide

### 2. Design System
Use neomorphic purple/lavender theme with consistent shadows and rounded corners.

👉 See [.claude/design-system.md](.claude/design-system.md) for colors, shadows, components

### 3. Icons
ALWAYS use Lucide React (`lucide-react`). Never use other icon libraries or inline SVGs.

Browse: https://lucide.dev/icons

### 4. Component Organization
**Co-locate components with their pages.** Only truly shared components go in `/src/components/`.

👉 See [.claude/component-organization.md](.claude/component-organization.md) for decision tree

### 5. Admin Panel = English Only
No translations needed in `/admin/*` routes. Admin users understand English.

## Documentation Index

### Planning & Building
- **Creating a new page?** → [.claude/checklists/new-page.md](.claude/checklists/new-page.md)
- **Adding a new feature?** → [.claude/checklists/new-feature.md](.claude/checklists/new-feature.md)

### Reference Docs
- **Internationalization (i18n)** → [.claude/i18n.md](.claude/i18n.md)
  - Translation files, namespaces, email templates
- **Design System** → [.claude/design-system.md](.claude/design-system.md)
  - Colors, shadows, component usage, icons
- **Component Organization** → [.claude/component-organization.md](.claude/component-organization.md)
  - Where to put components, lib files, page structure
- **SEO & Metadata** → [.claude/seo-metadata.md](.claude/seo-metadata.md)
  - Page registry, metadata generation, OG images

## Quick Answers

**Q: Where should this component live?**
A: Check [component-organization.md](.claude/component-organization.md) decision tree

**Q: How do I add translations?**
A: Add to both `content/messages/en.json` and `ka.json` → [i18n.md](.claude/i18n.md)

**Q: What colors/shadows should I use?**
A: See [design-system.md](.claude/design-system.md)

**Q: How do I add a new page?**
A: Follow [checklists/new-page.md](.claude/checklists/new-page.md)

**Q: What about SEO?**
A: Update `src/config/seo.ts` and `content/seo/` → [seo-metadata.md](.claude/seo-metadata.md)
