# Facebook Pixel Integration Plan

## Overview

Implement comprehensive Facebook Pixel tracking with both client-side (Browser Pixel) and server-side (Conversions API) for maximum accuracy and iOS 14+ compatibility.

---

## Phase 1: Database Schema & Configuration

### 1.1 Add PixelConfig to Settings or Create New Table
```prisma
model PixelConfig {
  id            String   @id @default("default")
  pixelId       String?  // Facebook Pixel ID
  accessToken   String?  // Conversions API Access Token
  testEventCode String?  // e.g., "TEST4243" for testing
  enabled       Boolean  @default(false)
  testMode      Boolean  @default(false)
  updatedAt     DateTime @updatedAt
}
```

### 1.2 Add PixelEventLog for Debugging
```prisma
model PixelEventLog {
  id          String   @id @default(cuid())
  eventId     String   // Deduplication ID (same for client+server)
  eventName   String   // PageView, ViewContent, etc.
  source      String   // 'client' | 'server'
  pageType    String   // blog, webinar, lms, landing, home
  pageUrl     String
  userId      String?  // Authenticated user ID
  contactId   String?  // CRM contact ID if available
  fbp         String?  // _fbp cookie value
  fbc         String?  // _fbc cookie (from fbclid URL param)
  eventData   Json?    // Custom parameters
  userData    Json?    // Hashed user data sent (for debugging)
  status      String   // 'sent' | 'failed' | 'test'
  errorMsg    String?  // Error message if failed
  fbResponse  Json?    // Facebook API response
  createdAt   DateTime @default(now())

  @@index([createdAt])
  @@index([eventName])
  @@index([status])
  @@index([source])
}
```

### 1.3 Database Migration
- [ ] Add models to schema.prisma
- [ ] Run `prisma db push`

---

## Phase 2: Core Library (`src/lib/pixel/`)

### 2.1 Types & Constants (`types.ts`)
```typescript
// Standard Facebook events
type StandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'Purchase'

// Custom events for our platform
type CustomEvent =
  | 'WebinarStarted'
  | 'WebinarEngaged'
  | 'WebinarCompleted'
  | 'WebinarCTAClick'
  | 'CourseStarted'
  | 'LessonCompleted'
  | 'CourseCompleted'

// Event parameters
interface EventParams {
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
  // Custom params
  webinar_id?: string
  course_id?: string
  lesson_id?: string
  [key: string]: any
}
```

### 2.2 Server-Side Conversions API (`server.ts`)
- [ ] Function to send events to Facebook Conversions API
- [ ] Hash user data (SHA-256): email, phone, name, etc.
- [ ] Include browser data: IP, User-Agent, fbp, fbc
- [ ] Handle test mode (add test_event_code)
- [ ] Log events to PixelEventLog
- [ ] Error handling and retry logic

### 2.3 Configuration Helpers (`config.ts`)
- [ ] `getPixelConfig()` - fetch from database with caching
- [ ] `isPixelEnabled()` - check if pixel is configured and enabled
- [ ] `isTestMode()` - check if test mode is active

### 2.4 Event ID Generator (`utils.ts`)
- [ ] Generate unique event_id for deduplication
- [ ] Format: `{timestamp}-{random}-{eventName}`

---

## Phase 3: Client-Side Implementation

### 3.1 Pixel Script Component (`src/components/analytics/FacebookPixel.tsx`)
- [ ] Conditionally load fbq script based on config
- [ ] Initialize with Pixel ID
- [ ] Handle consent (if needed in future)
- [ ] Track automatic PageView

### 3.2 Analytics Provider (`src/providers/AnalyticsProvider.tsx`)
- [ ] Wrap app with pixel context
- [ ] Provide `trackEvent` function to children
- [ ] Handle fbp/fbc cookie management

### 3.3 usePixel Hook (`src/hooks/usePixel.ts`)
```typescript
const {
  trackEvent,      // Manual event tracking
  trackPageView,   // Track page view
  isEnabled,       // Check if pixel is active
} = usePixel()
```

### 3.4 useViewContentTracker Hook (`src/hooks/useViewContentTracker.ts`)
- [ ] Track scroll percentage
- [ ] Track time on page
- [ ] Fire ViewContent when thresholds met
- [ ] Configurable thresholds per page type

---

## Phase 4: API Endpoints

### 4.1 Pixel Configuration API (`/api/admin/pixel/config`)
- [ ] `GET` - Fetch current config
- [ ] `PUT` - Update config (Pixel ID, Access Token, etc.)

### 4.2 Pixel Event Tracking API (`/api/pixel/track`)
- [ ] `POST` - Receive events from client, forward to Facebook server-side
- [ ] Validate event data
- [ ] Generate event_id if not provided
- [ ] Send to Conversions API
- [ ] Log to PixelEventLog

### 4.3 Pixel Event Logs API (`/api/admin/pixel/logs`)
- [ ] `GET` - Fetch recent logs with pagination & filters
- [ ] Filter by: eventName, source, status, pageType, date range

### 4.4 Cleanup Cron (`/api/cron/pixel-cleanup`)
- [ ] Delete logs older than 7 days
- [ ] Run daily

---

## Phase 5: Admin Panel UI

### 5.1 Settings Page (`/admin/settings`)
Add Facebook Pixel section:
- [ ] Pixel ID input
- [ ] Access Token input (password field)
- [ ] Enable/Disable toggle
- [ ] Test Mode toggle
- [ ] Test Event Code input (shown when test mode is on)
- [ ] "Test Connection" button
- [ ] Link to Event Logs

### 5.2 Event Logs Page (`/admin/pixel-logs`)
- [ ] Table with columns: Event, Page Type, Source, Status, Time
- [ ] Filters: Event type, Source (client/server), Status, Date range
- [ ] Expandable rows to see full event data
- [ ] Auto-refresh toggle
- [ ] Export to CSV (optional)

---

## Phase 6: Page-Specific Integration

### 6.1 Blog Posts (`/blog/[slug]`)
- [ ] PageView on load
- [ ] ViewContent when: 70% scroll AND 70% of readingTimeMinutes
- [ ] Pass content_name, content_id, content_category

### 6.2 Webinar Landing Pages
- [ ] PageView on load
- [ ] ViewContent when: 60% scroll OR 30s on page
- [ ] CompleteRegistration on form submit

### 6.3 Webinar Watch Room
- [ ] WebinarStarted when video plays
- [ ] WebinarEngaged at 50% watch time
- [ ] WebinarCompleted at completionPercent threshold
- [ ] WebinarCTAClick on any CTA interaction

### 6.4 LMS Course Pages
- [ ] PageView on load
- [ ] CompleteRegistration on enrollment
- [ ] CourseStarted on first lesson start
- [ ] LessonCompleted on each lesson completion
- [ ] CourseCompleted when all lessons done

### 6.5 Landing Pages (Home, About, etc.)
- [ ] PageView on load
- [ ] ViewContent when: 50% scroll OR 20s on page

---

## Phase 7: Testing & Validation

### 7.1 Test Mode Validation
- [ ] Verify events appear in Facebook Events Manager Test Events
- [ ] Check event_id deduplication is working
- [ ] Validate user data hashing

### 7.2 Production Validation
- [ ] Monitor Event Match Quality in Facebook
- [ ] Check for duplicate events
- [ ] Verify all page types are tracking

---

## Events Summary

| Event Name | Type | Page | Trigger |
|------------|------|------|---------|
| `PageView` | Standard | All | Page load |
| `ViewContent` | Standard | Blog | 70% scroll + 70% read time |
| `ViewContent` | Standard | Webinar Landing | 60% scroll OR 30s |
| `ViewContent` | Standard | Home/About | 50% scroll OR 20s |
| `CompleteRegistration` | Standard | Webinar | Form submit |
| `CompleteRegistration` | Standard | LMS | Course enrollment |
| `WebinarStarted` | Custom | Webinar Watch | Video plays |
| `WebinarEngaged` | Custom | Webinar Watch | 50% watched |
| `WebinarCompleted` | Custom | Webinar Watch | completionPercent reached |
| `WebinarCTAClick` | Custom | Webinar Watch | CTA clicked |
| `CourseStarted` | Custom | LMS | First lesson starts |
| `LessonCompleted` | Custom | LMS | Lesson completed |
| `CourseCompleted` | Custom | LMS | All lessons done |

---

## File Structure

```
src/
├── lib/
│   └── pixel/
│       ├── index.ts          # Main exports
│       ├── types.ts          # Types & constants
│       ├── config.ts         # Configuration helpers
│       ├── server.ts         # Conversions API
│       ├── client.ts         # Client-side helpers
│       └── utils.ts          # Hashing, event ID generation
├── hooks/
│   ├── usePixel.ts           # Main pixel hook
│   └── useViewContentTracker.ts  # Scroll/time tracking
├── components/
│   └── analytics/
│       └── FacebookPixel.tsx # Script loader component
├── providers/
│   └── AnalyticsProvider.tsx # Context provider (update existing)
└── app/
    ├── api/
    │   ├── pixel/
    │   │   └── track/
    │   │       └── route.ts  # Event tracking endpoint
    │   ├── admin/
    │   │   └── pixel/
    │   │       ├── config/
    │   │       │   └── route.ts
    │   │       └── logs/
    │   │           └── route.ts
    │   └── cron/
    │       └── pixel-cleanup/
    │           └── route.ts
    └── admin/
        ├── settings/
        │   └── page.tsx      # Add Pixel config section
        └── pixel-logs/
            └── page.tsx      # Event logs viewer
```

---

## Implementation Order

1. **Database** - Schema changes
2. **Core Library** - `src/lib/pixel/*`
3. **API Endpoints** - Config & tracking
4. **Admin UI** - Settings page
5. **Client Components** - Provider, hooks
6. **Page Integration** - Blog, Webinar, LMS
7. **Event Logs UI** - Admin logs page
8. **Cleanup Cron** - 7-day retention
9. **Testing** - Test mode validation

---

## Dependencies

No new packages needed. We'll use:
- `crypto` (Node.js built-in) for SHA-256 hashing
- `fetch` for Conversions API calls
- Existing Prisma setup for database

---

## Security Considerations

- Access Token stored securely in database (not in env)
- User data always hashed before sending to Facebook
- API endpoints protected by admin authentication
- Event logs auto-deleted after 7 days (GDPR compliance)
