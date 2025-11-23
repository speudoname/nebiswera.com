# Nebiswera - Development Guidelines

## Project Overview

Nebiswera is a bilingual (Georgian/English) learning platform built with:
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5
- **i18n**: next-intl
- **Email**: Postmark
- **Icons**: Lucide React
- **Deployment**: Railway (standalone output)

## Icons

**ALWAYS use Lucide React icons.** Never use other icon libraries or inline SVGs.

```tsx
import { User, Settings, LogOut } from 'lucide-react'

<User className="w-5 h-5" />
<Settings size={20} />
```

Browse icons at: https://lucide.dev/icons

## Internationalization Architecture

### CRITICAL RULE: NO HARDCODED STRINGS

**All user-facing text MUST come from translation files. Never hardcode strings.**

This applies to:
- UI text (labels, buttons, messages, placeholders)
- Error messages
- Success messages
- Loading states
- Email content
- Any text visible to users

### Translation Files

Located in `/messages/`:
- `en.json` - English translations
- `ka.json` - Georgian translations

### How to Use Translations

**In Client Components:**
```tsx
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('namespace')
  return <h1>{t('key')}</h1>
}
```

**In Server Components:**
```tsx
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('namespace')
  return <h1>{t('key')}</h1>
}
```

**With Variables:**
```tsx
// In messages/en.json: "welcome": "Hello, {name}!"
t('welcome', { name: user.name })
```

### Translation Namespaces

- `common` - Shared UI strings (loading, save, cancel, etc.)
- `nav` - Navigation labels
- `auth.login` - Login page
- `auth.register` - Registration page
- `auth.forgotPassword` - Forgot password page
- `auth.resetPassword` - Reset password page
- `auth.verifyEmail` - Email verification page
- `auth.errors` - Authentication error messages
- `dashboard` - Dashboard page
- `profile` - Profile page
- `footer` - Footer links
- `home` - Home/landing page
- `languages` - Language names and switcher text

### Adding New Translations

1. Add the key to BOTH `messages/en.json` AND `messages/ka.json`
2. Use the appropriate namespace
3. Never leave a translation key in only one language file

### Button Loading States

The `Button` component accepts a `loadingText` prop for localized loading text:
```tsx
<Button loading={isLoading} loadingText={t('common.loading')}>
  {t('submit')}
</Button>
```

## Email System

### Language-Based Email Templates

Emails are sent in the user's preferred language (stored in `user.preferredLocale`).

**Template Location:** `/src/lib/email-templates/`
- `verification-en.ts` - English verification email
- `verification-ka.ts` - Georgian verification email
- `password-reset-en.ts` - English password reset email
- `password-reset-ka.ts` - Georgian password reset email

**Why separate files instead of variable injection:**
- Better email deliverability
- Cleaner HTML without complex string interpolation
- Easier to maintain and preview
- Each language can have its own formatting/styling if needed

### Sending Emails

The email functions in `/src/lib/email.ts` accept a `locale` parameter:
```ts
await sendVerificationEmail(email, token, locale) // 'en' or 'ka'
await sendPasswordResetEmail(email, token, locale)
```

The locale is determined by:
1. User's `preferredLocale` from database (if user exists)
2. Current session locale (during registration)
3. Fallback to 'ka' (Georgian as default)

## Route Structure

### Locale-Based Routes

All user-facing routes are under `/[locale]/`:
- `/ka/dashboard` - Georgian dashboard
- `/en/dashboard` - English dashboard

### Route Groups

- `(public)` - Public pages (home, about, etc.) with PublicHeader/PublicFooter
- `(authenticated)` - Protected pages requiring login with AppHeader
- `auth/` - Authentication pages (login, register, etc.) with minimal header

### Admin Panel

**Note:** The admin panel (`/admin/*`) is intentionally kept in English only.
- Admin users are expected to understand English
- This reduces maintenance overhead
- Admin-only components in `/src/components/admin/` do not require translation

## File Structure

```
src/
├── app/
│   ├── [locale]/           # Localized routes
│   │   ├── (public)/       # Public pages
│   │   ├── (authenticated)/ # Protected pages
│   │   └── auth/           # Auth pages
│   ├── admin/              # Admin panel (English only)
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Header/Footer components
│   ├── auth/               # Auth-related components
│   └── admin/              # Admin components (no i18n)
├── lib/
│   ├── email.ts            # Email sending logic
│   └── email-templates/    # Language-specific email templates
└── messages/               # Translation files
    ├── en.json
    └── ka.json
```

## Checklist for New Features

- [ ] All UI text uses `useTranslations` or `getTranslations`
- [ ] Translation keys added to both `en.json` and `ka.json`
- [ ] Loading states use `loadingText` prop
- [ ] Error messages come from `auth.errors` or appropriate namespace
- [ ] Links include locale prefix: `/${locale}/path`
- [ ] Email functions receive user's locale
- [ ] No hardcoded strings in user-facing code
