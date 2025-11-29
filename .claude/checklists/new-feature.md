# Checklist: Adding a New Feature

Use this checklist when implementing a new feature.

## Before You Start

- [ ] Review existing code patterns for similar features
- [ ] Identify which pages/routes will be affected
- [ ] Determine if feature is admin-only or user-facing

## Required Steps

### 1. Translations (User-Facing Features Only)
- [ ] All UI text uses `useTranslations` or `getTranslations`
- [ ] Translation keys added to both `content/messages/en.json` and `ka.json`
- [ ] Loading states use `loadingText` prop
- [ ] Error messages come from `auth.errors` or appropriate namespace
- [ ] Links include locale prefix: `/${locale}/path`
- [ ] Email functions receive user's locale

### 2. Component Organization
- [ ] Page-specific components co-located with pages
- [ ] Only shared components (used 3+ times) in `/src/components/`
- [ ] Follow decision tree in [component-organization.md](../component-organization.md)

### 3. Database Changes (If Applicable)
- [ ] Update Prisma schema
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push` or create migration
- [ ] Update TypeScript types if needed

### 4. API Routes (If Applicable)
- [ ] Add proper authentication/authorization checks
- [ ] Use rate limiting for public endpoints
- [ ] Return proper error codes (400, 401, 403, 404, 500)
- [ ] Validate input with Zod schemas
- [ ] Log errors appropriately

### 5. Testing
- [ ] Test in both Georgian (ka) and English (en) locales
- [ ] Test on mobile and desktop
- [ ] Test error states
- [ ] Test loading states
- [ ] Verify translations are correct

## Security Checklist

- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No command injection
- [ ] Proper input validation
- [ ] Authentication/authorization in place
- [ ] Rate limiting on public endpoints
- [ ] Secrets in environment variables, not code

## Quick Reference

- **Translation docs**: [i18n.md](../i18n.md)
- **Component organization**: [component-organization.md](../component-organization.md)
- **Design system**: [design-system.md](../design-system.md)
