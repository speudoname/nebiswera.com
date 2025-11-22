# Nebiswera.com Implementation Plan

## Overview
Building a multi-language (Georgian/English) platform with user authentication, admin panel, and email tracking.

---

## Agreements & Decisions

| Topic | Decision |
|-------|----------|
| Default language | Georgian (ka) |
| URL structure | Subdirectory (`/ka`, `/en`) |
| Root URL behavior | Redirect `/` → `/ka` |
| Language switcher | Header + Footer |
| Email language | Based on registration language, changeable in profile |
| Admin panel language | English only (no locale prefix) |
| Admin user | levan@sarke.ge (password: levan0488) |
| Profile URL | `/[locale]/profile` |

---

## Phase 1: Admin Panel ✅ Complete

### Tasks
- [x] Set levan@sarke.ge as ADMIN in database
- [x] Create admin layout (`/admin/layout.tsx`)
- [x] Protect `/admin` routes (check ADMIN role)
- [x] Build admin dashboard (`/admin/page.tsx`)
- [x] Build user management page (`/admin/users/page.tsx`)
  - [x] List all users with pagination
  - [x] Show email verification status
  - [x] Edit user (name, email, role)
  - [x] Delete user
  - [x] Search/filter users

---

## Phase 2: Email Logging System ✅ Complete

### Tasks
- [x] Add `EmailLog` model to Prisma schema
- [x] Add `EmailType` and `EmailStatus` enums
- [x] Run database migration
- [x] Create webhook endpoint (`/api/webhooks/postmark`)
- [x] Update `sendVerificationEmail` to log emails
- [x] Update `sendPasswordResetEmail` to log emails
- [x] Configure webhook URL in Postmark via API
- [x] Build admin email logs page (`/admin/email-logs`)
  - [x] List all emails with pagination
  - [x] Filter by status (sent, delivered, bounced)
  - [x] Filter by type (verification, password reset)
  - [x] Show delivery timeline

---

## Phase 2.5: Admin Settings ✅ Complete

### Tasks
- [x] Add `Settings` model to Prisma schema
- [x] Create admin settings page (`/admin/settings`)
- [x] Move Postmark config from env vars to database
  - [x] Server API Token
  - [x] Message Stream Name
  - [x] From Email Address
  - [x] From Name
- [x] Update email functions to use database settings

---

## Phase 3: Internationalization (i18n) ✅ Complete

### Tasks
- [x] Install `next-intl`
- [x] Configure middleware for locale detection
- [x] Add `preferredLocale` field to User model
- [x] Restructure app routes under `[locale]`
- [x] Create translation files
  - [x] `messages/ka.json` (Georgian)
  - [x] `messages/en.json` (English)
- [x] Build language switcher component
- [x] Add switcher to header
- [x] Add switcher to auth pages
- [x] Translate all UI text
  - [x] Home page
  - [x] Auth pages (login, register)
  - [x] Dashboard
  - [x] Profile page
- [x] Set up root URL redirect (`/` → `/ka`)

---

## Phase 4: User Profile ✅ Complete

### Tasks
- [x] Create profile page (`/[locale]/profile/page.tsx`)
- [x] Edit name
- [x] Change password
- [x] Language preference selector
- [x] Show account info (created date, verification status)
- [x] Delete account option

---

## Database Schema Changes

```prisma
// User model additions
model User {
  // ... existing fields
  preferredLocale  String @default("ka")  // ka = Georgian, en = English
}

// New EmailLog model
model EmailLog {
  id          String      @id @default(cuid())
  messageId   String      @unique
  to          String
  subject     String
  type        EmailType
  status      EmailStatus @default(SENT)
  locale      String
  sentAt      DateTime    @default(now())
  deliveredAt DateTime?
  openedAt    DateTime?
  bouncedAt   DateTime?
  bounceType  String?
  metadata    Json?

  @@map("email_logs")
}

enum EmailType {
  VERIFICATION
  PASSWORD_RESET
  WELCOME
}

enum EmailStatus {
  SENT
  DELIVERED
  BOUNCED
  SPAM_COMPLAINT
  OPENED
}
```

---

## Final URL Structure

```
Public (with locale):
/                           → redirects to /ka
/ka                         # Georgian home (default)
/en                         # English home
/ka/auth/login
/en/auth/login
/ka/auth/register
/en/auth/register
/ka/auth/forgot-password
/en/auth/forgot-password
/ka/auth/reset-password
/en/auth/reset-password
/ka/auth/verify-email
/en/auth/verify-email
/ka/dashboard
/en/dashboard
/ka/profile
/en/profile

Admin (English only):
/admin                      # Admin dashboard
/admin/users                # User management
/admin/email-logs           # Email delivery logs
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Railway) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (beta) |
| Email | Postmark |
| i18n | next-intl |
| Hosting | Railway |
| CDN/DNS | Cloudflare |

---

## Progress Log

| Date | Phase | What was done |
|------|-------|---------------|
| 2025-11-22 | Setup | Initial Next.js setup, Railway deployment |
| 2025-11-22 | Auth | Complete auth system with email verification |
| 2025-11-22 | Phase 1 | Admin panel with dashboard and user management |
| 2025-11-22 | Phase 2 | Email logging system with Postmark webhook integration |
| 2025-11-22 | Phase 2.5 | Admin settings page for Postmark configuration |
| 2025-11-22 | Phase 3 | Internationalization (Georgian/English) with next-intl |
| 2025-11-22 | Phase 4 | User profile page with settings management |
# Trigger redeploy after database schema fix
