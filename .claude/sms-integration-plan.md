# SMS Integration Plan - UBill API

## Overview

Integrate UBill SMS API for:
1. **Transactional SMS** - Webinar reminders, course notifications, registration confirmations
2. **Campaign SMS** - Scheduled bulk marketing messages
3. **Automation Triggers** - Event-based SMS (webinar starting soon, etc.)

---

## UBill API Summary

**Base URL:** `https://api.ubill.dev/v1/sms/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sendXml?key={apiKey}` | POST | Send SMS (XML body) |
| `/report/{smsID}` | GET | Check delivery status |
| `/balance?key={apiKey}` | GET | Check remaining credits |
| `/brands?key={apiKey}` | GET | List available brand IDs (sender names) |

**Note:** Need to verify the brands endpoint exists - if not, we'll store brand IDs manually in settings.

---

## Database Schema Changes

### 1. Add SMS Marketing Status to Contact

```prisma
// Add to Contact model
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

### 2. SMS Campaign Model

```prisma
model SmsCampaign {
  id              String            @id @default(cuid())
  name            String            // Internal reference name

  // Content
  message         String            @db.Text // SMS text content

  // Sender
  brandId         Int               // UBill brand ID (sender name)

  // Status
  status          SmsCampaignStatus @default(DRAFT)

  // Targeting (same as email campaigns)
  targetType      TargetType
  targetCriteria  Json?

  // Scheduling
  scheduledAt     DateTime?
  scheduledTz     String            @default("Asia/Tbilisi")
  sendingStartedAt DateTime?
  completedAt     DateTime?

  // Stats
  totalRecipients   Int   @default(0)
  sentCount         Int   @default(0)
  deliveredCount    Int   @default(0)
  failedCount       Int   @default(0)

  // Metadata
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  recipients      SmsCampaignRecipient[]

  @@index([status])
  @@index([scheduledAt])
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

### 3. SMS Campaign Recipients (Queue)

```prisma
model SmsCampaignRecipient {
  id              String              @id @default(cuid())
  campaignId      String
  campaign        SmsCampaign         @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  contactId       String
  contact         Contact             @relation(fields: [contactId], references: [id], onDelete: Cascade)
  phone           String              // Phone number at time of queueing

  // Personalization
  variables       Json?               // {firstName, etc.}
  finalMessage    String?             // Rendered message with variables

  // Status
  status          SmsRecipientStatus  @default(PENDING)
  ubillSmsId      String?             // UBill's smsID for tracking
  sentAt          DateTime?
  deliveredAt     DateTime?
  error           String?

  @@unique([campaignId, contactId])
  @@index([campaignId, status])
  @@index([ubillSmsId])
  @@schema("crm")
  @@map("sms_campaign_recipients")
}

enum SmsRecipientStatus {
  PENDING         // Queued
  SENT            // Sent to UBill
  DELIVERED       // Delivery confirmed
  FAILED          // Send failed
  SKIPPED         // Invalid number, unsubscribed, etc.

  @@schema("crm")
}
```

### 4. SMS Log (All SMS - Transactional & Campaign)

```prisma
model SmsLog {
  id              String      @id @default(cuid())

  // Recipient
  phone           String
  contactId       String?     // May be null for non-contact recipients

  // Content
  message         String      @db.Text
  brandId         Int

  // Type
  type            SmsType     // TRANSACTIONAL or CAMPAIGN

  // Reference (what triggered this SMS)
  referenceType   String?     // "webinar_reminder", "course_notification", "campaign"
  referenceId     String?     // ID of the webinar, course, or campaign

  // UBill response
  ubillSmsId      String?
  status          SmsStatus   @default(PENDING)
  statusUpdatedAt DateTime?
  error           String?

  // Cost tracking
  segments        Int         @default(1) // SMS segment count (for long messages)

  createdAt       DateTime    @default(now())

  @@index([phone])
  @@index([contactId])
  @@index([ubillSmsId])
  @@index([type, createdAt])
  @@index([referenceType, referenceId])
  @@schema("crm")
  @@map("sms_logs")
}

enum SmsType {
  TRANSACTIONAL   // Webinar reminders, confirmations
  CAMPAIGN        // Marketing campaigns

  @@schema("crm")
}

enum SmsStatus {
  PENDING         // Not yet sent to UBill
  SENT            // Sent to UBill (statusID: 0)
  DELIVERED       // Received by recipient (statusID: 1)
  FAILED          // Not delivered (statusID: 2)
  AWAITING        // Awaiting status (statusID: 3)
  ERROR           // API error (statusID: 4)

  @@schema("crm")
}
```

### 5. SMS Templates

```prisma
model SmsTemplate {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique  // e.g., "webinar-reminder-15min"

  // Content (supports variables like {{firstName}})
  messageKa   String   @db.Text
  messageEn   String   @db.Text

  // Type
  category    String   // "webinar", "course", "marketing", "transactional"

  // Metadata
  description String?
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@schema("crm")
  @@map("sms_templates")
}
```

### 6. Settings Addition

```prisma
// Add to existing Settings model or create SmsSettings
model SmsSettings {
  id            String   @id @default(cuid())

  // UBill credentials
  apiKey        String   // Encrypted
  defaultBrandId Int?

  // Available brands (cached from API or manual)
  brands        Json?    // [{id: 1, name: "Nebiswera"}, ...]

  // Defaults
  unsubscribeFooterKa String @default("გააუქმე მესიჯები - https://nebiswera.com/nosms")
  unsubscribeFooterEn String @default("Unsubscribe - https://nebiswera.com/nosms")

  // Limits
  dailySendLimit      Int    @default(10000)
  batchSize           Int    @default(100)  // Numbers per API call

  updatedAt     DateTime @updatedAt

  @@schema("crm")
  @@map("sms_settings")
}
```

---

## Architecture

### File Structure

```
src/
├── lib/
│   └── sms/
│       ├── index.ts           # Main exports
│       ├── ubill-client.ts    # UBill API client
│       ├── queue.ts           # Batch queue processor
│       ├── templates.ts       # Template rendering
│       └── utils.ts           # Phone validation, etc.
│
├── app/
│   ├── api/
│   │   ├── sms/
│   │   │   ├── send/route.ts           # Internal: send single SMS
│   │   │   ├── send-batch/route.ts     # Internal: send batch SMS
│   │   │   └── status/[id]/route.ts    # Check delivery status
│   │   │
│   │   └── admin/
│   │       └── sms/
│   │           ├── campaigns/route.ts        # CRUD campaigns
│   │           ├── campaigns/[id]/route.ts   # Single campaign
│   │           ├── campaigns/[id]/send/route.ts  # Trigger send
│   │           ├── templates/route.ts        # Manage templates
│   │           ├── balance/route.ts          # Get SMS balance
│   │           ├── brands/route.ts           # Get available brands
│   │           └── settings/route.ts         # SMS settings
│   │
│   ├── admin/
│   │   └── sms/
│   │       ├── page.tsx              # SMS dashboard
│   │       ├── campaigns/
│   │       │   ├── page.tsx          # Campaign list
│   │       │   ├── new/page.tsx      # Create campaign
│   │       │   └── [id]/page.tsx     # Edit/view campaign
│   │       ├── templates/page.tsx    # Template management
│   │       └── settings/page.tsx     # SMS settings
│   │
│   ├── nosms/
│   │   └── page.tsx              # SMS unsubscribe page
│   │
│   └── [locale]/
│       └── nosms/
│           └── page.tsx          # Localized unsubscribe
│
├── cron/ (or api/cron/)
│   ├── process-sms-campaigns/route.ts   # Process scheduled campaigns
│   └── check-sms-status/route.ts        # Poll delivery status
```

---

## Queue Management Strategy

### The Problem
When 500 users need SMS 15 minutes before a webinar, we can't:
- Send 500 individual API calls (too slow, rate limits)
- Block the process waiting for all sends

### The Solution: Batched Queue Processing

#### 1. Queue Recipients First
```typescript
// When notification triggers (e.g., 15 min before webinar)
async function queueWebinarReminders(webinarId: string, sessionId: string) {
  const registrations = await getRegistrationsWithPhone(sessionId)

  // Bulk insert into SMS queue
  await prisma.smsLog.createMany({
    data: registrations.map(r => ({
      phone: r.contact.phone,
      contactId: r.contactId,
      message: renderTemplate('webinar-reminder-15min', { name: r.firstName, ... }),
      brandId: defaultBrandId,
      type: 'TRANSACTIONAL',
      referenceType: 'webinar_reminder',
      referenceId: sessionId,
      status: 'PENDING'
    }))
  })

  // Trigger batch processor
  await triggerBatchProcessor()
}
```

#### 2. Batch Processor
```typescript
// Process in batches of 50-100 numbers per API call
async function processSmsQueue() {
  const pendingSms = await prisma.smsLog.findMany({
    where: { status: 'PENDING' },
    take: 100,  // Batch size
    orderBy: { createdAt: 'asc' }
  })

  if (pendingSms.length === 0) return

  // Group by brandId and message (same message = batch)
  const batches = groupByBrandAndMessage(pendingSms)

  for (const batch of batches) {
    // UBill may support multiple numbers in one call
    // If not, we process sequentially but quickly
    const result = await ubillClient.sendBatch(batch)

    // Update status in bulk
    await prisma.smsLog.updateMany({
      where: { id: { in: batch.map(s => s.id) } },
      data: {
        status: 'SENT',
        ubillSmsId: result.smsID,
        sentAt: new Date()
      }
    })
  }
}
```

#### 3. API Call Optimization
```typescript
// If UBill supports multiple numbers in <numbers> field:
const xmlBody = `
<?xml version="1.0" encoding="UTF-8"?>
<request>
  <brandID>${brandId}</brandID>
  <numbers>${phoneNumbers.join(',')}</numbers>  <!-- Multiple! -->
  <text>${message}</text>
  <stopList>true</stopList>
</request>
`
// One API call for 100 recipients with same message!
```

#### 4. Cron Job for Processing
```
# Every minute, process pending SMS queue
*/1 * * * * curl -X POST https://nebiswera.com/api/cron/process-sms-queue
```

---

## Unsubscribe Flow

### 1. Footer on All Campaign SMS
```typescript
function appendUnsubscribeFooter(message: string, locale: string): string {
  const footer = locale === 'ka'
    ? '\n\nგააუქმე: nebiswera.com/nosms'
    : '\n\nUnsubscribe: nebiswera.com/nosms'
  return message + footer
}
```

### 2. Unsubscribe Page (`/nosms`)
- User enters phone number
- We look up contact by phone
- Mark as `smsMarketingStatus: UNSUBSCRIBED`
- Show confirmation

### 3. Checking Before Send
```typescript
async function canSendSms(contactId: string): Promise<boolean> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      phone: true,
      smsMarketingStatus: true,
      status: true
    }
  })

  if (!contact?.phone) return false
  if (contact.status !== 'ACTIVE') return false
  if (contact.smsMarketingStatus !== 'SUBSCRIBED') return false

  return true
}
```

---

## Integration Points

### 1. Webinar Notifications
Location: `src/app/api/cron/webinar-notifications/route.ts`

Add SMS alongside existing email notifications:
```typescript
// After sending email notification
if (config.smsEnabled && registration.contact.phone) {
  await queueSms({
    phone: registration.contact.phone,
    contactId: registration.contactId,
    templateSlug: `webinar-reminder-${config.minutesBefore}min`,
    variables: { firstName, webinarTitle, startTime },
    referenceType: 'webinar_reminder',
    referenceId: session.id
  })
}
```

### 2. Course Notifications
Location: `src/app/api/cron/course-notifications/route.ts`

Similar pattern for course enrollment confirmations.

### 3. Webinar Registration Confirmation
Location: `src/app/api/webinars/[slug]/register/route.ts`

Send immediate SMS confirmation after registration.

---

## Admin UI Features

### SMS Dashboard (`/admin/sms`)
- SMS balance display (from UBill API)
- Recent SMS log
- Quick stats: sent today, delivered rate, failed rate

### Campaigns (`/admin/sms/campaigns`)
- List all SMS campaigns
- Create new campaign
  - Select brand ID (sender)
  - Write message (character counter, segment calculator)
  - Select target (all contacts, tag, segment)
  - Preview with personalization
  - Schedule or send immediately
- View campaign stats

### Templates (`/admin/sms/templates`)
- Create/edit SMS templates
- Preview with sample data
- Variables reference ({{firstName}}, {{webinarTitle}}, etc.)

### Settings (`/admin/sms/settings`)
- UBill API key configuration
- Default brand ID selection
- Fetch/refresh brand list
- Configure unsubscribe footer text
- Set daily limits

---

## Implementation Order

### Phase 1: Foundation
1. Add database models (migrate schema)
2. Create UBill API client (`src/lib/sms/ubill-client.ts`)
3. Create basic settings UI
4. Test single SMS send

### Phase 2: Transactional SMS
5. Create SMS templates system
6. Integrate with webinar notifications
7. Add SMS queue processor
8. Create unsubscribe page (`/nosms`)

### Phase 3: Campaigns
9. Create SMS campaign admin UI
10. Implement campaign targeting
11. Add batch send processor
12. Create delivery status polling

### Phase 4: Polish
13. Add SMS balance display
14. Analytics and reporting
15. A/B testing (optional)

---

## Questions to Resolve

1. **Multiple numbers per API call?** - Need to test if `<numbers>995xxx,995yyy</numbers>` works

2. **Rate limits?** - What's the max SMS/second UBill allows?

3. **Brand list API** - Does `/brands` endpoint exist, or do we configure manually?

4. **Georgian character count** - Georgian uses more segments (70 chars/segment vs 160 for Latin)

5. **Delivery status polling** - How often should we check? Is there a webhook option?

---

## Security Considerations

1. **API Key Storage** - Store encrypted in database, never expose to frontend
2. **Phone Validation** - Validate Georgian format (995XXXXXXXXX)
3. **Rate Limiting** - Prevent abuse of send endpoints
4. **Unsubscribe Security** - Consider phone verification before unsubscribe
5. **Admin Only** - All SMS APIs require admin authentication
