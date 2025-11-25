# Contacts Management System - Implementation Plan

## Overview

Build a comprehensive Contacts Management system in the admin panel, separate from the Users system. Contacts represent leads/subscribers from various sources (newsletters, webinars, etc.) that may or may not become registered users.

## Key Requirements

- **Separate from Users**: Contacts are distinct from registered users but can be linked
- **Full CRUD**: Create, Read, Update, Delete contacts
- **Tagging System**: Flexible tags for categorization
- **Source Tracking**: Know where each contact came from
- **Import/Export**: CSV and JSON support
- **Future-Ready**: Architecture supports activity tracking, email logs, audience segments

---

## Phase 1: Database Schema (PostgreSQL Schema: `crm`)

### 1.1 Prisma Configuration

Add `schemas` support in `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "crm"]
}
```

### 1.2 Core Models

**Contact** - Main contact entity
```prisma
model Contact {
  id            String    @id @default(cuid())
  email         String    @unique
  firstName     String?
  lastName      String?
  phone         String?

  // Source tracking
  source        String    // e.g., "newsletter", "webinar", "import", "manual"
  sourceDetails String?   // Additional context (webinar name, import file, etc.)

  // Link to user (if they register)
  userId        String?   @unique
  user          User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Status
  status        ContactStatus @default(ACTIVE)

  // Metadata
  customFields  Json?     // Flexible key-value storage for future needs
  notes         String?   @db.Text

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  tags          ContactTag[]

  @@index([email])
  @@index([source])
  @@index([status])
  @@index([createdAt])
  @@schema("crm")
  @@map("contacts")
}

enum ContactStatus {
  ACTIVE
  UNSUBSCRIBED
  BOUNCED
  ARCHIVED

  @@schema("crm")
}
```

**Tag** - Reusable tags for contacts
```prisma
model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String   @default("#8B5CF6") // Purple default
  description String?
  createdAt   DateTime @default(now())

  contacts    ContactTag[]

  @@schema("crm")
  @@map("tags")
}
```

**ContactTag** - Many-to-many junction
```prisma
model ContactTag {
  contactId String
  tagId     String
  assignedAt DateTime @default(now())

  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([contactId, tagId])
  @@schema("crm")
  @@map("contact_tags")
}
```

**ImportLog** - Track import operations
```prisma
model ImportLog {
  id            String   @id @default(cuid())
  fileName      String
  totalRows     Int
  successCount  Int
  failedCount   Int
  errors        Json?    // Array of error messages with row numbers
  importedBy    String   // Admin user ID
  createdAt     DateTime @default(now())

  @@index([createdAt])
  @@schema("crm")
  @@map("import_logs")
}
```

### 1.3 User Model Update

Add optional relation to Contact in existing User model:
```prisma
model User {
  // ... existing fields
  contact Contact? // Optional 1:1 relation
}
```

---

## Phase 2: API Routes

### 2.1 Contacts CRUD

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/contacts` | List contacts with pagination, search, filters |
| POST | `/api/admin/contacts` | Create single contact |
| GET | `/api/admin/contacts/[id]` | Get contact details |
| PATCH | `/api/admin/contacts/[id]` | Update contact |
| DELETE | `/api/admin/contacts/[id]` | Delete contact |
| POST | `/api/admin/contacts/bulk-delete` | Delete multiple contacts |

### 2.2 Tags Management

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/contacts/tags` | List all tags |
| POST | `/api/admin/contacts/tags` | Create tag |
| PATCH | `/api/admin/contacts/tags/[id]` | Update tag |
| DELETE | `/api/admin/contacts/tags/[id]` | Delete tag |

### 2.3 Import/Export

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/contacts/import` | Import contacts (CSV/JSON) |
| GET | `/api/admin/contacts/export` | Export contacts (CSV/JSON) |
| GET | `/api/admin/contacts/import-logs` | List import history |

---

## Phase 3: Admin UI Components

### 3.1 Navigation Update

Add "Contacts" to admin sidebar with `Users` icon (or new `Contact` icon)

### 3.2 Pages Structure

```
src/app/admin/contacts/
├── page.tsx                    # Main contacts list
├── ContactsTable.tsx           # Table component
├── [id]/
│   └── page.tsx               # Contact detail/edit page
├── import/
│   └── page.tsx               # Import wizard
└── tags/
    └── page.tsx               # Tags management
```

### 3.3 Components

```
src/components/admin/
├── ContactRow.tsx              # Table row for contact
├── ContactForm.tsx             # Create/Edit form
├── TagBadge.tsx               # Colored tag display
├── TagSelector.tsx            # Multi-select for tags
├── ImportWizard.tsx           # Step-by-step import UI
└── index.ts                   # Export all
```

### 3.4 Main Contacts Page Features

1. **Filter Bar**:
   - Search by name/email/phone
   - Filter by tag (multi-select)
   - Filter by source
   - Filter by status
   - Date range filter

2. **Table Columns**:
   - Contact (name + email)
   - Phone
   - Tags (badges)
   - Source
   - Status
   - Created date
   - Actions (edit, delete)

3. **Bulk Actions**:
   - Select multiple contacts
   - Bulk tag assignment
   - Bulk delete
   - Export selected

4. **Quick Actions**:
   - Create contact button
   - Import button
   - Export button

---

## Phase 4: Implementation Order

### Step 1: Database Setup
1. Update `prisma/schema.prisma` with new models and `crm` schema
2. Create migration: `npx prisma migrate dev --name add_crm_schema`
3. Generate client: `npx prisma generate`

### Step 2: API Foundation
1. Create `/api/admin/contacts/route.ts` (GET, POST)
2. Create `/api/admin/contacts/[id]/route.ts` (GET, PATCH, DELETE)
3. Create `/api/admin/contacts/tags/route.ts` (GET, POST)
4. Create `/api/admin/contacts/tags/[id]/route.ts` (PATCH, DELETE)

### Step 3: Admin UI - Basic
1. Add "Contacts" to admin layout navigation
2. Create `ContactRow.tsx` component
3. Create `TagBadge.tsx` component
4. Create contacts list page with table

### Step 4: Contact CRUD UI
1. Create contact form component
2. Add create contact modal/page
3. Add edit contact page
4. Add delete confirmation

### Step 5: Tags Management
1. Create tags management page
2. Create `TagSelector.tsx` component
3. Integrate tags into contact form

### Step 6: Import/Export
1. Create import API endpoint with validation
2. Create export API endpoint
3. Build import wizard UI
4. Add export functionality to contacts page

---

## Future Expansion (Not in Phase 1)

### Activity Tracking (Phase 2)
```prisma
model ContactActivity {
  id          String   @id @default(cuid())
  contactId   String
  type        String   // "webinar_attended", "video_watched", "email_opened"
  metadata    Json?    // Event-specific data
  occurredAt  DateTime @default(now())

  contact     Contact  @relation(fields: [contactId], references: [id])

  @@index([contactId])
  @@index([type])
  @@schema("crm")
}
```

### Email Tracking (Phase 2)
```prisma
model ContactEmail {
  id          String   @id @default(cuid())
  contactId   String
  emailLogId  String?  // Link to existing EmailLog
  sentAt      DateTime
  openedAt    DateTime?
  clickedAt   DateTime?

  contact     Contact  @relation(fields: [contactId], references: [id])

  @@schema("crm")
}
```

### Audiences/Segments (Phase 3)
```prisma
model Audience {
  id          String   @id @default(cuid())
  name        String
  description String?
  filters     Json     // Saved filter criteria
  isDynamic   Boolean  @default(true)

  @@schema("crm")
}
```

---

## Files to Create/Modify

### New Files
- `prisma/schema.prisma` (modify)
- `src/app/admin/contacts/page.tsx`
- `src/app/admin/contacts/ContactsTable.tsx`
- `src/app/admin/contacts/[id]/page.tsx`
- `src/app/admin/contacts/import/page.tsx`
- `src/app/admin/contacts/tags/page.tsx`
- `src/app/api/admin/contacts/route.ts`
- `src/app/api/admin/contacts/[id]/route.ts`
- `src/app/api/admin/contacts/tags/route.ts`
- `src/app/api/admin/contacts/tags/[id]/route.ts`
- `src/app/api/admin/contacts/import/route.ts`
- `src/app/api/admin/contacts/export/route.ts`
- `src/components/admin/ContactRow.tsx`
- `src/components/admin/ContactForm.tsx`
- `src/components/admin/TagBadge.tsx`
- `src/components/admin/TagSelector.tsx`
- `src/components/admin/ImportWizard.tsx`

### Modified Files
- `src/app/admin/layout.tsx` (add Contacts nav item)
- `src/components/admin/index.ts` (export new components)

---

## Summary

This plan delivers a clean, extensible Contacts Management system:

1. **Separate `crm` schema** keeps contact data organized
2. **Flexible tagging** allows any categorization
3. **Source tracking** shows where contacts came from
4. **User linking** connects contacts who become users
5. **Import/Export** for data portability
6. **Future-ready** architecture for activity tracking, audiences

Ready to implement when approved.
