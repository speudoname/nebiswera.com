# Email Marketing Campaign System - Implementation Plan

## Overview

Build a complete email marketing campaign system that integrates with Postmark's broadcast stream, allowing creation, scheduling, and sending of marketing emails to segmented audiences with full tracking and analytics.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Template Storage | Our DB | More flexibility, version control, no 100 template limit |
| Scheduling | Yes | Cron job checks for scheduled campaigns |
| A/B Testing | Future | Not in initial build |
| Personalization | Extensible system | Start with contact fields, add more later |
| Unsubscribe | Custom page | Full control, syncs with Postmark suppression |
| Suppression Sync | Bidirectional | Best practice for deliverability |

---

## Decisions Made

- [x] Email Editor: **Both** - Code editor + WYSIWYG (TipTap)
- [x] Include starter email templates? **Yes**
- [x] Timezone for scheduling: **Selectable** timezone
- [x] Link click tracking: **Per-link** - track which specific URLs clicked
- [x] Test send before full send: **Yes**

---

## Phase 1: Database Schema

### Status: COMPLETED

- [x] Add Campaign model
- [x] Add CampaignRecipient model
- [x] Add CampaignLink + CampaignLinkClick models (per-link click tracking)
- [x] Update Contact model with marketing fields (marketingStatus, suppressionReason, etc.)
- [x] Add enums (CampaignStatus, TargetType, RecipientStatus, MarketingStatus, SuppressionReason)
- [x] Run prisma db push
- [x] Verify schema - Prisma Client generated

### Schema Details

```prisma
// Campaign - the email blast
model Campaign {
  id                String           @id @default(cuid())
  name              String           // Internal name for reference
  subject           String
  previewText       String?          // Preview snippet shown in email clients
  htmlContent       String           @db.Text
  textContent       String           @db.Text

  fromName          String
  fromEmail         String
  replyTo           String?

  status            CampaignStatus   @default(DRAFT)

  // Targeting
  targetType        TargetType
  targetCriteria    Json?            // Flexible: {segmentId, tagIds[], filters}

  // Scheduling
  scheduledAt       DateTime?        // null = manual trigger
  sendingStartedAt  DateTime?
  completedAt       DateTime?

  // Stats (denormalized for dashboard)
  totalRecipients   Int              @default(0)
  sentCount         Int              @default(0)
  deliveredCount    Int              @default(0)
  openedCount       Int              @default(0)
  clickedCount      Int              @default(0)
  bouncedCount      Int              @default(0)
  unsubscribedCount Int              @default(0)

  createdBy         String           // Admin user ID
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  recipients        CampaignRecipient[]

  @@index([status])
  @@index([scheduledAt])
  @@index([createdAt])
  @@schema("crm")
  @@map("campaigns")
}

enum CampaignStatus {
  DRAFT           // Being edited
  SCHEDULED       // Waiting for scheduledAt
  SENDING         // Currently sending
  PAUSED          // Manually paused mid-send
  COMPLETED       // All recipients processed
  CANCELLED       // Cancelled before completion

  @@schema("crm")
}

enum TargetType {
  ALL_CONTACTS      // Everyone with marketingStatus = SUBSCRIBED
  SEGMENT           // Specific segment
  TAG               // One or more tags
  REGISTERED_USERS  // Users with accounts
  CUSTOM_FILTER     // Custom query

  @@schema("crm")
}

// Individual recipient queue
model CampaignRecipient {
  id              String            @id @default(cuid())
  campaignId      String
  campaign        Campaign          @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  contactId       String
  email           String

  // Snapshot of personalization at send time
  variables       Json?             // {firstName, lastName, email, ...}

  status          RecipientStatus   @default(PENDING)
  messageId       String?           // Postmark MessageID for tracking
  sentAt          DateTime?
  error           String?           // Error message if failed

  // Engagement tracking (from webhooks)
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  bouncedAt       DateTime?
  unsubscribedAt  DateTime?

  @@unique([campaignId, contactId])
  @@index([campaignId, status])
  @@index([messageId])
  @@schema("crm")
  @@map("campaign_recipients")
}

enum RecipientStatus {
  PENDING         // Queued for sending
  SENT            // Sent to Postmark
  DELIVERED       // Delivery confirmed
  FAILED          // Send failed
  SKIPPED         // Skipped (invalid, suppressed, etc.)

  @@schema("crm")
}

// Add to existing Contact model
// marketingStatus    MarketingStatus  @default(SUBSCRIBED)
// unsubscribedAt     DateTime?
// unsubscribeReason  String?
// suppressionReason  SuppressionReason?
// suppressedAt       DateTime?

enum MarketingStatus {
  SUBSCRIBED      // Can receive marketing emails
  UNSUBSCRIBED    // Opted out
  SUPPRESSED      // Bounced or complained - cannot send

  @@schema("crm")
}

enum SuppressionReason {
  HARD_BOUNCE
  SPAM_COMPLAINT
  MANUAL_SUPPRESSION

  @@schema("crm")
}
```

---

## Phase 2: Core API Routes

### Status: COMPLETED

- [x] `GET /api/admin/campaigns` - List campaigns with filters (pagination, status, search)
- [x] `POST /api/admin/campaigns` - Create campaign
- [x] `GET /api/admin/campaigns/[id]` - Get campaign details
- [x] `PATCH /api/admin/campaigns/[id]` - Update campaign (only DRAFT)
- [x] `DELETE /api/admin/campaigns/[id]` - Delete draft/cancelled campaign
- [x] `POST /api/admin/campaigns/[id]/validate` - Validate before send (unsubscribe link, HTML, subject, spam triggers)
- [x] `POST /api/admin/campaigns/[id]/prepare` - Generate recipient list based on targeting
- [x] `GET /api/admin/campaigns/[id]/prepare` - Preview estimated recipient count
- [x] `POST /api/admin/campaigns/[id]/send` - Start sending or schedule
- [x] `POST /api/admin/campaigns/[id]/pause` - Pause sending
- [x] `POST /api/admin/campaigns/[id]/cancel` - Cancel campaign
- [x] `GET /api/admin/campaigns/[id]/stats` - Get detailed stats (rates, link clicks, activity)
- [x] `POST /api/admin/campaigns/[id]/test-send` - Send test email with [TEST] prefix

---

## Phase 3: Campaign Validation Service

### Status: COMPLETED (integrated into validate route)

- [x] Validation logic in `/api/admin/campaigns/[id]/validate/route.ts`
- [x] Check: Unsubscribe link present `{{{ pm:unsubscribe }}}`
- [x] Check: Plain text version exists and not empty
- [x] Check: Subject line present and reasonable length (warnings at 78/150 chars)
- [x] Check: From email matches configured marketing sender
- [x] Check: HTML has balanced tags (basic check)
- [x] Check: Images have alt text (accessibility)
- [x] Check: Spam trigger words and excessive caps/exclamation marks
- [x] Check: Physical address hint (CAN-SPAM)
- [x] Return warnings vs errors (errors block send, warnings inform)

---

## Phase 4: Recipient Preparation Service

### Status: COMPLETED (integrated into prepare route)

- [x] Logic in `/api/admin/campaigns/[id]/prepare/route.ts`
- [x] Query contacts based on targetType and targetCriteria
- [x] EXCLUDE contacts where marketingStatus != SUBSCRIBED
- [x] Handle target types: ALL_CONTACTS, REGISTERED_USERS, TAG, SEGMENT, CUSTOM_FILTER
- [x] Create CampaignRecipient records with PENDING status
- [x] Snapshot personalization variables (firstName, lastName, email, fullName)
- [x] Update campaign.totalRecipients count
- [x] GET endpoint for recipient count preview

---

## Phase 5: Send Engine (Background Job)

### Status: COMPLETED

- [x] Create send service `/lib/campaign-sender.ts`
- [x] Batch processing: 500 recipients per Postmark API call
- [x] Render personalized HTML/text for each recipient (with fallback support)
- [x] Call Postmark `/email/batch` with MessageStream: "broadcast"
- [x] Handle partial failures (some succeed, some fail)
- [x] Update recipient statuses and messageIds
- [x] Create EmailLog entries for each sent email
- [x] Update campaign stats (sentCount)
- [x] Mark campaign COMPLETED when done
- [x] Auto-suppress contacts on bounce/invalid email errors

### Cron Job / Background Worker

- [x] Create `/api/cron/process-campaigns` endpoint
- [x] Check for SCHEDULED campaigns where scheduledAt <= now
- [x] Transition SCHEDULED to SENDING status
- [x] Process in batches with 1 second delay between batches
- [x] Security: CRON_SECRET header verification
- [ ] Configure cron job on DigitalOcean droplet or external trigger (deployment task)

---

## Phase 6: Webhook Integration

### Status: COMPLETED

- [x] Updated `/api/webhooks/postmark-marketing/route.ts`
- [x] Handle Delivery event:
  - Update EmailLog status to DELIVERED
  - Update CampaignRecipient.deliveredAt and status
  - Increment campaign.deliveredCount
- [x] Handle Open event:
  - Update EmailLog (first open only)
  - Update CampaignRecipient.openedAt (first open only)
  - Increment campaign.openedCount (first open only)
- [x] Handle Click event:
  - Track clicks in EmailLog metadata
  - Update CampaignRecipient.clickedAt
  - Increment campaign.clickedCount (first click only)
  - Track per-link clicks in CampaignLink/CampaignLinkClick tables
- [x] Handle Bounce event:
  - Update EmailLog with bounce details
  - Update CampaignRecipient with error
  - Increment campaign.bouncedCount
  - Auto-suppress contacts on hard bounces (TypeCode 1)
- [x] Handle SpamComplaint event:
  - Update EmailLog
  - Increment campaign.bouncedCount
  - Always suppress contact with SPAM_COMPLAINT reason
- [x] Handle SubscriptionChange (unsubscribe):
  - Update Contact.marketingStatus = UNSUBSCRIBED
  - Increment campaign.unsubscribedCount
  - Update CampaignRecipient.unsubscribedAt

---

## Phase 7: Unsubscribe Page

### Status: COMPLETED

- [x] Create `/[locale]/(public)/unsubscribe/page.tsx`
- [x] Create `/api/unsubscribe/route.ts` with token generation/verification
- [x] Secure HMAC-based tokens (30-day expiry)
- [x] Bilingual UI (Georgian/English)
- [x] Show masked email for confirmation
- [x] Optional unsubscribe reason selection
- [x] On confirm:
  - Update Contact.marketingStatus = UNSUBSCRIBED
  - Update Contact.unsubscribedAt
  - Push to Postmark suppression API
- [x] Handle already unsubscribed case
- [x] Handle invalid/expired token

---

## Phase 8: Suppression Sync

### Status: COMPLETED

- [x] Create `/lib/suppression-sync.ts`
- [x] Bidirectional sync: Postmark -> DB and DB -> Postmark
- [x] Fetch all suppressions from Postmark broadcast stream
- [x] Map Postmark reasons (HardBounce, SpamComplaint, ManualSuppression)
- [x] Push local unsubscribes to Postmark
- [x] Create admin endpoint `/api/admin/suppressions`
  - GET: Get sync stats
  - POST: Trigger sync
- [x] Helper to delete suppressions (for re-subscribing, except spam complaints)

---

## Phase 9: Admin UI - Campaign List

### Status: Not Started

- [ ] Create `/admin/campaigns/page.tsx`
- [ ] Table with columns: Name, Status, Recipients, Sent, Opens, Scheduled/Sent Date
- [ ] Status badges with colors
- [ ] Filter by status
- [ ] Sort by date
- [ ] Actions: Edit, Duplicate, Delete, View Stats
- [ ] "New Campaign" button

---

## Phase 10: Admin UI - Campaign Editor

### Status: Not Started

- [ ] Create `/admin/campaigns/new/page.tsx`
- [ ] Create `/admin/campaigns/[id]/edit/page.tsx`
- [ ] Step 1: Basic Info
  - Campaign name
  - Subject line
  - Preview text
  - From name & email (dropdown of verified senders)
- [ ] Step 2: Content
  - HTML editor (code or WYSIWYG TBD)
  - Plain text editor
  - Variable insertion helper
  - Live preview
- [ ] Step 3: Audience
  - Target type selector
  - Segment/Tag picker
  - Show estimated recipient count
- [ ] Step 4: Review & Schedule
  - Full preview
  - Validation results
  - Schedule picker or "Send Now"
  - Test send option

---

## Phase 11: Admin UI - Campaign Stats

### Status: Not Started

- [ ] Create `/admin/campaigns/[id]/page.tsx`
- [ ] Overview stats: Sent, Delivered, Opened, Clicked, Bounced, Unsubscribed
- [ ] Open rate, click rate calculations
- [ ] Timeline of sends
- [ ] List of recipients with individual status
- [ ] Export recipients (CSV)
- [ ] For SENDING campaigns: progress bar, pause/cancel buttons

---

## Phase 12: Personalization System

### Status: Not Started

- [ ] Create `/lib/personalization.ts`
- [ ] Define available variables
- [ ] Variable syntax: `{{variableName}}` or `{{variableName|fallback}}`
- [ ] Render function that replaces variables with values
- [ ] Handle missing values gracefully (use fallback or empty)
- [ ] Document available variables in UI

### Initial Variables

```typescript
{
  email: string           // Always available
  firstName: string | null
  lastName: string | null
  fullName: string        // firstName + lastName or email

  // Future additions:
  // webinarTitle, webinarDate, leadMagnetName, etc.
}
```

---

## Phase 13: Email Templates Library (Optional)

### Status: Not Started

- [ ] Create EmailTemplate model (or just JSON files)
- [ ] Basic templates: Newsletter, Announcement, Promotional
- [ ] Template picker in campaign editor
- [ ] Clone template to start new campaign

---

## Testing Checklist

- [ ] Create campaign with all target types
- [ ] Validate catches missing unsubscribe link
- [ ] Test send works
- [ ] Full send to small test segment
- [ ] Verify webhooks update stats correctly
- [ ] Unsubscribe flow works end-to-end
- [ ] Scheduled campaign triggers on time
- [ ] Pause/resume works
- [ ] Suppressed contacts are skipped

---

## Files to Create

```
src/
├── app/
│   ├── admin/
│   │   └── campaigns/
│   │       ├── page.tsx              # Campaign list
│   │       ├── new/
│   │       │   └── page.tsx          # New campaign wizard
│   │       └── [id]/
│   │           ├── page.tsx          # Campaign stats/details
│   │           └── edit/
│   │               └── page.tsx      # Edit campaign
│   ├── api/
│   │   ├── admin/
│   │   │   └── campaigns/
│   │   │       ├── route.ts          # List & Create
│   │   │       └── [id]/
│   │   │           ├── route.ts      # Get, Update, Delete
│   │   │           ├── validate/route.ts
│   │   │           ├── prepare/route.ts
│   │   │           ├── send/route.ts
│   │   │           ├── pause/route.ts
│   │   │           ├── cancel/route.ts
│   │   │           ├── test-send/route.ts
│   │   │           └── stats/route.ts
│   │   └── cron/
│   │       └── process-campaigns/route.ts
│   └── [locale]/
│       └── unsubscribe/
│           └── page.tsx
├── lib/
│   ├── campaign-validation.ts
│   ├── campaign-recipients.ts
│   ├── campaign-sender.ts
│   ├── personalization.ts
│   └── suppression-sync.ts
└── components/
    └── admin/
        └── campaigns/
            ├── CampaignList.tsx
            ├── CampaignEditor.tsx
            ├── CampaignStats.tsx
            ├── AudienceSelector.tsx
            ├── EmailPreview.tsx
            └── ValidationResults.tsx
```

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Schema | COMPLETED | Campaign, CampaignRecipient, CampaignLink, CampaignLinkClick + Contact updates |
| Phase 2: API Routes | COMPLETED | All 12 endpoints: list, create, read, update, delete, validate, prepare, send, pause, cancel, stats, test-send |
| Phase 3: Validation | COMPLETED | Integrated into validate route - checks unsubscribe link, HTML, subject, spam triggers |
| Phase 4: Recipients | COMPLETED | Integrated into prepare route - builds contacts query, creates recipient records with variables |
| Phase 5: Send Engine | COMPLETED | campaign-sender.ts + cron endpoint. Batch processing, error handling, EmailLog entries |
| Phase 6: Webhooks | COMPLETED | Updated marketing webhook with campaign stats, link tracking, suppression handling |
| Phase 7: Unsubscribe | COMPLETED | Bilingual page, HMAC tokens, reason selection, Postmark sync |
| Phase 8: Suppression Sync | COMPLETED | Bidirectional sync, admin endpoint, mapping of suppression reasons |
| Phase 9: UI - List | Not Started | |
| Phase 10: UI - Editor | Not Started | |
| Phase 11: UI - Stats | Not Started | |
| Phase 12: Personalization | Not Started | |
| Phase 13: Templates | Not Started | Optional |

---

## Notes

- Postmark batch limit: 500 emails per API call
- Must include unsubscribe link: `{{{ pm:unsubscribe }}}`
- Using separate server (nbswera) for marketing to protect domain reputation
- All marketing emails logged with category = MARKETING
- SpamComplaint suppressions cannot be removed (legal requirement)
