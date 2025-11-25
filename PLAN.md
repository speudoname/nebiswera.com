# Contact Management Enhancement Plan

## Features to Implement

1. **Activity Timeline** - Track all contact activities
2. **Duplicate Detection** - During import and in contact list
3. **Contact Profile Page** - Detailed view of a single contact
4. **Email Integration** - Link existing EmailLog to Contacts

---

## 1. Activity Timeline

### Database Changes (Prisma Schema)
```prisma
model ContactActivity {
  id          String       @id @default(cuid())
  contactId   String
  contact     Contact      @relation(fields: [contactId], references: [id], onDelete: Cascade)
  type        ActivityType
  description String
  metadata    Json?        // Flexible data (e.g., old/new values, email details)
  createdAt   DateTime     @default(now())
  createdBy   String?      // Admin who performed action, null for system

  @@index([contactId])
  @@index([createdAt])
  @@schema("crm")
  @@map("contact_activities")
}

enum ActivityType {
  CREATED           // Contact created
  UPDATED           // Contact info updated
  TAG_ADDED         // Tag added
  TAG_REMOVED       // Tag removed
  STATUS_CHANGED    // Status changed
  EMAIL_SENT        // Email sent (linked from EmailLog)
  EMAIL_OPENED      // Email opened
  EMAIL_BOUNCED     // Email bounced
  IMPORTED          // Imported from file
  NOTE_ADDED        // Note added

  @@schema("crm")
}
```

### API Endpoints
- `GET /api/admin/contacts/[id]/activity` - Fetch activity timeline for a contact
- Activities auto-logged when:
  - Contact created/updated
  - Tags added/removed
  - Status changed
  - Emails sent (via webhook)

### Implementation Files
- `prisma/schema.prisma` - Add ContactActivity model
- `src/app/api/admin/contacts/[id]/activity/route.ts` - Activity API
- `src/lib/contact-activity.ts` - Helper functions to log activities

---

## 2. Duplicate Detection

### Features
- **During Import**: Detect potential duplicates by email before import
- **In Contact List**: Button to find and merge duplicates
- **Merge UI**: Select which contact is primary, combine data

### API Endpoints
- `POST /api/admin/contacts/duplicates/check` - Check for duplicates in uploaded data
- `GET /api/admin/contacts/duplicates` - List all potential duplicates in database
- `POST /api/admin/contacts/duplicates/merge` - Merge two contacts

### Detection Logic
- Exact email match (primary)
- Similar email detection (typos, dots in gmail)
- Name + phone combination match

### Implementation Files
- `src/app/api/admin/contacts/duplicates/route.ts` - Duplicate detection API
- `src/app/api/admin/contacts/duplicates/merge/route.ts` - Merge API
- `src/lib/duplicate-detection.ts` - Detection algorithms
- Update import page to show duplicate warnings before import

---

## 3. Contact Profile Page

### Features
- Full contact details view
- Activity timeline display
- Email history from EmailLog
- Tags management
- Edit contact inline
- Quick actions (change status, add note)

### UI Components
- Contact header (avatar, name, email, status badge)
- Info cards (contact details, source info, custom fields)
- Activity timeline (chronological list)
- Email history tab
- Tags section with add/remove

### Implementation Files
- `src/app/admin/contacts/[id]/page.tsx` - Profile page
- `src/components/admin/ContactProfile/` - Profile components:
  - `ContactHeader.tsx`
  - `ContactInfo.tsx`
  - `ActivityTimeline.tsx`
  - `EmailHistory.tsx`
  - `TagsSection.tsx`

---

## 4. Email Integration

### Approach
Link EmailLog to Contact by email address (no schema change needed - query by email)

### Features
- Show email history on Contact Profile
- Activity timeline includes email events
- Contact status auto-updates on bounce

### API Endpoints
- `GET /api/admin/contacts/[id]/emails` - Get emails for a contact

### Auto-Update Contact on Email Events
- When email bounces, update contact status to BOUNCED
- Log email events to activity timeline

### Implementation Files
- `src/app/api/admin/contacts/[id]/emails/route.ts` - Email history API
- Update Postmark webhook handler to log activities and update contact status

---

## Implementation Order

### Phase 1: Database & Core Infrastructure
1. Add ContactActivity model to Prisma schema
2. Run `npx prisma db push`
3. Create `src/lib/contact-activity.ts` helper

### Phase 2: Activity Timeline
4. Create activity API endpoint
5. Add activity logging to existing contact endpoints (create, update, tags, status)

### Phase 3: Contact Profile Page
6. Create profile page UI
7. Add ActivityTimeline component
8. Add EmailHistory component (fetch by email from EmailLog)

### Phase 4: Duplicate Detection
9. Create duplicate detection utilities
10. Add duplicate check API
11. Add duplicate merge API
12. Update import page with duplicate warnings

### Phase 5: Email Integration Enhancement
13. Create emails API for contact
14. Update Postmark webhook to log activities and update contact status

---

## File Changes Summary

### New Files
- `src/lib/contact-activity.ts` - Activity logging helpers
- `src/lib/duplicate-detection.ts` - Duplicate detection logic
- `src/app/api/admin/contacts/[id]/activity/route.ts` - Activity API
- `src/app/api/admin/contacts/[id]/emails/route.ts` - Email history API
- `src/app/api/admin/contacts/duplicates/route.ts` - Duplicate detection API
- `src/app/api/admin/contacts/duplicates/merge/route.ts` - Merge API
- `src/app/admin/contacts/[id]/page.tsx` - Contact profile page
- `src/components/admin/ContactProfile/ContactHeader.tsx`
- `src/components/admin/ContactProfile/ContactInfo.tsx`
- `src/components/admin/ContactProfile/ActivityTimeline.tsx`
- `src/components/admin/ContactProfile/EmailHistory.tsx`
- `src/components/admin/ContactProfile/TagsSection.tsx`

### Modified Files
- `prisma/schema.prisma` - Add ContactActivity model and ActivityType enum
- `src/app/api/admin/contacts/route.ts` - Log create activity
- `src/app/api/admin/contacts/[id]/route.ts` - Log update/delete activities
- `src/app/api/admin/contacts/bulk/route.ts` - Log bulk activities
- `src/app/api/admin/contacts/import/route.ts` - Add duplicate check, log import activities
- `src/app/admin/contacts/page.tsx` - Add link to profile, add duplicates button
- Postmark webhook handler - Log email activities, update contact status
