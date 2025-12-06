# SMS Integration Plan - UBill API

## Overview

Integrate UBill SMS API for:
1. **Transactional SMS** - Configurable notifications for webinars, courses, auth (not hardcoded)
2. **Campaign SMS** - Scheduled bulk marketing messages
3. **Unified Notification System** - Same notification rules for email AND SMS

---

## UBill API Summary

**Base URL:** `https://api.ubill.dev/v1/sms/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sendXml?key={apiKey}` | POST | Send SMS (XML body, supports multiple numbers) |
| `/report/{smsID}` | GET | Check delivery status |
| `/balance?key={apiKey}` | GET | Check remaining credits |

**Key Features:**
- Multiple numbers in one request: `<numbers>995111111,995222222,995333333</numbers>`
- No known rate limits
- Returns `smsID` for tracking delivery status
- Delivery report returns array of statuses per number

---

## Database Schema Changes

### 1. Add SMS Fields to Contact Model

```prisma
// Add to existing Contact model in crm schema
smsMarketingStatus  SmsMarketingStatus @default(SUBSCRIBED)
smsUnsubscribedAt   DateTime?
lastSmsReceivedAt   DateTime?
totalSmsReceived    Int @default(0)

enum SmsMarketingStatus {
  SUBSCRIBED      // Can receive marketing SMS
  UNSUBSCRIBED    // Opted out via /nosms
  INVALID_NUMBER  // Phone number invalid/unreachable

  @@schema("crm")
}
```

### 2. Unified Notification Rule Model

Replaces hardcoded notifications. Works for webinars, courses, and global settings.

```prisma
model NotificationRule {
  id              String   @id @default(cuid())

  // What this rule belongs to
  entityType      NotificationEntityType  // WEBINAR, COURSE, GLOBAL
  entityId        String?                 // webinarId, courseId, or null for GLOBAL

  // Trigger event
  trigger         NotificationTrigger

  // Email notification
  emailEnabled    Boolean  @default(false)
  emailTemplateId String?  // Reference to email template

  // SMS notification
  smsEnabled      Boolean  @default(false)
  smsTemplateId   String?  // Reference to SmsTemplate

  // Ordering (if multiple rules for same trigger)
  sortOrder       Int      @default(0)

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  smsTemplate     SmsTemplate? @relation(fields: [smsTemplateId], references: [id])

  @@index([entityType, entityId])
  @@index([trigger])
  @@schema("crm")
  @@map("notification_rules")
}

enum NotificationEntityType {
  WEBINAR   // Per-webinar notifications
  COURSE    // Per-course notifications
  GLOBAL    // System-wide (auth, account)

  @@schema("crm")
}

enum NotificationTrigger {
  // Webinar triggers
  WEBINAR_REGISTRATION
  WEBINAR_BEFORE_24H
  WEBINAR_BEFORE_1H
  WEBINAR_BEFORE_30M
  WEBINAR_BEFORE_15M
  WEBINAR_STARTED
  WEBINAR_ENDED
  WEBINAR_MISSED
  WEBINAR_REPLAY_AVAILABLE

  // Course triggers
  COURSE_ENROLLMENT
  COURSE_LESSON_COMPLETED
  COURSE_MODULE_COMPLETED
  COURSE_COMPLETED
  COURSE_CERTIFICATE_READY
  COURSE_INACTIVE_7_DAYS
  COURSE_INACTIVE_30_DAYS

  // Global/Auth triggers
  USER_SIGNUP
  USER_PASSWORD_RESET
  USER_EMAIL_VERIFICATION

  @@schema("crm")
}
```

### 3. SMS Template Model

```prisma
model SmsTemplate {
  id          String   @id @default(cuid())
  name        String                    // Display name
  slug        String   @unique          // e.g., "webinar-reminder-15min"

  // Content with variable support: {{firstName}}, {{webinarTitle}}, etc.
  messageKa   String   @db.Text         // Georgian message
  messageEn   String   @db.Text         // English message

  // Categorization
  category    SmsTemplateCategory

  // Metadata
  description String?                   // Admin notes
  isDefault   Boolean  @default(false)  // System default (can edit, can't delete)
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  notificationRules NotificationRule[]

  @@index([category])
  @@index([isActive])
  @@schema("crm")
  @@map("sms_templates")
}

enum SmsTemplateCategory {
  WEBINAR       // Webinar-related templates
  COURSE        // Course-related templates
  AUTH          // Authentication (password reset, etc.)
  MARKETING     // Campaign templates
  TRANSACTIONAL // General transactional

  @@schema("crm")
}
```

### 4. SMS Campaign Model

```prisma
model SmsCampaign {
  id              String            @id @default(cuid())
  name            String            // Internal reference name

  // Content
  message         String            @db.Text // SMS text (can include {{variables}})

  // Sender
  brandId         Int               // UBill brand ID

  // Status
  status          SmsCampaignStatus @default(DRAFT)

  // Targeting (reuse existing TargetType enum from email campaigns)
  targetType      TargetType
  targetCriteria  Json?             // {tagIds: [], segmentId: "", filters: {}}

  // Scheduling
  scheduledAt     DateTime?
  scheduledTz     String            @default("Asia/Tbilisi")
  sendingStartedAt DateTime?
  completedAt     DateTime?

  // Stats (denormalized for quick display)
  totalRecipients   Int   @default(0)
  sentCount         Int   @default(0)
  deliveredCount    Int   @default(0)
  failedCount       Int   @default(0)

  // Metadata
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  recipients      SmsCampaignRecipient[]

  @@index([status])
  @@index([scheduledAt])
  @@index([createdAt])
  @@schema("crm")
  @@map("sms_campaigns")
}

enum SmsCampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  PAUSED
  COMPLETED
  CANCELLED

  @@schema("crm")
}
```

### 5. SMS Campaign Recipients

```prisma
model SmsCampaignRecipient {
  id              String              @id @default(cuid())
  campaignId      String
  contactId       String
  phone           String              // Snapshot at queue time

  // Personalization
  variables       Json?               // {firstName, lastName, ...}
  finalMessage    String?             // Rendered message

  // Status tracking
  status          SmsRecipientStatus  @default(PENDING)
  ubillSmsId      String?
  sentAt          DateTime?
  deliveredAt     DateTime?
  error           String?

  // Relations
  campaign        SmsCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  contact         Contact     @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@unique([campaignId, contactId])
  @@index([campaignId, status])
  @@index([ubillSmsId])
  @@schema("crm")
  @@map("sms_campaign_recipients")
}

enum SmsRecipientStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  SKIPPED

  @@schema("crm")
}
```

### 6. SMS Log (All SMS History)

```prisma
model SmsLog {
  id              String      @id @default(cuid())

  // Recipient
  phone           String
  contactId       String?

  // Content
  message         String      @db.Text
  brandId         Int

  // Classification
  type            SmsType

  // What triggered this SMS
  referenceType   String?     // "notification_rule", "campaign", "manual"
  referenceId     String?     // ID of the rule, campaign, etc.

  // UBill tracking
  ubillSmsId      String?
  status          SmsStatus   @default(PENDING)
  statusCheckedAt DateTime?
  error           String?

  // Cost
  segments        Int         @default(1)

  createdAt       DateTime    @default(now())

  @@index([phone])
  @@index([contactId])
  @@index([ubillSmsId])
  @@index([type, createdAt])
  @@index([status])
  @@schema("crm")
  @@map("sms_logs")
}

enum SmsType {
  TRANSACTIONAL
  CAMPAIGN

  @@schema("crm")
}

enum SmsStatus {
  PENDING       // Queued, not sent yet
  SENT          // Sent to UBill (statusID: 0)
  DELIVERED     // Confirmed delivered (statusID: 1)
  FAILED        // Not delivered (statusID: 2)
  AWAITING      // Awaiting carrier confirmation (statusID: 3)
  ERROR         // API error (statusID: 4)

  @@schema("crm")
}
```

### 7. SMS Settings

```prisma
model SmsSettings {
  id                  String   @id @default(cuid())

  // UBill API
  apiKey              String   // Store encrypted
  defaultBrandId      Int?

  // Brand list (manually configured)
  brands              Json?    // [{id: 1, name: "Nebiswera"}, {id: 2, name: "Other"}]

  // Unsubscribe footer (appended to campaign SMS only)
  unsubscribeFooterKa String   @default("გააუქმე: nebiswera.com/nosms")
  unsubscribeFooterEn String   @default("Unsubscribe: nebiswera.com/nosms")

  // Limits (optional safety limits)
  dailySendLimit      Int?     // null = unlimited

  updatedAt           DateTime @updatedAt

  @@schema("crm")
  @@map("sms_settings")
}
```

---

## Default SMS Templates

Pre-created templates (editable but not deletable):

### Webinar Templates

| Slug | Name | Georgian Message |
|------|------|------------------|
| `webinar-registration` | Registration Confirmation | `მადლობა რეგისტრაციისთვის! "{{webinarTitle}}" - {{date}}, {{time}}. ლინკი: {{link}}` |
| `webinar-reminder-24h` | 24 Hour Reminder | `{{firstName}}, შეხსენება: "{{webinarTitle}}" ხვალ {{time}}-ზე. ლინკი: {{link}}` |
| `webinar-reminder-1h` | 1 Hour Reminder | `{{firstName}}, "{{webinarTitle}}" იწყება 1 საათში! ლინკი: {{link}}` |
| `webinar-reminder-15m` | 15 Minute Reminder | `{{firstName}}, "{{webinarTitle}}" იწყება 15 წუთში! შემოგვიერთდი: {{link}}` |
| `webinar-started` | Webinar Started | `{{firstName}}, "{{webinarTitle}}" დაიწყო! შემოდი ახლავე: {{link}}` |
| `webinar-replay` | Replay Available | `{{firstName}}, "{{webinarTitle}}" ჩანაწერი ხელმისაწვდომია: {{link}}` |

### Course Templates

| Slug | Name | Georgian Message |
|------|------|------------------|
| `course-enrollment` | Course Welcome | `კეთილი იყოს მობრძანება! "{{courseTitle}}" კურსი დაგელოდებათ: {{link}}` |
| `course-completed` | Course Completion | `გილოცავთ, {{firstName}}! თქვენ წარმატებით დაასრულეთ "{{courseTitle}}"!` |
| `course-certificate` | Certificate Ready | `{{firstName}}, თქვენი სერტიფიკატი მზადაა! ჩამოტვირთეთ: {{link}}` |
| `course-inactive` | Inactivity Reminder | `{{firstName}}, გაგვენატრე! გააგრძელე "{{courseTitle}}" აქ: {{link}}` |

### Auth Templates

| Slug | Name | Georgian Message |
|------|------|------------------|
| `auth-password-reset` | Password Reset | `თქვენი პაროლის აღდგენის კოდი: {{code}}. ვადა: 10 წუთი.` |
| `auth-verification` | Email Verification | `თქვენი ვერიფიკაციის კოდი: {{code}}. ვადა: 30 წუთი.` |

---

## Architecture

### File Structure

```
src/
├── lib/
│   └── sms/
│       ├── index.ts              # Main exports
│       ├── ubill-client.ts       # UBill API client
│       ├── send.ts               # Send SMS functions
│       ├── templates.ts          # Template rendering
│       └── utils.ts              # Phone validation, helpers
│
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── sms/
│   │           ├── settings/route.ts         # SMS settings CRUD
│   │           ├── balance/route.ts          # Get UBill balance
│   │           ├── templates/route.ts        # Template CRUD
│   │           ├── templates/[id]/route.ts
│   │           ├── campaigns/route.ts        # Campaign CRUD
│   │           ├── campaigns/[id]/route.ts
│   │           ├── campaigns/[id]/send/route.ts
│   │           ├── send-test/route.ts        # Send test SMS
│   │           └── logs/route.ts             # SMS logs
│   │
│   ├── api/
│   │   └── cron/
│   │       ├── process-sms-queue/route.ts    # Process pending SMS
│   │       └── check-sms-status/route.ts     # Poll delivery status
│   │
│   ├── admin/
│   │   └── sms/
│   │       ├── page.tsx                      # Dashboard
│   │       ├── campaigns/
│   │       │   ├── page.tsx                  # List campaigns
│   │       │   ├── new/page.tsx              # Create campaign
│   │       │   └── [id]/page.tsx             # View/edit campaign
│   │       ├── templates/page.tsx            # Manage templates
│   │       └── settings/page.tsx             # SMS settings
│   │
│   ├── admin/
│   │   └── settings/
│   │       └── notifications/page.tsx        # Global notification rules (auth, etc.)
│   │
│   └── nosms/
│       └── page.tsx                          # SMS unsubscribe page
```

---

## How Notifications Work

### 1. Webinar Notification Configuration

**Admin → Webinars → [Webinar] → Notifications**

Each webinar has its own notification rules:

```
┌─────────────────────────────────────────────────────────┐
│  Notifications for "Psychology Webinar"                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  On Registration                      [Edit] [Delete]   │
│  ├─ ☑ Email: Welcome Email                             │
│  └─ ☑ SMS: Registration Confirmation                   │
│                                                         │
│  1 Hour Before                        [Edit] [Delete]   │
│  ├─ ☑ Email: 1 Hour Reminder                           │
│  └─ ☑ SMS: 1 Hour Reminder                             │
│                                                         │
│  15 Minutes Before                    [Edit] [Delete]   │
│  ├─ ☑ Email: 15 Min Reminder                           │
│  └─ ☑ SMS: 15 Minute Reminder                          │
│                                                         │
│                              [+ Add Notification Rule]  │
└─────────────────────────────────────────────────────────┘
```

### 2. Course Notification Configuration

**Admin → Courses → [Course] → Notifications**

Same pattern as webinars.

### 3. Global Notification Settings

**Admin → Settings → Notifications**

System-wide notifications (auth, account):

```
┌─────────────────────────────────────────────────────────┐
│  Global Notification Settings                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Sign Up                                           │
│  ├─ ☑ Email: Welcome Email                             │
│  └─ ☐ SMS: (disabled)                                  │
│                                                         │
│  Password Reset Request                                 │
│  ├─ ☑ Email: Password Reset Email                      │
│  └─ ☑ SMS: Password Reset Code                         │
│                                                         │
│  Email Verification                                     │
│  ├─ ☑ Email: Verification Email                        │
│  └─ ☐ SMS: (disabled)                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. How It Executes

When a trigger event happens:

```typescript
// Example: User registers for webinar
async function onWebinarRegistration(webinarId: string, contactId: string) {
  // 1. Find notification rules for this webinar + trigger
  const rules = await prisma.notificationRule.findMany({
    where: {
      entityType: 'WEBINAR',
      entityId: webinarId,
      trigger: 'WEBINAR_REGISTRATION',
      isActive: true
    },
    include: { smsTemplate: true }
  })

  // 2. Execute each rule
  for (const rule of rules) {
    // Send email if enabled
    if (rule.emailEnabled && rule.emailTemplateId) {
      await sendEmail(rule.emailTemplateId, contactId, variables)
    }

    // Send SMS if enabled
    if (rule.smsEnabled && rule.smsTemplateId) {
      await queueSms(rule.smsTemplateId, contactId, variables)
    }
  }
}
```

---

## Queue & Batch Processing

### Strategy: Queue First, Send in Batches

Since UBill supports multiple numbers in one API call with no known limit:

```typescript
// 1. When 500 users need SMS (e.g., webinar reminder)
async function queueWebinarReminder(sessionId: string) {
  const registrations = await getRegistrations(sessionId)

  // Bulk insert all 500 as PENDING
  await prisma.smsLog.createMany({
    data: registrations.map(r => ({
      phone: r.phone,
      contactId: r.contactId,
      message: renderTemplate(template, variables),
      brandId: settings.defaultBrandId,
      type: 'TRANSACTIONAL',
      referenceType: 'notification_rule',
      referenceId: ruleId,
      status: 'PENDING'
    }))
  })
}

// 2. Cron job processes queue (runs every minute)
async function processSmsQueue() {
  // Get all pending SMS, grouped by message + brandId
  const pending = await prisma.smsLog.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' }
  })

  // Group by identical message (for batch sending)
  const batches = groupBy(pending, sms => `${sms.brandId}:${sms.message}`)

  for (const [key, batch] of Object.entries(batches)) {
    const phones = batch.map(s => s.phone)

    // Send all phones with same message in ONE API call
    const result = await ubillClient.send({
      brandId: batch[0].brandId,
      numbers: phones,  // Could be 500 numbers!
      message: batch[0].message
    })

    // Update all as SENT
    await prisma.smsLog.updateMany({
      where: { id: { in: batch.map(s => s.id) } },
      data: {
        status: 'SENT',
        ubillSmsId: result.smsID
      }
    })
  }
}
```

---

## Unsubscribe System

### Campaign SMS Footer

Automatically appended to all CAMPAIGN SMS (not transactional):

```typescript
function prepareCampaignMessage(message: string, locale: string): string {
  const footer = settings[`unsubscribeFooter${locale === 'ka' ? 'Ka' : 'En'}`]
  return `${message}\n\n${footer}`
}
```

### Unsubscribe Page (`/nosms`)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           SMS გამოწერის გაუქმება                        │
│                                                         │
│  შეიყვანეთ თქვენი ტელეფონის ნომერი:                    │
│                                                         │
│  [  5XX XXX XXX  ]                                      │
│                                                         │
│  [    გაუქმება    ]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

After submission:

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✓ გამოწერა გაუქმებულია                                │
│                                                         │
│  თქვენ აღარ მიიღებთ სარეკლამო SMS შეტყობინებებს.       │
│  სერვისული შეტყობინებები (რეგისტრაციის დადასტურება,    │
│  შეხსენებები) კვლავ მოგივათ.                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Checking Before Send

```typescript
async function canSendMarketingSms(contactId: string): Promise<boolean> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { phone: true, smsMarketingStatus: true, status: true }
  })

  return (
    contact?.phone &&
    contact.status === 'ACTIVE' &&
    contact.smsMarketingStatus === 'SUBSCRIBED'
  )
}
```

---

## Admin UI Pages

### 1. SMS Dashboard (`/admin/sms`)
- UBill balance
- Today's stats (sent, delivered, failed)
- Recent SMS log
- Quick links to campaigns, templates

### 2. Campaigns (`/admin/sms/campaigns`)
- List all campaigns with stats
- Create/edit campaign
- Schedule or send immediately
- View delivery report

### 3. Templates (`/admin/sms/templates`)
- List all templates by category
- Create custom templates
- Edit existing (including defaults)
- Preview with sample data
- Character/segment counter

### 4. Settings (`/admin/sms/settings`)
- UBill API key
- Brand IDs (add/remove)
- Default brand selection
- Unsubscribe footer text
- Daily limit (optional)

---

## Implementation Phases

### Phase 1: Foundation
1. Add database models (schema migration)
2. Create UBill API client
3. SMS settings page (API key, brands)
4. Test single SMS send

### Phase 2: Templates & Notifications
5. Create SmsTemplate model + seed defaults
6. Template management UI
7. Create NotificationRule model
8. Update webinar notification UI (add SMS option)
9. Update course notification UI (add SMS option)
10. Global notification settings page

### Phase 3: Sending & Queue
11. SMS queue processor (cron job)
12. Integrate with webinar notification cron
13. Integrate with course notification cron
14. Delivery status polling

### Phase 4: Campaigns
15. SMS campaign CRUD
16. Campaign send/schedule
17. Campaign targeting (tags, segments)
18. Campaign stats/reporting

### Phase 5: Unsubscribe & Polish
19. Unsubscribe page (`/nosms`)
20. SMS logs viewer
21. Dashboard with stats
22. Balance alerts (optional)

---

## Available Template Variables

| Variable | Description | Available In |
|----------|-------------|--------------|
| `{{firstName}}` | Contact's first name | All |
| `{{lastName}}` | Contact's last name | All |
| `{{email}}` | Contact's email | All |
| `{{phone}}` | Contact's phone | All |
| `{{webinarTitle}}` | Webinar name | Webinar templates |
| `{{courseTitle}}` | Course name | Course templates |
| `{{date}}` | Formatted date | Webinar, Course |
| `{{time}}` | Formatted time | Webinar |
| `{{link}}` | Relevant URL | All |
| `{{code}}` | Verification/reset code | Auth templates |

---

## Security Considerations

1. **API Key** - Encrypted storage, never exposed to frontend
2. **Phone Validation** - Validate Georgian format (995XXXXXXXXX or 5XXXXXXXX)
3. **Admin Only** - All SMS admin APIs require authentication
4. **Rate Limiting** - Optional daily limit to prevent accidental mass sends
5. **Unsubscribe** - Immediate effect, cannot be bypassed for campaigns
