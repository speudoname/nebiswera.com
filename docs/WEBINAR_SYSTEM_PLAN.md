# Nebiswera Webinar System - Implementation Plan

## Overview

Build an internal webinar platform similar to eWebinar, integrated into the Nebiswera admin panel. The system supports evergreen (pre-recorded simulated live), on-demand replays, and eventually live streaming with real-time interaction.

**Video Infrastructure:** Cloudflare Stream (already available)
**Real-time Chat:** SSE + Redis on DigitalOcean
**Email Notifications:** Existing Postmark integration
**Database:** PostgreSQL with Prisma (existing)
**Database Schema:** `webinar` (separate PostgreSQL schema, like `crm` for contacts)

---

## Database Schema Structure

The webinar system uses a separate PostgreSQL schema called `webinar` (following the same pattern as the `crm` schema for contacts). This keeps webinar tables organized and isolated.

**Schema:** `webinar`
**Tables created:**
- `webinars` - Main webinar entity
- `webinar_schedule_configs` - Schedule settings (recurring, one-time, etc.)
- `webinar_sessions` - Individual session instances
- `webinar_registrations` - User registrations with access tokens
- `webinar_interactions` - Polls, CTAs, downloads, etc.
- `webinar_poll_responses` - User responses to polls
- `webinar_interaction_events` - Track views, clicks, dismissals
- `webinar_chat_messages` - Chat messages (real and simulated)
- `webinar_notifications` - Email notification templates
- `webinar_notifications_sent` - Track sent notifications
- `webinar_analytics_events` - Granular analytics events

**Status:** ✅ Schema created and migrated to database

---

## Core Concepts

### Webinar Types

| Type | Description | Seeking Allowed | Schedule |
|------|-------------|-----------------|----------|
| **Scheduled** | Simulated live at specific times | No | Fixed recurring or one-time |
| **Just-in-time** | "Starting in 15 min" always available | No | Dynamic, always near-future |
| **On-demand** | Watch immediately after registration | Yes | Instant |
| **Replay** | Available after scheduled session | Yes | After attendance or missed |
| **Live** | Real-time streaming (Phase 2) | No | Scheduled |

### Registration Flow

```
User visits landing page → Selects session time → Provides email + name →
Gets unique watch link → Receives confirmation email → Reminder emails →
Joins at scheduled time → Watches with interactions → Follow-up emails
```

- **No account required** - email-only registration
- **Unique link per registration** - for tracking individual analytics
- **One registration = one viewer** - link tied to single user

---

## Phase 1: Foundation & Recorded Webinars

### 1.1 Database Schema

#### Core Tables

```prisma
// Webinar - main webinar entity
model Webinar {
  id                String   @id @default(cuid())

  // Basic info
  title             String
  slug              String   @unique
  description       String?  @db.Text

  // Video
  cloudflareVideoId String?  // Cloudflare Stream video ID
  videoDuration     Int?     // Duration in seconds
  thumbnailUrl      String?

  // Pages (manually built, referenced here)
  landingPagePath   String?  // e.g., "/webinar/ai-masterclass"
  thankYouPagePath  String?  // e.g., "/webinar/ai-masterclass/thank-you"

  // Settings
  status            WebinarStatus @default(DRAFT)
  timezone          String   @default("Asia/Tbilisi")

  // Presenter info (shown on landing page)
  presenterName     String?
  presenterTitle    String?
  presenterAvatar   String?

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  publishedAt       DateTime?

  // Relations
  scheduleConfig    WebinarScheduleConfig?
  sessions          WebinarSession[]
  interactions      WebinarInteraction[]
  registrations     WebinarRegistration[]
  notifications     WebinarNotification[]
  analytics         WebinarAnalyticsEvent[]
}

enum WebinarStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// Schedule configuration (like eWebinar's Schedule tab)
model WebinarScheduleConfig {
  id                    String   @id @default(cuid())
  webinarId             String   @unique
  webinar               Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  // Event type
  eventType             EventType @default(RECURRING)

  // Date range
  startsAt              DateTime
  endsAt                DateTime?  // null = never ends

  // Recurring schedule (if eventType = RECURRING)
  recurringDays         Int[]      // 0=Sun, 1=Mon, etc. [1,3,5] = Mon,Wed,Fri
  recurringTimes        String[]   // ["09:00", "14:00", "18:00"]

  // Specific dates (if eventType = SPECIFIC_DATES)
  specificDates         DateTime[]

  // On-demand settings
  onDemandEnabled       Boolean  @default(false)
  onDemandUngated       Boolean  @default(false)  // No registration required

  // Just-in-time settings
  justInTimeEnabled     Boolean  @default(false)
  justInTimeMinutes     Int      @default(15)  // "Starting in X minutes"

  // Replay settings
  replayEnabled         Boolean  @default(true)
  replayUngated         Boolean  @default(false)
  replayExpiresAfter    Int?     // Days after session, null = never

  // Availability
  maxSessionsToShow     Int      @default(3)
  blackoutDates         DateTime[]

  // Timezone handling
  useAttendeeTimezone   Boolean  @default(false)  // false = fixed timezone

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum EventType {
  RECURRING       // Every week on specific days/times
  ONE_TIME        // Single event
  SPECIFIC_DATES  // Multiple specific dates
  ON_DEMAND_ONLY  // No scheduled sessions, only on-demand
}

// Individual webinar session (generated from schedule or manually created)
model WebinarSession {
  id            String   @id @default(cuid())
  webinarId     String
  webinar       Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  scheduledAt   DateTime
  type          SessionType

  // Stats (denormalized for quick access)
  registrationCount Int @default(0)
  attendeeCount     Int @default(0)

  createdAt     DateTime @default(now())

  registrations WebinarRegistration[]

  @@index([webinarId, scheduledAt])
}

enum SessionType {
  SCHEDULED
  JUST_IN_TIME
  ON_DEMAND
  REPLAY
}

// User registration for a webinar session
model WebinarRegistration {
  id              String   @id @default(cuid())

  webinarId       String
  webinar         Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  sessionId       String?  // null for on-demand
  session         WebinarSession? @relation(fields: [sessionId], references: [id])

  // Contact info (links to Contact if exists)
  email           String
  firstName       String?
  lastName        String?
  contactId       String?  // Link to existing Contact in your system

  // Access
  accessToken     String   @unique @default(cuid())  // For unique watch link

  // Session type they registered for
  sessionType     SessionType

  // Attendance tracking
  status          RegistrationStatus @default(REGISTERED)
  joinedAt        DateTime?
  leftAt          DateTime?
  watchTimeSeconds Int      @default(0)
  completedAt     DateTime?  // Watched to end

  // Engagement scores (calculated)
  engagementScore Float?

  // Timestamps
  registeredAt    DateTime @default(now())

  // Relations
  analyticsEvents WebinarAnalyticsEvent[]
  chatMessages    WebinarChatMessage[]
  pollResponses   WebinarPollResponse[]

  @@unique([webinarId, email, sessionId])
  @@index([accessToken])
  @@index([email])
}

enum RegistrationStatus {
  REGISTERED      // Signed up, hasn't attended
  ATTENDING       // Currently watching
  ATTENDED        // Watched (may or may not have completed)
  COMPLETED       // Watched to the end
  MISSED          // Didn't show up
}
```

#### Interactions Tables

```prisma
// Timed interactions (polls, CTAs, questions, downloads, etc.)
model WebinarInteraction {
  id              String   @id @default(cuid())
  webinarId       String
  webinar         Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  type            InteractionType
  triggersAt      Int      // Seconds into video when this appears
  duration        Int?     // How long it stays visible (null = until dismissed)

  // Content (JSON structure depends on type)
  title           String
  content         Json     // Type-specific content

  // Behavior
  pauseVideo      Boolean  @default(false)  // Pause video when shown
  required        Boolean  @default(false)  // Must interact to continue
  showOnReplay    Boolean  @default(true)   // Show in replay mode

  // Positioning
  position        InteractionPosition @default(BOTTOM_RIGHT)

  // Stats (denormalized)
  viewCount       Int      @default(0)
  actionCount     Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  pollResponses   WebinarPollResponse[]

  @@index([webinarId, triggersAt])
}

enum InteractionType {
  POLL            // Multiple choice question
  QUESTION        // Open-ended question (Q&A prompt)
  CTA             // Call to action button
  DOWNLOAD        // Downloadable resource
  FEEDBACK        // Rating/emoji feedback
  TIP             // Info tooltip
  SPECIAL_OFFER   // Timed offer with countdown
}

enum InteractionPosition {
  TOP_LEFT
  TOP_RIGHT
  BOTTOM_LEFT
  BOTTOM_RIGHT
  CENTER
  FULL_OVERLAY
}

// Poll responses
model WebinarPollResponse {
  id              String   @id @default(cuid())
  interactionId   String
  interaction     WebinarInteraction @relation(fields: [interactionId], references: [id], onDelete: Cascade)

  registrationId  String
  registration    WebinarRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)

  // Response
  selectedOptions Int[]    // For multiple choice: indices of selected options
  textResponse    String?  // For open-ended questions
  rating          Int?     // For feedback (1-5 or emoji index)

  respondedAt     DateTime @default(now())

  @@unique([interactionId, registrationId])
}
```

#### Chat Tables

```prisma
// Chat messages
model WebinarChatMessage {
  id              String   @id @default(cuid())
  webinarId       String

  registrationId  String?  // null = system/moderator message
  registration    WebinarRegistration? @relation(fields: [registrationId], references: [id])

  // For simulated chat (pre-recorded messages)
  isSimulated     Boolean  @default(false)
  appearsAt       Int?     // Seconds into video (for simulated)

  // Message content
  senderName      String
  message         String   @db.Text

  // Moderation
  isFromModerator Boolean  @default(false)
  isPrivateReply  Boolean  @default(false)  // Only visible to sender
  isHidden        Boolean  @default(false)  // Moderator hid this

  createdAt       DateTime @default(now())

  @@index([webinarId, createdAt])
  @@index([webinarId, appearsAt])  // For simulated chat lookup
}
```

#### Notifications Tables

```prisma
// Notification templates for a webinar
model WebinarNotification {
  id              String   @id @default(cuid())
  webinarId       String
  webinar         Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  type            NotificationType
  trigger         NotificationTrigger

  // Timing (for reminders)
  triggerMinutes  Int?     // Minutes before/after event

  // Email content
  subject         String
  bodyHtml        String   @db.Text
  bodyText        String?  @db.Text

  // Settings
  enabled         Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum NotificationType {
  CONFIRMATION    // Right after registration
  REMINDER        // Before webinar
  FOLLOW_UP       // After webinar
}

enum NotificationTrigger {
  // Confirmations
  REGISTERED_SCHEDULED     // Registered for scheduled session
  REGISTERED_REPLAY        // Registered for replay
  REGISTERED_ON_DEMAND     // Registered for on-demand

  // Reminders (triggerMinutes before scheduledAt)
  REMINDER_BEFORE          // X minutes before start

  // Follow-ups (triggerMinutes after session)
  FOLLOW_UP_ATTENDED       // Attended the webinar
  FOLLOW_UP_COMPLETED      // Watched to the end
  FOLLOW_UP_MISSED         // Didn't show up
  FOLLOW_UP_LEFT_EARLY     // Left before X% watched
}
```

#### Analytics Tables

```prisma
// Granular analytics events
model WebinarAnalyticsEvent {
  id              String   @id @default(cuid())
  webinarId       String
  webinar         Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  registrationId  String?
  registration    WebinarRegistration? @relation(fields: [registrationId], references: [id])

  // Event info
  eventType       AnalyticsEventType
  videoPosition   Int?     // Seconds into video
  metadata        Json?    // Event-specific data

  // Session info (for aggregation)
  sessionId       String?
  sessionType     SessionType?

  createdAt       DateTime @default(now())

  @@index([webinarId, eventType])
  @@index([registrationId, createdAt])
  @@index([webinarId, createdAt])
}

enum AnalyticsEventType {
  // Page events
  LANDING_PAGE_VIEW
  REGISTRATION_STARTED
  REGISTRATION_COMPLETED

  // Attendance events
  JOINED_WAITING_ROOM
  WEBINAR_STARTED
  WEBINAR_ENDED
  LEFT_EARLY
  REJOINED

  // Engagement events
  CHAT_SENT
  POLL_ANSWERED
  CTA_CLICKED
  DOWNLOAD_CLICKED
  QUESTION_SUBMITTED
  FEEDBACK_GIVEN
  REACTION_SENT    // Emoji reactions

  // Video events
  VIDEO_HEARTBEAT  // Sent every 30 seconds to track watch time
  VIDEO_BUFFERING
  VIDEO_ERROR

  // Replay events
  REPLAY_STARTED
  REPLAY_SEEKED
}
```

---

### 1.2 Admin Panel Pages

```
/admin/webinars
├── page.tsx                    # List all webinars
├── new/
│   └── page.tsx               # Create new webinar (wizard)
└── [id]/
    ├── page.tsx               # Webinar overview/edit
    ├── schedule/
    │   └── page.tsx           # Schedule configuration
    ├── interactions/
    │   └── page.tsx           # Manage polls, CTAs, etc.
    ├── notifications/
    │   └── page.tsx           # Email notifications setup
    ├── chat/
    │   └── page.tsx           # Simulated chat, moderation settings
    ├── registrations/
    │   └── page.tsx           # View all registrants
    └── analytics/
        └── page.tsx           # Full analytics dashboard
```

#### Admin Features Summary

| Page | Features |
|------|----------|
| **List** | All webinars with status, registrations, next session |
| **Create/Edit** | Title, description, video upload, presenter info, page paths |
| **Schedule** | Event type, recurring days/times, on-demand, just-in-time, replays, blackout dates |
| **Interactions** | Timeline editor, add polls/CTAs/downloads with timestamps |
| **Notifications** | Confirmation, reminder, follow-up emails with templates |
| **Chat** | Add simulated messages, moderation queue |
| **Registrations** | List registrants, attendance status, engagement scores |
| **Analytics** | Conversion funnel, watch time, engagement chart, per-interaction stats |

---

### 1.3 Public Webinar Pages

These are built manually per webinar (not auto-generated):

```
/[locale]/webinar/[slug]
├── page.tsx                   # Landing page (registration)
├── thank-you/
│   └── page.tsx              # Post-registration thank you
├── watch/
│   └── page.tsx              # Webinar room (scheduled/just-in-time)
└── replay/
    └── page.tsx              # Replay room (seekable)
```

#### URL Structure

| URL | Purpose |
|-----|---------|
| `/ka/webinar/ai-masterclass` | Landing page with registration form |
| `/ka/webinar/ai-masterclass/thank-you` | Thank you page after registration |
| `/ka/webinar/ai-masterclass/watch?token=xxx` | Live/scheduled viewing room |
| `/ka/webinar/ai-masterclass/replay?token=xxx` | Replay room with seeking |

The `token` is the unique `accessToken` from `WebinarRegistration`.

---

### 1.4 Webinar Room Components

```
src/components/webinar/
├── WebinarPlayer.tsx          # Main video player wrapper
├── InteractionOverlay.tsx     # Shows polls, CTAs at right time
├── ChatPanel.tsx              # Real-time chat sidebar
├── WaitingRoom.tsx            # Pre-webinar countdown
├── interactions/
│   ├── PollCard.tsx           # Poll interaction UI
│   ├── CTACard.tsx            # Call-to-action card
│   ├── DownloadCard.tsx       # Download resource card
│   ├── QuestionCard.tsx       # Q&A prompt
│   ├── FeedbackCard.tsx       # Rating/emoji feedback
│   └── SpecialOfferCard.tsx   # Timed offer with countdown
├── ReactionBar.tsx            # Emoji reaction buttons
└── AttendeeCount.tsx          # Show viewer count (real or simulated)
```

#### Player Behavior

**Scheduled/Just-in-time mode:**
- No seeking (progress bar hidden or disabled)
- Video position synced with server time
- If user joins late, they see current position
- If user leaves and returns, resume from current live position OR where they left (configurable)
- Interactions trigger at specific timestamps

**Replay/On-demand mode:**
- Full seeking allowed
- Interactions still trigger at timestamps (but can be dismissed/skipped)
- Progress saved, can resume later

---

### 1.5 Real-Time Infrastructure

#### Chat with SSE + Redis

```
┌─────────────┐    POST /api/webinar/chat    ┌─────────────┐
│   Browser   │ ─────────────────────────────▶│  Next.js    │
│  (Client)   │                               │   API       │
└─────────────┘                               └──────┬──────┘
       ▲                                             │
       │                                             ▼
       │ SSE stream                            ┌─────────────┐
       │ GET /api/webinar/chat/stream          │   Redis     │
       │                                       │  Pub/Sub    │
       │                                       └──────┬──────┘
       │                                             │
       └─────────────────────────────────────────────┘
```

**How it works:**
1. Client connects to SSE endpoint with registration token
2. Client sends messages via POST (saved to DB, published to Redis)
3. All clients subscribed to that webinar receive message via SSE
4. Simulated chat messages are injected by server at correct timestamps

#### Analytics Events

```
Browser sends heartbeat every 30 seconds:
POST /api/webinar/analytics
{
  "token": "xxx",
  "eventType": "VIDEO_HEARTBEAT",
  "videoPosition": 342
}
```

Events are batched and written to database.

---

### 1.6 Notification System

Since you'll build a broader automation system later, we'll design notifications to be compatible:

```
┌─────────────────────────────────────────────────────────────┐
│                   WebinarNotification                        │
│  (Webinar-specific notification templates)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   NotificationQueue                          │
│  (Scheduled emails to be sent)                              │
│  - recipientEmail                                           │
│  - templateId (WebinarNotification)                         │
│  - scheduledFor                                             │
│  - variables (name, webinar title, link, etc.)              │
│  - status (pending, sent, failed)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cron Job / Worker                          │
│  (Checks queue every minute, sends due emails via Postmark) │
└─────────────────────────────────────────────────────────────┘
```

This queue-based approach will easily extend to your future automation system.

---

## Phase 2: Live Webinars (Future)

### 2.1 Low-Latency Streaming

**Cloudflare Stream WebRTC** for ~1 second latency:
- Presenter streams via WebRTC to Cloudflare
- Viewers receive via WebRTC (falls back to HLS if needed)
- Supports 10,000+ concurrent viewers

### 2.2 Presenter Dashboard

```
/admin/webinars/[id]/live
├── Go live controls (start/stop stream)
├── Real-time viewer count
├── Incoming questions queue
├── Poll launcher
├── Attendee engagement indicators
└── Stream health metrics
```

### 2.3 Viewer Features

- Real-time chat with moderator
- Hand raise / request to speak
- Live polls with instant results
- Emoji reactions overlaid on video

---

## Phase 3: Advanced Features (Future)

### 3.1 A/B Testing
- Test different interaction timings
- Test different CTA copy
- Track conversion per variant

### 3.2 Automation Integration
- Connect to broader automation builder
- Trigger automations based on webinar events
- Lead scoring based on engagement

### 3.3 Payment Integration
- Paid webinar registration
- Hybrid (free intro, paid full)
- Integration with Stripe

---

## Implementation Order

### Sprint 1: Database & Admin Foundation
- [x] Create Prisma schema with all tables ✅ (2024-01-XX)
- [x] Run migrations ✅
- [x] Build admin layout for webinars section ✅
- [x] Webinar list page (CRUD) ✅
- [x] Webinar create/edit form (basic fields) ✅
- [x] Video upload to Cloudflare Stream ✅

### Sprint 2: Schedule & Sessions
- [x] Schedule configuration form (all event types) ✅
- [x] Session generation logic (from recurring schedule) ✅
- [x] Just-in-time session logic ✅
- [x] Timezone handling ✅

### Sprint 3: Registration Flow
- [x] Registration API endpoint ✅
- [x] Generate unique access tokens ✅
- [x] Link registrations to existing contacts ✅
- [x] Access validation API ✅
- [ ] Thank you page redirect

### Sprint 4: Webinar Room (Core)
- [x] Cloudflare Stream player integration ✅
- [x] Waiting room with countdown ✅
- [x] Video playback (no seeking for scheduled) ✅
- [x] Position sync with server time ✅
- [x] Resume/rejoin handling ✅
- [x] Watch page with access validation ✅

### Sprint 5: Interactions
- [x] Interaction timeline editor in admin ✅
- [x] Poll creation/editing ✅
- [x] CTA creation/editing ✅
- [x] Download attachments ✅
- [x] Interaction overlay component ✅
- [x] Timed triggering logic ✅
- [x] Feedback, Tips, Special Offers ✅

### Sprint 6: Chat System
- [x] SSE endpoint for real-time messages ✅
- [x] Chat panel component ✅
- [x] Simulated chat messages (pre-recorded) ✅
- [ ] Redis pub/sub (currently using polling)
- [ ] Moderator replies

### Sprint 7: Notifications
- [x] Notification template CRUD in admin ✅
- [x] Email queue system ✅
- [x] Queue worker (cron job) ✅
- [x] Default notification templates ✅
- [x] Reminder scheduling on registration ✅
- [x] Follow-up notifications ✅

### Sprint 8: Analytics
- [x] Analytics event ingestion API ✅
- [x] Video heartbeat tracking (via watch progress) ✅
- [x] Engagement score calculation ✅ (2025-11-26)
- [x] Admin analytics dashboard ✅
- [x] Conversion funnel visualization ✅
- [x] Per-interaction stats ✅
- [x] Engagement score distribution & top engaged leaderboard ✅ (2025-11-26)

### Sprint 9: Replay System
- [x] Replay room with seeking (same as on-demand) ✅
- [x] Mark sessions as replay-available (admin UI in ScheduleConfigForm) ✅
- [x] Replay registration flow ✅
- [x] Replay expiration logic ✅ (2025-11-26)
- [x] Replay enabled/disabled check ✅ (2025-11-26)
- [x] Localized error messages for expired/disabled replays ✅ (2025-11-26)

### Sprint 10: Polish & Testing
- [x] Error handling improvements ✅ (2025-11-26)
- [x] Loading states (player, chat, room) ✅ (2025-11-26)
- [x] Mobile responsiveness (interaction overlay, webinar room) ✅ (2025-11-26)
- [ ] E2E testing of full flow
- [ ] Performance optimization

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Video hosting | Cloudflare Stream | Already have it, cost effective, reliable |
| Real-time chat | SSE + Redis | Minimal new services, Railway has Redis |
| Email | Postmark | Already integrated |
| Low-latency live | Cloudflare WebRTC | Same vendor, ~1s latency |
| Notifications | Queue-based | Extensible to future automation system |
| Landing pages | Manual code | More control, no builder needed |
| Analytics | Custom built | Tailored to exact needs |

---

## File Structure (New Files)

```
src/
├── app/
│   ├── admin/
│   │   └── webinars/
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           ├── schedule/page.tsx
│   │           ├── interactions/page.tsx
│   │           ├── notifications/page.tsx
│   │           ├── chat/page.tsx
│   │           ├── registrations/page.tsx
│   │           └── analytics/page.tsx
│   ├── [locale]/
│   │   └── webinar/
│   │       └── [slug]/
│   │           ├── page.tsx           # Landing (manual per webinar)
│   │           ├── thank-you/page.tsx
│   │           ├── watch/page.tsx
│   │           └── replay/page.tsx
│   └── api/
│       └── webinar/
│           ├── register/route.ts
│           ├── chat/
│           │   ├── route.ts           # POST messages
│           │   └── stream/route.ts    # SSE endpoint
│           ├── analytics/route.ts
│           ├── interactions/route.ts  # Get/respond to interactions
│           └── session/route.ts       # Get available sessions
├── components/
│   └── webinar/
│       ├── WebinarPlayer.tsx
│       ├── InteractionOverlay.tsx
│       ├── ChatPanel.tsx
│       ├── WaitingRoom.tsx
│       ├── ReactionBar.tsx
│       └── interactions/
│           ├── PollCard.tsx
│           ├── CTACard.tsx
│           └── ...
├── lib/
│   └── webinar/
│       ├── cloudflare-stream.ts       # Upload, get playback URLs
│       ├── session-generator.ts       # Generate sessions from schedule
│       ├── interaction-engine.ts      # Timing logic for interactions
│       └── analytics.ts               # Aggregation queries
└── prisma/
    └── schema.prisma                  # Updated with webinar tables
```

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Account required? | No, email-only registration with unique token |
| Schedule system | Like eWebinar: recurring, one-time, specific dates, on-demand, just-in-time, replays |
| Seeking in scheduled | No (simulated live), yes in replay |
| Leave and return | Resume from where they left off |
| Chat for evergreen | Real chat with other concurrent viewers + simulated messages |
| Landing page builder | No, manual code per webinar |
| Notifications | Part of queue system, extensible to future automations |
| Admin roles | Single admin level for now |
| Analytics | Full eWebinar-style analytics |
| Paid webinars | Future phase |

---

## Ready to Start

We begin with **Sprint 1: Database & Admin Foundation**

First task: Add Prisma schema for all webinar tables.
