# LMS Implementation Plan

> **Project**: Nebiswera Learning Management System
> **Created**: 2025-12-05
> **Status**: Phase 8 Complete (Quiz Player)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Schema](#database-schema)
4. [Implementation Phases](#implementation-phases)
5. [API Routes](#api-routes)
6. [Admin Panel Pages](#admin-panel-pages)
7. [User-Facing Pages](#user-facing-pages)
8. [Component Structure](#component-structure)
9. [Progress Tracking System](#progress-tracking-system)
10. [Notification System](#notification-system)
11. [Analytics System](#analytics-system)
12. [Open Access (localStorage) System](#open-access-localstorage-system)
13. [Future Considerations](#future-considerations)

---

## Overview

### What We're Building

A flexible, minimalist LMS that allows:
- **Course Creation**: Hierarchical content (Course → Modules → Lessons → Parts)
- **Flexible Structure**: Modules are optional (Course → Lessons → Parts also valid)
- **Rich Content**: Block-based content system (text, video, audio, html, image, file, embed, quiz)
- **Three Access Types**: Open (localStorage), Free (account required), Paid (enrollment required)
- **Progress Tracking**: Auto-complete, manual complete, quiz gates
- **Course Player**: Sidebar navigation + linear progression
- **Student Management**: Enrollment, progress tracking, notifications
- **Analytics**: Comprehensive course and student analytics

### Key Design Principles

1. **Minimalist UX** - Clean, distraction-free learning experience
2. **Mobile-First** - Responsive player that works on all devices
3. **Reuse Existing Patterns** - Mirror webinar system architecture
4. **Prepared for Payments** - Enrollment system ready for payment integration
5. **Prepared for Community** - Courses can later be attached to communities

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema | New `lms` schema | Clean separation, matches webinar pattern |
| Content | Block-based | Flexible, allows mixed content per level |
| Hierarchy | Flexible | Modules optional for simple courses |
| Language | Single per course | Simpler content management |
| Versioning | Live updates | All students see new version immediately |
| Video Completion | Configurable % | Course-level setting (default 90%) |
| Quiz Retries | Configurable | Per-quiz max attempts setting |
| Open → Account | Migrate progress | Incentivize account creation |
| Notifications | Mirror webinar | Reuse notification patterns |

---

## Database Schema

### New Schema: `lms`

```prisma
// ============================================
// LMS SCHEMA - Learning Management System
// ============================================

// ----------------
// CORE ENTITIES
// ----------------

model Course {
  id          String   @id @default(cuid())

  // Basic Info
  slug        String   @unique
  title       String
  description String?  @db.Text
  thumbnail   String?  // Bunny CDN URL
  locale      String   @default("ka") // "ka" or "en"

  // Access Control
  accessType  CourseAccessType @default(FREE) // OPEN, FREE, PAID
  price       Decimal?  @db.Decimal(10, 2) // For future payment system
  currency    String?   @default("GEL")

  // Settings
  settings    Json      @default("{}") // CourseSettings type
  // {
  //   videoCompletionThreshold: number (0-100, default 90)
  //   sequentialLock: boolean (must complete previous)
  //   dripContent: boolean (unlock over time)
  //   dripIntervalDays: number (days between unlocks)
  //   expirationDays: number | null (access expires after enrollment)
  //   certificateEnabled: boolean
  //   certificateTemplate: string | null
  // }

  // Publishing
  status      CourseStatus @default(DRAFT)
  version     Int       @default(1)
  publishedAt DateTime?

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  modules     Module[]
  lessons     Lesson[]  // Direct lessons (no module)
  enrollments Enrollment[]
  prerequisites CoursePrerequisite[] @relation("course")
  prerequisiteFor CoursePrerequisite[] @relation("prerequisite")
  notifications CourseNotificationConfig[]
  analyticsEvents CourseAnalyticsEvent[]

  @@schema("lms")
}

enum CourseAccessType {
  OPEN  // No login, localStorage tracking
  FREE  // Login required, free access
  PAID  // Login + enrollment required

  @@schema("lms")
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED

  @@schema("lms")
}

model CoursePrerequisite {
  id             String   @id @default(cuid())
  courseId       String
  prerequisiteId String

  course       Course @relation("course", fields: [courseId], references: [id], onDelete: Cascade)
  prerequisite Course @relation("prerequisite", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@unique([courseId, prerequisiteId])
  @@schema("lms")
}

model Module {
  id          String   @id @default(cuid())
  courseId    String

  // Basic Info
  title       String
  description String?  @db.Text

  // Ordering
  order       Int      @default(0)

  // Drip Content
  availableAfterDays Int? // Days after enrollment to unlock

  // Content Blocks (JSON array)
  contentBlocks Json    @default("[]") // ContentBlock[]

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons     Lesson[]

  @@schema("lms")
}

model Lesson {
  id          String   @id @default(cuid())
  courseId    String
  moduleId    String?  // Nullable - lesson can be directly under course

  // Basic Info
  title       String
  description String?  @db.Text

  // Ordering
  order       Int      @default(0)

  // Drip Content
  availableAfterDays Int? // Days after enrollment to unlock

  // Content Blocks (JSON array)
  contentBlocks Json    @default("[]") // ContentBlock[]

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  module      Module?  @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  parts       Part[]

  @@schema("lms")
}

model Part {
  id          String   @id @default(cuid())
  lessonId    String

  // Basic Info
  title       String
  description String?  @db.Text

  // Ordering
  order       Int      @default(0)

  // Content Blocks (JSON array)
  contentBlocks Json    @default("[]") // ContentBlock[]

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  progress    PartProgress[]

  @@schema("lms")
}

// ----------------
// CONTENT BLOCKS (JSON Type Definition)
// ----------------

// ContentBlock type (stored as JSON in contentBlocks field):
// {
//   id: string (cuid)
//   type: "text" | "video" | "audio" | "html" | "image" | "file" | "embed" | "quiz"
//   order: number
//
//   // Type-specific data:
//   // TEXT: { content: string (markdown/rich text) }
//   // VIDEO: { url: string, duration: number, thumbnail?: string }
//   // AUDIO: { url: string, duration: number }
//   // HTML: { content: string (raw html) }
//   // IMAGE: { url: string, alt?: string, caption?: string }
//   // FILE: { url: string, filename: string, size: number, mimeType: string }
//   // EMBED: { provider: string, embedUrl: string, aspectRatio?: string }
//   // QUIZ: { quizId: string } // References Quiz model
// }

// ----------------
// QUIZ SYSTEM
// ----------------

model Quiz {
  id          String   @id @default(cuid())

  // Basic Info
  title       String
  description String?  @db.Text

  // Settings
  passingScore    Int      @default(70) // Percentage to pass
  maxAttempts     Int?     // Null = unlimited
  shuffleQuestions Boolean @default(false)
  shuffleOptions  Boolean  @default(false)
  showCorrectAnswers Boolean @default(true) // Show after submission

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  questions   QuizQuestion[]
  attempts    QuizAttempt[]

  @@schema("lms")
}

model QuizQuestion {
  id          String   @id @default(cuid())
  quizId      String

  // Question
  type        QuestionType
  question    String   @db.Text
  explanation String?  @db.Text // Shown after answer
  points      Int      @default(1)
  order       Int      @default(0)

  // Options (for multiple choice)
  options     Json     @default("[]") // QuizOption[]
  // QuizOption: { id: string, text: string, isCorrect: boolean }

  // For text/essay questions
  correctAnswer String? @db.Text // For short answer validation

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers     QuizAnswer[]

  @@schema("lms")
}

enum QuestionType {
  MULTIPLE_CHOICE_SINGLE   // Radio buttons
  MULTIPLE_CHOICE_MULTIPLE // Checkboxes
  TRUE_FALSE
  SHORT_ANSWER             // Text input, auto-graded
  ESSAY                    // Long text, manual grading

  @@schema("lms")
}

model QuizAttempt {
  id          String   @id @default(cuid())
  quizId      String
  userId      String?  // Null for open courses
  anonymousId String?  // For open courses (localStorage ID)

  // Results
  score       Int?     // Percentage (null if not graded yet)
  passed      Boolean?
  startedAt   DateTime @default(now())
  completedAt DateTime?

  // Relations
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers     QuizAnswer[]

  @@schema("lms")
}

model QuizAnswer {
  id          String   @id @default(cuid())
  attemptId   String
  questionId  String

  // Answer
  selectedOptions Json?   // Array of option IDs for multiple choice
  textAnswer      String? @db.Text // For text/essay

  // Grading
  isCorrect   Boolean?
  pointsAwarded Int?
  feedback    String?  @db.Text // Manual feedback for essays

  // Relations
  attempt     QuizAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question    QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@schema("lms")
}

// ----------------
// ENROLLMENT & PROGRESS
// ----------------

model Enrollment {
  id          String   @id @default(cuid())
  courseId    String
  userId      String

  // Status
  status      EnrollmentStatus @default(ACTIVE)

  // Access
  enrolledAt  DateTime @default(now())
  expiresAt   DateTime? // Based on course settings

  // Progress Summary (cached for performance)
  progressPercent Int    @default(0)
  completedAt     DateTime?

  // Certificate
  certificateId   String? @unique
  certificateUrl  String?
  certificateIssuedAt DateTime?

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  partProgress PartProgress[]

  @@unique([courseId, userId])
  @@schema("lms")
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  EXPIRED
  SUSPENDED // Admin suspended access

  @@schema("lms")
}

model PartProgress {
  id           String   @id @default(cuid())
  enrollmentId String
  partId       String

  // Progress
  status       ProgressStatus @default(NOT_STARTED)

  // Video/Audio tracking
  watchTime    Int      @default(0) // Seconds watched
  duration     Int?     // Total duration (cached from content)
  watchPercent Int      @default(0) // Percentage watched

  // Completion
  completedAt  DateTime?
  completedBy  CompletionType? // How it was completed

  // Metadata
  lastAccessedAt DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  enrollment  Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  part        Part       @relation(fields: [partId], references: [id], onDelete: Cascade)

  @@unique([enrollmentId, partId])
  @@schema("lms")
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED

  @@schema("lms")
}

enum CompletionType {
  AUTO_VIDEO      // Video watched past threshold
  AUTO_QUIZ       // Quiz passed
  MANUAL          // User marked complete
  ADMIN           // Admin marked complete

  @@schema("lms")
}

// ----------------
// NOTIFICATIONS
// ----------------

model CourseNotificationConfig {
  id          String   @id @default(cuid())
  courseId    String

  // Trigger
  trigger     CourseNotificationTrigger

  // Timing (for scheduled triggers)
  delayMinutes Int?    // Delay after trigger

  // Content
  subject     String
  body        String   @db.Text // HTML email body

  // Status
  enabled     Boolean  @default(true)

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  logs        CourseNotificationLog[]

  @@schema("lms")
}

enum CourseNotificationTrigger {
  ON_ENROLLMENT           // Immediately after enrollment
  AFTER_ENROLLMENT        // X minutes after enrollment
  ON_COMPLETION           // When course completed
  ON_INACTIVITY           // When student inactive for X days
  BEFORE_EXPIRATION       // X days before access expires
  ON_QUIZ_PASS            // When quiz passed
  ON_QUIZ_FAIL            // When quiz failed

  @@schema("lms")
}

model CourseNotificationLog {
  id          String   @id @default(cuid())
  configId    String
  enrollmentId String

  // Status
  sentAt      DateTime @default(now())
  status      String   // SENT, DELIVERED, OPENED, CLICKED, BOUNCED

  // Postmark tracking
  messageId   String?

  // Relations
  config      CourseNotificationConfig @relation(fields: [configId], references: [id], onDelete: Cascade)

  @@schema("lms")
}

// ----------------
// ANALYTICS
// ----------------

model CourseAnalyticsEvent {
  id          String   @id @default(cuid())
  courseId    String
  userId      String?
  anonymousId String?  // For open courses
  enrollmentId String?

  // Event
  eventType   CourseEventType
  eventData   Json     @default("{}")

  // Context
  partId      String?
  lessonId    String?
  moduleId    String?
  quizId      String?

  // Client Info
  userAgent   String?
  ipAddress   String?

  // Timestamp
  createdAt   DateTime @default(now())

  // Relations
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([courseId, eventType])
  @@index([userId])
  @@index([anonymousId])
  @@schema("lms")
}

enum CourseEventType {
  // Enrollment
  ENROLLED
  ENROLLMENT_EXPIRED

  // Navigation
  COURSE_VIEWED
  MODULE_VIEWED
  LESSON_VIEWED
  PART_VIEWED

  // Content
  VIDEO_STARTED
  VIDEO_PROGRESS     // Every 10% milestone
  VIDEO_COMPLETED
  VIDEO_SEEKED
  AUDIO_STARTED
  AUDIO_COMPLETED
  FILE_DOWNLOADED
  EMBED_VIEWED

  // Progress
  PART_COMPLETED
  LESSON_COMPLETED
  MODULE_COMPLETED
  COURSE_COMPLETED

  // Quiz
  QUIZ_STARTED
  QUIZ_SUBMITTED
  QUIZ_PASSED
  QUIZ_FAILED
  QUIZ_RETRIED

  // Certificate
  CERTIFICATE_GENERATED
  CERTIFICATE_DOWNLOADED

  // Engagement
  RESUMED_AFTER_INACTIVITY

  @@schema("lms")
}

// ----------------
// CERTIFICATES
// ----------------

model Certificate {
  id           String   @id @default(cuid())

  // Verification
  verificationCode String @unique // Public verification ID

  // Content (for PDF generation)
  studentName  String
  courseName   String
  completedAt  DateTime

  // Template used
  templateData Json     @default("{}")

  // Generated PDF
  pdfUrl       String?  // Bunny CDN URL

  // Metadata
  createdAt    DateTime @default(now())

  @@schema("lms")
}
```

### User Model Addition (public schema)

```prisma
// Add to existing User model:
model User {
  // ... existing fields ...

  // LMS Relations
  enrollments    Enrollment[]
  quizAttempts   QuizAttempt[]
}
```

---

## Implementation Phases

### Phase 1: Foundation (Database & Core Models) ✅ COMPLETE
- [x] Create `lms` schema in Prisma
- [x] Add all models (Course, Module, Lesson, Part, Quiz, etc.)
- [x] Add Enrollment and Progress models
- [x] Run migrations
- [x] Create TypeScript types for JSON fields (ContentBlock, CourseSettings, etc.)
- [x] Add Bunny storage paths for LMS uploads
- [x] Add progress calculation utilities

### Phase 2: Admin - Course Builder ✅ COMPLETE
- [x] Course list page (`/admin/courses`)
- [x] Course create/edit form (basic info, settings)
- [x] Module management (add, reorder, delete)
- [x] Lesson management (add, reorder, delete, assign to module)
- [x] Part management (add, reorder, delete)
- [x] Course settings page (video threshold, locks, drip, expiration, certificates)
- [x] Content block editor component (reusable)
  - [x] Text block (markdown editor)
  - [x] Video block (upload + Bunny Stream integration)
  - [x] Audio block (upload)
  - [x] HTML block (code editor)
  - [x] Image block (upload)
  - [x] File block (upload)
  - [x] Embed block (YouTube, Vimeo, custom)
  - [x] Quiz block (quiz ID reference)
- [x] Media upload API (`/api/admin/courses/media/upload`)

**Files Created:**
- `/src/app/admin/courses/page.tsx` - Course list
- `/src/app/admin/courses/CoursesTable.tsx` - Courses table with filters
- `/src/app/admin/courses/new/page.tsx` - Create course form
- `/src/app/admin/courses/[id]/page.tsx` - Course editor with navigation
- `/src/app/admin/courses/[id]/content/page.tsx` - Content builder (modules/lessons/parts)
- `/src/app/admin/courses/[id]/content/[partId]/page.tsx` - Part content editor with blocks
- `/src/app/admin/courses/[id]/settings/page.tsx` - Course settings form
- `/src/app/api/admin/courses/route.ts` - Courses CRUD
- `/src/app/api/admin/courses/[id]/route.ts` - Single course CRUD
- `/src/app/api/admin/courses/[id]/publish/route.ts` - Publish/unpublish/archive
- `/src/app/api/admin/courses/[id]/duplicate/route.ts` - Course duplication
- `/src/app/api/admin/courses/[id]/modules/route.ts` - Modules list/create
- `/src/app/api/admin/courses/[id]/modules/[moduleId]/route.ts` - Module CRUD
- `/src/app/api/admin/courses/[id]/lessons/route.ts` - Lessons list/create
- `/src/app/api/admin/courses/[id]/lessons/[lessonId]/route.ts` - Lesson CRUD
- `/src/app/api/admin/courses/[id]/parts/route.ts` - Parts list/create
- `/src/app/api/admin/courses/[id]/parts/[partId]/route.ts` - Part CRUD
- `/src/app/api/admin/courses/[id]/reorder/route.ts` - Reorder modules/lessons/parts
- `/src/app/api/admin/courses/media/upload/route.ts` - Media upload (video/audio/image/file)

### Phase 3: Admin - Quiz Builder ✅ COMPLETE
- [x] Quiz list page (`/admin/courses/[id]/quizzes`)
- [x] Quiz create/edit form (settings: passing score, max attempts, cooldown, shuffle)
- [x] Question editor
  - [x] Multiple choice (single) - Radio buttons
  - [x] Multiple choice (multiple) - Checkboxes
  - [x] True/False - Binary choice
  - [x] Short answer - Text input, auto-graded
  - [x] Essay - Long text, manual grading
- [x] Question reordering (up/down buttons)
- [x] Quiz preview modal

**Files Created:**
- `/src/app/admin/courses/[id]/quizzes/page.tsx` - Quiz list with stats
- `/src/app/admin/courses/[id]/quizzes/[quizId]/page.tsx` - Quiz editor with questions
- `/src/app/api/admin/courses/[id]/quizzes/route.ts` - Quiz list/create
- `/src/app/api/admin/courses/[id]/quizzes/[quizId]/route.ts` - Quiz CRUD
- `/src/app/api/admin/courses/[id]/quizzes/[quizId]/questions/route.ts` - Questions list/create/reorder
- `/src/app/api/admin/courses/[id]/quizzes/[quizId]/questions/[questionId]/route.ts` - Question CRUD

### Phase 4: Admin - Student Management ✅ COMPLETE
- [x] Enrollment list page (`/admin/courses/[id]/students`)
- [x] Manual enrollment form
- [x] Bulk import (CSV)
- [x] Student progress view
- [x] Enrollment status management (suspend, expire)
- [x] Export progress reports

**Files Created:**
- `/src/app/admin/courses/[id]/students/page.tsx` - Student list with filters, stats, modals
- `/src/app/admin/courses/[id]/students/[enrollmentId]/page.tsx` - Individual student progress view
- `/src/app/api/admin/courses/[id]/enrollments/route.ts` - List/create enrollments with stats
- `/src/app/api/admin/courses/[id]/enrollments/[enrollmentId]/route.ts` - Get/update/delete enrollment
- `/src/app/api/admin/courses/[id]/enrollments/bulk/route.ts` - Bulk import by email list
- `/src/app/api/admin/courses/[id]/enrollments/export/route.ts` - CSV export with progress data

### Phase 5: Admin - Notifications (Following Webinar Pattern) ✅

**Status: Complete** (Finished 2025-12-05)

#### 5.1 Database Schema Updates ✅
- [x] Add `CourseNotificationQueue` model (mirrors `WebinarNotificationQueue`)
- [x] Update `CourseNotificationConfig` with full fields (templateKey, conditions, actions, sender overrides)
- [x] Update `CourseNotificationLog` to integrate with main `EmailLog` table (via emailLogId)
- [x] Add `CourseNotificationTrigger` enum with all trigger types
- [x] Add relations between models (queue → config → enrollment)
- [x] Add `LmsNotificationChannel` and `LmsNotificationLogStatus` enums
- [x] Add `COURSE` to EmailType enum

#### 5.2 Email Templates ✅
- [x] Created types.ts with CourseEmailTemplate and CourseTemplateVariables interfaces
- [x] Created 11 template pairs (EN + KA = 22 files):
  - enrollment-welcome (welcome after enrollment)
  - enrollment-nudge (48h after enrollment if not started)
  - course-started (when first lesson accessed)
  - halfway-milestone (50% progress)
  - course-completed (100% complete)
  - quiz-passed (passed a quiz)
  - quiz-failed (failed a quiz with encouragement)
  - inactivity-7d (7 days inactive)
  - inactivity-14d (14 days inactive)
  - expiration-7d (7 days before expiry)
  - expiration-1d (1 day before expiry)
  - certificate-issued (certificate ready)
- [x] Created index.ts with template registry and default notification configs

#### 5.3 Notification Library ✅
- [x] Created `/src/app/api/courses/lib/notifications.ts` with:
  - `createDefaultNotifications()` - Initialize course with default notifications
  - `queueEnrollmentNotifications()` - Queue on enrollment
  - `queueCourseStartNotifications()` - Queue on first lesson
  - `queueLessonCompleteNotifications()` - Queue on lesson complete (with conditions)
  - `queueCourseCompleteNotifications()` - Queue on course complete
  - `queueQuizNotifications()` - Queue on quiz pass/fail
  - `queueCertificateNotifications()` - Queue when certificate issued
  - `sendNotification()` - Process queue item, send email, log result
  - `processNotificationQueue()` - Cron function to process pending items
  - `checkInactivityNotifications()` - Cron function for inactivity checks
  - `checkExpirationNotifications()` - Cron function for expiration checks
  - `getCourseNotifications()` - UI helper for admin
  - `formatTriggerDescription()` - Human-readable timing
  - `getTriggerTypeLabel()` - Human-readable trigger names
  - Condition evaluation system (AND, OR, comparisons)
  - Variable replacement for custom templates
  - Action execution (TAG_CONTACT)

#### 5.4 API Routes ✅
- [x] `/src/app/api/admin/courses/[id]/notifications/route.ts` - GET (list), POST (create/createDefaults)
- [x] `/src/app/api/admin/courses/[id]/notifications/[notificationId]/route.ts` - GET, PUT, PATCH (toggle), DELETE
- [x] `/src/app/api/admin/courses/[id]/notifications/templates/[templateKey]/route.ts` - GET template content

#### 5.5 Cron Job ✅
- [x] Created `/src/app/api/cron/course-notifications/route.ts`
  - Processes notification queue
  - Checks for inactive enrollments
  - Checks for expiring enrollments
  - Returns comprehensive stats

#### 5.6 Admin UI ✅
- [x] Created `/src/app/admin/courses/[id]/notifications/page.tsx` - Notifications page
- [x] Created `/src/app/admin/courses/[id]/notifications/NotificationsEditor.tsx` - Full editor component
  - Template picker with preview
  - Custom notification creation
  - Trigger type selection with icons
  - Timing configuration
  - Maily.to editor integration for custom content
  - Contact tag actions
  - Sender settings (optional overrides)
  - Grouped by category (enrollment, progress, quiz, engagement, completion)
  - Stats display (sent, pending)
  - Enable/disable toggle

#### 5.7 Integration Hooks ✅
- [x] Hook enrollment creation → queue enrollment notifications (in enrollments route.ts)
- [x] Hook progress updates → queue course start notifications (in progress.ts)
- [x] Hook lesson completion → queue lesson complete notifications (via completePartWithNotifications)
- [x] Hook course completion → queue course complete notifications (in updateEnrollmentProgress)
- [x] Hook quiz completion → queue quiz pass/fail notifications (via recordQuizResultWithNotifications)
- [x] Hook certificate issuance → queue certificate notifications (queueCertificateNotifications ready)

**New Models:**
```prisma
model LmsNotificationQueue {
  id              String   @id @default(cuid())
  configId        String
  enrollmentId    String

  scheduledAt     DateTime
  processedAt     DateTime?

  status          NotificationQueueStatus @default(PENDING)
  attempts        Int                     @default(0)
  lastError       String?                 @db.Text
  metadata        Json?                   // Snapshot for condition evaluation

  createdAt       DateTime @default(now())

  config          CourseNotificationConfig @relation(...)
  enrollment      Enrollment              @relation(...)

  @@index([status, scheduledAt])
  @@index([enrollmentId])
  @@schema("lms")
}

enum CourseNotificationTrigger {
  AFTER_ENROLLMENT      // X minutes after enrollment
  ON_COURSE_START       // When user accesses first lesson
  ON_LESSON_COMPLETE    // When user completes any lesson
  ON_MODULE_COMPLETE    // When user completes any module
  ON_COURSE_COMPLETE    // When course reaches 100%
  ON_QUIZ_PASS          // When quiz passed
  ON_QUIZ_FAIL          // When quiz failed
  ON_INACTIVITY         // After X days without activity (cron)
  BEFORE_EXPIRATION     // X days before enrollment expires (cron)
  ON_CERTIFICATE_ISSUED // When certificate generated

  @@schema("lms")
}
```

#### 5.2 Trigger Types & Timing Options

| Trigger | Description | Timing Options |
|---------|-------------|----------------|
| `AFTER_ENROLLMENT` | When user enrolls | Immediately, 15m, 30m, 1h, 3h, 6h, 12h, 24h, 48h, 3d, 7d |
| `ON_COURSE_START` | First content view | Immediately |
| `ON_LESSON_COMPLETE` | Lesson completed | Immediately, 15m, 1h, 24h |
| `ON_MODULE_COMPLETE` | Module completed | Immediately, 15m, 1h, 24h |
| `ON_COURSE_COMPLETE` | Course 100% done | Immediately, 15m, 1h, 24h |
| `ON_QUIZ_PASS` | Quiz passed | Immediately, 15m, 1h |
| `ON_QUIZ_FAIL` | Quiz failed | Immediately, 15m, 1h |
| `ON_INACTIVITY` | No activity for X days | 3d, 7d, 14d, 30d inactive |
| `BEFORE_EXPIRATION` | X days before expiry | 30d, 14d, 7d, 3d, 1d before |
| `ON_CERTIFICATE_ISSUED` | Certificate generated | Immediately |

#### 5.3 Conditions (Evaluated at Send Time)

```typescript
// Progress-based
{ progressPercent: { gte: 50 } }      // Progress >= 50%
{ progressPercent: { lt: 25 } }       // Progress < 25%
{ progressPercent: { eq: 0 } }        // Not started yet

// Completion-based
{ completed: true }                    // Course completed
{ completed: false }                   // Course not completed

// Quiz-based
{ quizzesPassed: { gte: 1 } }         // At least 1 quiz passed
{ quizzesAttempted: { eq: 0 } }       // No quizzes attempted

// Time-based
{ enrolledDaysAgo: { gte: 7 } }       // Enrolled 7+ days ago
{ lastActivityDaysAgo: { gte: 14 } }  // Inactive 14+ days

// Specific content (optional)
{ lessonId: 'specific-lesson-id' }    // For specific lesson triggers
{ moduleId: 'specific-module-id' }    // For specific module triggers
{ quizId: 'specific-quiz-id' }        // For specific quiz triggers

// Combinations
{ AND: [{ progressPercent: { gte: 50 } }, { quizzesPassed: { gte: 1 } }] }
{ OR: [{ completed: true }, { progressPercent: { gte: 90 } }] }
```

#### 5.4 Default Templates

| Template Key | Trigger | Timing | Conditions | Purpose |
|-------------|---------|--------|------------|---------|
| `enrollment-welcome` | AFTER_ENROLLMENT | Immediately | - | Welcome + course access |
| `enrollment-nudge` | AFTER_ENROLLMENT | 24h | `{ progressPercent: { eq: 0 } }` | Nudge to start |
| `course-started` | ON_COURSE_START | Immediately | - | First lesson celebration |
| `halfway-milestone` | ON_LESSON_COMPLETE | Immediately | `{ progressPercent: { gte: 50 } }` | 50% milestone |
| `course-completed` | ON_COURSE_COMPLETE | Immediately | - | Congratulations |
| `quiz-passed` | ON_QUIZ_PASS | Immediately | - | Quiz success |
| `quiz-failed` | ON_QUIZ_FAIL | Immediately | - | Encouragement to retry |
| `inactivity-7d` | ON_INACTIVITY | 7d inactive | - | Re-engagement |
| `inactivity-14d` | ON_INACTIVITY | 14d inactive | - | Stronger re-engagement |
| `expiration-7d` | BEFORE_EXPIRATION | 7d before | - | Expiry warning |
| `expiration-1d` | BEFORE_EXPIRATION | 1d before | - | Urgent expiry |

#### 5.5 Template Variables

```typescript
// Student info
{{first_name}}, {{full_name}}, {{email}}

// Course info
{{course_title}}, {{course_url}}, {{continue_url}}

// Progress info
{{progress_percent}}, {{lessons_completed}}, {{total_lessons}}, {{time_spent}}

// Enrollment info
{{enrolled_date}}, {{expires_date}}, {{days_until_expiry}}

// Quiz info (for quiz notifications)
{{quiz_title}}, {{quiz_score}}, {{passing_score}}, {{attempts_remaining}}

// Certificate (for completion)
{{certificate_url}}, {{certificate_id}}

// Activity
{{last_activity_date}}, {{days_inactive}}, {{current_lesson}}
```

#### 5.6 Implementation Tasks

**Schema & Types:**
- [ ] Update Prisma schema with `LmsNotificationQueue` and updated enums
- [ ] Run migration
- [ ] Create TypeScript types for conditions, actions, templates

**Email Templates:**
- [ ] Create `/content/email-templates/courses/types.ts`
- [ ] Create `/content/email-templates/courses/index.ts` (registry + defaults)
- [ ] Create template files (EN + KA for each):
  - [ ] enrollment-welcome
  - [ ] enrollment-nudge
  - [ ] course-started
  - [ ] halfway-milestone
  - [ ] course-completed
  - [ ] quiz-passed
  - [ ] quiz-failed
  - [ ] inactivity-7d
  - [ ] inactivity-14d
  - [ ] expiration-7d
  - [ ] expiration-1d

**Notification Library:**
- [ ] Create `/src/app/api/courses/lib/notifications.ts`:
  - [ ] `queueEnrollmentNotifications(enrollmentId)` - Called on enrollment
  - [ ] `queueProgressNotifications(enrollmentId, event)` - Called on lesson/module/course complete
  - [ ] `queueQuizNotifications(enrollmentId, quizId, passed)` - Called on quiz submit
  - [ ] `queueCertificateNotifications(enrollmentId)` - Called on certificate issue
  - [ ] `checkInactivityNotifications()` - Called by cron, checks all active enrollments
  - [ ] `checkExpirationNotifications()` - Called by cron, checks enrollments with expiresAt
  - [ ] `processNotificationQueue()` - Processes pending queue items
  - [ ] `sendNotification(queueItem)` - Sends single notification
  - [ ] `evaluateConditions(conditions, context)` - Evaluates JSON conditions
  - [ ] `getTemplateVariables(enrollment)` - Builds variable map
  - [ ] Helper: Log to main `EmailLog` table with source='COURSE'

**API Routes:**
- [ ] `GET /api/admin/courses/[id]/notifications` - List all notifications with stats
- [ ] `POST /api/admin/courses/[id]/notifications` - Create notification or `{ action: 'createDefaults' }`
- [ ] `GET /api/admin/courses/[id]/notifications/[notificationId]` - Get single notification
- [ ] `PUT /api/admin/courses/[id]/notifications/[notificationId]` - Update notification
- [ ] `PATCH /api/admin/courses/[id]/notifications/[notificationId]` - Toggle active
- [ ] `DELETE /api/admin/courses/[id]/notifications/[notificationId]` - Delete (cancel pending queue)

**Cron Job:**
- [ ] Create `/api/cron/course-notifications/route.ts`:
  - [ ] Process pending queue (every minute)
  - [ ] Check inactivity notifications (daily)
  - [ ] Check expiration notifications (daily)
  - [ ] Return stats for monitoring

**Admin UI:**
- [ ] Create `/admin/courses/[id]/notifications/page.tsx`:
  - [ ] List notifications grouped by trigger type
  - [ ] Add notification modal (template selection or custom)
  - [ ] Edit notification modal (Maily.to editor, like webinars)
  - [ ] Trigger type selection with timing options
  - [ ] Conditions builder for event-based triggers
  - [ ] Actions: Tag contacts on send
  - [ ] Sender settings override (from name, email, reply-to)
  - [ ] Toggle active/inactive
  - [ ] Delete with confirmation
  - [ ] Stats display (sent, pending, failed counts)
  - [ ] Template variable reference panel
  - [ ] Image upload for emails (reuse existing pattern)

**Integration Points:**
- [ ] Hook into enrollment creation → queue AFTER_ENROLLMENT notifications
- [ ] Hook into progress update → queue ON_LESSON/MODULE/COURSE_COMPLETE notifications
- [ ] Hook into quiz submission → queue ON_QUIZ_PASS/FAIL notifications
- [ ] Hook into certificate generation → queue ON_CERTIFICATE_ISSUED notifications
- [ ] Email logs visible in admin email logs with filter for 'COURSE' source

**Files to Create:**
```
prisma/schema.prisma                              # Update with queue model + enums

/content/email-templates/courses/
  ├── types.ts
  ├── index.ts
  ├── enrollment-welcome-en.ts
  ├── enrollment-welcome-ka.ts
  ├── enrollment-nudge-en.ts
  ├── enrollment-nudge-ka.ts
  ├── course-started-en.ts
  ├── course-started-ka.ts
  ├── halfway-milestone-en.ts
  ├── halfway-milestone-ka.ts
  ├── course-completed-en.ts
  ├── course-completed-ka.ts
  ├── quiz-passed-en.ts
  ├── quiz-passed-ka.ts
  ├── quiz-failed-en.ts
  ├── quiz-failed-ka.ts
  ├── inactivity-7d-en.ts
  ├── inactivity-7d-ka.ts
  ├── inactivity-14d-en.ts
  ├── inactivity-14d-ka.ts
  ├── expiration-7d-en.ts
  ├── expiration-7d-ka.ts
  ├── expiration-1d-en.ts
  └── expiration-1d-ka.ts

/src/app/api/courses/lib/notifications.ts         # Core notification logic

/src/app/api/admin/courses/[id]/notifications/
  ├── route.ts
  └── [notificationId]/route.ts

/src/app/api/cron/course-notifications/route.ts   # Cron processor

/src/app/admin/courses/[id]/notifications/page.tsx  # Admin UI
```

### Phase 6: Course Player ✅ COMPLETE

**Status: Complete** (Finished 2025-12-05)

#### 6.1 Public Course Pages ✅
- [x] Course catalog page (`/[locale]/courses`)
  - Grid layout with featured course
  - Course cards with stats (parts, students)
  - Access type badges (Open/Free/Paid)
- [x] Course landing page (`/[locale]/courses/[slug]`)
  - Hero section with thumbnail
  - Course stats (lessons, duration, students)
  - Curriculum preview
  - EnrollButton component with enrollment flow
  - "What you'll learn" section
  - Bottom CTA

#### 6.2 Enrollment API ✅
- [x] `/api/courses/[slug]/enroll` - POST to enroll, GET to check status
  - Validates course access type
  - Creates enrollment record
  - Queues notifications
  - Tracks analytics

#### 6.3 Course Player ✅
- [x] Course player page (`/[locale]/courses/[slug]/learn`)
  - Fetches course structure with parts
  - Handles enrollment verification
  - Redirects non-enrolled users
  - Passes progress data to client
- [x] CoursePlayer client component
  - Responsive sidebar with curriculum
  - Progress indicators (completed/in-progress/locked)
  - Sequential lock support
  - Top navigation bar with progress
  - Prev/Next navigation
  - Mark complete button
  - Auto-advance to next part

#### 6.4 Content Block Renderers ✅
- [x] ContentRenderer component with support for:
  - Text (HTML/markdown rendering)
  - Video (HLS player with custom controls, progress tracking)
  - Audio (custom player with progress bar)
  - HTML (sanitized rendering)
  - Image (with caption support)
  - File (download with file info)
  - Embed (YouTube/Vimeo with aspect ratio)
  - Quiz (placeholder - full impl in Phase 7)

#### 6.5 Progress Tracking API ✅
- [x] `/api/courses/[slug]/progress` - POST to update, GET to fetch
  - Video progress tracking (watchTime, duration, percent)
  - Manual completion support
  - Calls completePartWithNotifications
  - Analytics tracking for views and milestones

#### 6.6 Resume Functionality ✅
- [x] Auto-resume to first incomplete part
- [x] Local storage progress for OPEN courses
- [x] Server-side progress for enrolled users

**Files Created:**
```
/src/app/[locale]/(public)/courses/page.tsx                    # Catalog
/src/app/[locale]/(public)/courses/[slug]/page.tsx             # Landing
/src/app/[locale]/(public)/courses/[slug]/EnrollButton.tsx     # Enroll CTA
/src/app/[locale]/(public)/courses/[slug]/learn/page.tsx       # Player page
/src/app/[locale]/(public)/courses/[slug]/learn/CoursePlayer.tsx    # Player UI
/src/app/[locale]/(public)/courses/[slug]/learn/ContentRenderer.tsx # Renderers
/src/app/api/courses/[slug]/enroll/route.ts                    # Enrollment API
/src/app/api/courses/[slug]/progress/route.ts                  # Progress API
```

### Phase 7: Quiz Player ✅ COMPLETE

**Status: Complete** (Finished 2025-12-05)

#### 7.1 Quiz API Routes ✅
- [x] `/api/courses/[slug]/quiz/[quizId]` - GET quiz with questions
  - Validates enrollment
  - Returns questions (shuffled if enabled)
  - Strips correct answers from response
  - Returns attempt history
- [x] `/api/courses/[slug]/quiz/[quizId]/start` - POST to start attempt
  - Validates max attempts
  - Checks cooldown period
  - Creates attempt record
  - Tracks analytics
- [x] `/api/courses/[slug]/quiz/[quizId]/submit` - POST to submit answers
  - Auto-grades multiple choice, true/false, short answer
  - Calculates score and pass/fail
  - Records answers
  - Marks part complete if quiz passed
  - Queues notifications
  - Tracks analytics

#### 7.2 QuizPlayer Component ✅
- [x] Created `/src/app/[locale]/(public)/courses/[slug]/learn/QuizPlayer.tsx`
  - Intro view with quiz info and stats
  - Attempt history display
  - Cooldown timer with countdown
  - Question navigation (prev/next, dot navigation)
  - Progress indicator
  - Submit validation (all questions answered)
  - Results view with score and pass/fail
  - Answer review with correct answers and explanations

#### 7.3 Question Renderers ✅
- [x] MULTIPLE_CHOICE_SINGLE - Radio buttons
- [x] MULTIPLE_CHOICE_MULTIPLE - Checkboxes with multi-select
- [x] TRUE_FALSE - Radio buttons (same as single choice)
- [x] SHORT_ANSWER - Text input
- [x] ESSAY - Textarea

#### 7.4 Quiz Features ✅
- [x] Retry flow with attempt limits
- [x] Cooldown period between attempts
- [x] Question shuffling support
- [x] Option shuffling support
- [x] Show correct answers setting
- [x] Quiz gate enforcement (isGate flag)
- [x] Partial credit for multiple choice

**Files Created:**
```
/src/app/api/courses/[slug]/quiz/[quizId]/route.ts       # Get quiz
/src/app/api/courses/[slug]/quiz/[quizId]/start/route.ts # Start attempt
/src/app/api/courses/[slug]/quiz/[quizId]/submit/route.ts # Submit answers
/src/app/[locale]/(public)/courses/[slug]/learn/QuizPlayer.tsx # Quiz UI
```

### Phase 8: Open Course (localStorage)
- [ ] Anonymous ID generation
- [ ] localStorage progress storage
- [ ] Progress migration on account creation
- [ ] "Save your progress" prompts

### Phase 9: User Profile Integration
- [ ] My Courses section in profile
- [ ] Course cards with progress
- [ ] Resume links
- [ ] Certificates section
- [ ] Certificate download

### Phase 10: Analytics & Reporting ✅ COMPLETE (Moved to Phase 6)

**Status: Complete** (Finished 2025-12-05)

Note: Analytics was implemented early as Phase 6 to provide insights during course player development.

#### 10.1 Analytics Event Tracking Library ✅
- [x] Created `/src/app/api/courses/lib/analytics.ts` with:
  - Event tracking functions (`trackEvent`, `trackEnrollment`, `trackCourseView`, `trackPartView`, `trackVideoProgress`, `trackVideoCompleted`, `trackPartCompleted`, `trackCourseCompleted`, `trackQuizEvent`)
  - Analytics query functions (`getCourseOverviewStats`, `getEnrollmentTrends`, `getCompletionTrends`, `getProgressDistribution`, `getContentEngagement`, `getQuizStats`, `getAverageCompletionTime`, `getRecentActivity`, `getTopStudents`, `getAdminDashboardStats`)
  - Support for date ranges, grouping by day/week/month

#### 10.2 Admin Analytics API ✅
- [x] Created `/src/app/api/admin/courses/[id]/analytics/route.ts`
  - GET endpoint with multiple views: overview, trends, engagement, quizzes, activity, students, full
  - Period filtering: 7d, 30d, 90d, all
  - Group by: day, week, month

#### 10.3 Admin Analytics Dashboard ✅
- [x] Created `/src/app/admin/courses/[id]/analytics/page.tsx`
  - Overview stats cards (enrollments, active, completed, completion rate)
  - Progress distribution visualization
  - Quiz performance section
  - Enrollment trends bar chart
  - Content engagement table (drop-off analysis)
  - Top students list
  - Recent activity feed
  - Inline components: StatCard, SimpleBarChart

#### 10.4 Event Tracking Integration ✅
- [x] Enrollment tracking in `/src/app/api/admin/courses/[id]/enrollments/route.ts`
- [x] Part completion tracking in `/src/lib/lms/progress.ts`
- [x] Course completion tracking in progress updates
- [x] Quiz result tracking in `recordQuizResultWithNotifications`

**Files Created:**
```
/src/app/api/courses/lib/analytics.ts              # Analytics library
/src/app/api/admin/courses/[id]/analytics/route.ts # Analytics API
/src/app/admin/courses/[id]/analytics/page.tsx     # Analytics dashboard
```

### Phase 11: Certificates
- [ ] Certificate generation (PDF)
- [ ] Certificate template system
- [ ] Public verification page (`/verify/[code]`)
- [ ] Certificate download

### Phase 12: Polish & Optimization
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility (a11y)
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states

---

## API Routes

### Public API (`/api/courses/`)

```
GET    /api/courses                           # List published courses
GET    /api/courses/[slug]                    # Get course details
POST   /api/courses/[slug]/enroll             # Enroll in course
GET    /api/courses/[slug]/progress           # Get user progress
POST   /api/courses/[slug]/progress           # Update progress (video heartbeat, completion)
GET    /api/courses/[slug]/content/[partId]   # Get part content
POST   /api/courses/[slug]/quiz/[quizId]/start    # Start quiz attempt
POST   /api/courses/[slug]/quiz/[quizId]/submit   # Submit quiz
GET    /api/courses/[slug]/certificate        # Get certificate
POST   /api/courses/[slug]/analytics          # Track analytics event
```

### Admin API (`/api/admin/courses/`)

```
# Courses
GET    /api/admin/courses                     # List all courses
POST   /api/admin/courses                     # Create course
GET    /api/admin/courses/[id]                # Get course details
PUT    /api/admin/courses/[id]                # Update course
DELETE /api/admin/courses/[id]                # Delete course
POST   /api/admin/courses/[id]/publish        # Publish course
POST   /api/admin/courses/[id]/duplicate      # Duplicate course

# Modules
POST   /api/admin/courses/[id]/modules        # Create module
PUT    /api/admin/courses/[id]/modules/[moduleId]    # Update module
DELETE /api/admin/courses/[id]/modules/[moduleId]    # Delete module
POST   /api/admin/courses/[id]/modules/reorder       # Reorder modules

# Lessons
POST   /api/admin/courses/[id]/lessons        # Create lesson
PUT    /api/admin/courses/[id]/lessons/[lessonId]    # Update lesson
DELETE /api/admin/courses/[id]/lessons/[lessonId]    # Delete lesson
POST   /api/admin/courses/[id]/lessons/reorder       # Reorder lessons

# Parts
POST   /api/admin/courses/[id]/parts          # Create part
PUT    /api/admin/courses/[id]/parts/[partId]        # Update part
DELETE /api/admin/courses/[id]/parts/[partId]        # Delete part
POST   /api/admin/courses/[id]/parts/reorder         # Reorder parts

# Quizzes
GET    /api/admin/courses/[id]/quizzes        # List quizzes
POST   /api/admin/courses/[id]/quizzes        # Create quiz
PUT    /api/admin/courses/[id]/quizzes/[quizId]      # Update quiz
DELETE /api/admin/courses/[id]/quizzes/[quizId]      # Delete quiz

# Quiz Questions
POST   /api/admin/quizzes/[quizId]/questions         # Add question
PUT    /api/admin/quizzes/[quizId]/questions/[qId]   # Update question
DELETE /api/admin/quizzes/[quizId]/questions/[qId]   # Delete question
POST   /api/admin/quizzes/[quizId]/questions/reorder # Reorder questions

# Enrollments
GET    /api/admin/courses/[id]/enrollments    # List enrollments
POST   /api/admin/courses/[id]/enrollments    # Manual enroll
POST   /api/admin/courses/[id]/enrollments/bulk      # Bulk import
PUT    /api/admin/courses/[id]/enrollments/[enrollmentId]  # Update status
DELETE /api/admin/courses/[id]/enrollments/[enrollmentId]  # Remove enrollment
GET    /api/admin/courses/[id]/enrollments/export    # Export progress

# Notifications
GET    /api/admin/courses/[id]/notifications  # List notification configs
POST   /api/admin/courses/[id]/notifications  # Create notification
PUT    /api/admin/courses/[id]/notifications/[notifId]  # Update notification
DELETE /api/admin/courses/[id]/notifications/[notifId]  # Delete notification

# Analytics
GET    /api/admin/courses/[id]/analytics      # Get analytics dashboard data
GET    /api/admin/courses/[id]/analytics/export      # Export analytics

# Media
POST   /api/admin/lms-media/upload            # Upload media (video, audio, image, file)
DELETE /api/admin/lms-media/[key]             # Delete media
```

---

## Admin Panel Pages

```
/admin/courses                                # Course list
/admin/courses/new                            # Create course
/admin/courses/[id]                           # Course overview/dashboard
/admin/courses/[id]/edit                      # Edit course settings
/admin/courses/[id]/content                   # Content builder (modules/lessons/parts)
/admin/courses/[id]/quizzes                   # Quiz management
/admin/courses/[id]/quizzes/[quizId]          # Edit quiz
/admin/courses/[id]/students                  # Enrollment management
/admin/courses/[id]/students/[enrollmentId]   # Student progress detail
/admin/courses/[id]/notifications             # Notification configuration
/admin/courses/[id]/analytics                 # Analytics dashboard
```

---

## User-Facing Pages

```
/[locale]/courses                             # Course catalog
/[locale]/courses/[slug]                      # Course landing page (sales/info)
/[locale]/courses/[slug]/learn                # Course player
/[locale]/courses/[slug]/learn/[partId]       # Specific part in player
/[locale]/courses/[slug]/certificate          # View certificate
/[locale]/verify/[code]                       # Public certificate verification
/[locale]/profile                             # (existing) - add "My Courses" section
```

---

## Component Structure

### Admin Components (`/src/app/admin/courses/components/`)

```
CourseList.tsx                   # Course listing with filters
CourseForm.tsx                   # Course create/edit form
CourseSettingsForm.tsx           # Course settings panel
ContentBuilder.tsx               # Main content builder interface
ModuleEditor.tsx                 # Module edit panel
LessonEditor.tsx                 # Lesson edit panel
PartEditor.tsx                   # Part edit panel
ContentBlockEditor.tsx           # Generic block editor wrapper
  blocks/
    TextBlockEditor.tsx
    VideoBlockEditor.tsx
    AudioBlockEditor.tsx
    HtmlBlockEditor.tsx
    ImageBlockEditor.tsx
    FileBlockEditor.tsx
    EmbedBlockEditor.tsx
    QuizBlockEditor.tsx
QuizBuilder.tsx                  # Quiz creation interface
QuestionEditor.tsx               # Question create/edit
EnrollmentList.tsx               # Student list
EnrollmentForm.tsx               # Manual enrollment
BulkImportModal.tsx              # CSV import
StudentProgressView.tsx          # Individual student progress
NotificationList.tsx             # Notification configs
NotificationForm.tsx             # Create/edit notification
AnalyticsDashboard.tsx           # Analytics charts
```

### Course Player Components (`/src/app/[locale]/(public)/courses/[slug]/learn/`)

```
CoursePlayer.tsx                 # Main player layout
CourseSidebar.tsx                # Navigation sidebar
CourseProgress.tsx               # Progress bar
ContentRenderer.tsx              # Renders content blocks
  renderers/
    TextRenderer.tsx
    VideoRenderer.tsx             # HLS player with tracking
    AudioRenderer.tsx
    HtmlRenderer.tsx
    ImageRenderer.tsx
    FileRenderer.tsx
    EmbedRenderer.tsx
    QuizRenderer.tsx
NavigationControls.tsx           # Prev/Next buttons
CompletionButton.tsx             # Mark complete button
QuizPlayer.tsx                   # Quiz taking interface
QuizQuestion.tsx                 # Question display
QuizResults.tsx                  # Results display
```

### Shared Components (`/src/components/lms/`)

```
CourseCard.tsx                   # Course card for listings
ProgressBar.tsx                  # Visual progress indicator
EnrollButton.tsx                 # Enroll/Access button
CourseAccessBadge.tsx            # OPEN/FREE/PAID badge
```

---

## Progress Tracking System

### How Progress is Calculated

```
Part Progress:
- Video: watchPercent >= course.videoCompletionThreshold
- Audio: watchPercent >= course.videoCompletionThreshold
- Quiz: quiz passed
- Other: manual mark complete

Lesson Progress:
- % of parts completed

Module Progress:
- % of lessons completed (weighted by part count)

Course Progress:
- % of all parts completed
- Cached in Enrollment.progressPercent
```

### Video Tracking Flow

1. Player sends heartbeat every 5 seconds
2. API updates `PartProgress.watchTime`
3. API calculates `watchPercent`
4. If `watchPercent >= threshold`, mark complete
5. Recalculate lesson/module/course progress
6. Track analytics event

---

## Notification System

### Triggers

| Trigger | When Fired |
|---------|------------|
| ON_ENROLLMENT | Immediately after enrollment |
| AFTER_ENROLLMENT | X minutes after enrollment |
| ON_COMPLETION | When course completed |
| ON_INACTIVITY | Cron checks daily, fires if inactive X days |
| BEFORE_EXPIRATION | Cron checks daily, fires X days before expiry |
| ON_QUIZ_PASS | When quiz passed |
| ON_QUIZ_FAIL | When quiz failed |

### Implementation

- Reuse existing Postmark integration
- Add `CourseNotificationQueue` for scheduled notifications
- Add cron job `/api/cron/process-course-notifications`

---

## Analytics System

### Events Tracked

All events stored in `CourseAnalyticsEvent` with:
- `eventType` (enum)
- `eventData` (JSON with type-specific data)
- `userId` or `anonymousId`
- Contextual IDs (courseId, moduleId, lessonId, partId, quizId)
- Client info (userAgent, IP)

### Dashboard Metrics

1. **Enrollment Stats**: Total, by date, by status
2. **Completion Rates**: Overall, by module, by lesson
3. **Drop-off Points**: Where students stop
4. **Time Stats**: Avg time per lesson, total time
5. **Quiz Performance**: Pass rates, avg scores, attempts
6. **Engagement**: Active students, return rate

---

## Open Access (localStorage) System

### Anonymous ID

```typescript
// Generate on first visit
const anonymousId = localStorage.getItem('lms_anonymous_id')
  || (localStorage.setItem('lms_anonymous_id', nanoid()), localStorage.getItem('lms_anonymous_id'));
```

### Progress Storage

```typescript
interface LocalStorageProgress {
  [courseId: string]: {
    enrolledAt: string;
    parts: {
      [partId: string]: {
        status: 'not_started' | 'in_progress' | 'completed';
        watchTime: number;
        watchPercent: number;
        completedAt?: string;
      }
    };
    quizAttempts: {
      [quizId: string]: QuizAttempt[];
    };
  }
}
```

### Migration Flow

1. User creates account or logs in
2. Check localStorage for progress
3. Show "Migrate Progress" modal
4. Create Enrollment records
5. Create PartProgress records
6. Clear localStorage
7. Continue in authenticated mode

---

## Future Considerations

### Community Integration (Planned)

```prisma
model Community {
  // ... community fields ...
  courses Course[] // Many-to-many
}

model CommunityTier {
  // ... tier fields ...
  includedCourses Course[] // Courses included in this tier
}
```

### Payment Integration (Planned)

- Add Stripe/local gateway integration
- Payment records linked to Enrollment
- Webhook handlers for payment events
- Refund handling

### Certificate Designer (Planned)

- Visual template builder
- Custom fields placement
- Font/color customization
- Logo upload

### Gamification (Planned)

- Achievement system
- Points/XP
- Leaderboards
- Badges

---

## File Structure Summary

```
/src/app/
├── admin/
│   └── courses/
│       ├── page.tsx                    # Course list
│       ├── new/page.tsx                # Create course
│       ├── [id]/
│       │   ├── page.tsx                # Course overview
│       │   ├── edit/page.tsx           # Edit settings
│       │   ├── content/page.tsx        # Content builder
│       │   ├── quizzes/
│       │   │   ├── page.tsx            # Quiz list
│       │   │   └── [quizId]/page.tsx   # Edit quiz
│       │   ├── students/
│       │   │   ├── page.tsx            # Enrollment list
│       │   │   └── [enrollmentId]/page.tsx
│       │   ├── notifications/page.tsx
│       │   └── analytics/page.tsx
│       └── components/                 # Admin components
├── [locale]/
│   └── (public)/
│       └── courses/
│           ├── page.tsx                # Course catalog
│           └── [slug]/
│               ├── page.tsx            # Landing page
│               ├── learn/
│               │   ├── page.tsx        # Player
│               │   └── [partId]/page.tsx
│               └── certificate/page.tsx
├── api/
│   ├── courses/                        # Public API
│   │   └── [slug]/
│   │       ├── route.ts
│   │       ├── enroll/route.ts
│   │       ├── progress/route.ts
│   │       ├── content/[partId]/route.ts
│   │       ├── quiz/[quizId]/
│   │       │   ├── start/route.ts
│   │       │   └── submit/route.ts
│   │       ├── certificate/route.ts
│   │       └── analytics/route.ts
│   └── admin/
│       ├── courses/                    # Admin API
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── publish/route.ts
│       │       ├── modules/...
│       │       ├── lessons/...
│       │       ├── parts/...
│       │       ├── quizzes/...
│       │       ├── enrollments/...
│       │       ├── notifications/...
│       │       └── analytics/...
│       └── lms-media/
│           ├── upload/route.ts
│           └── [key]/route.ts
└── verify/
    └── [code]/page.tsx                 # Certificate verification

/src/components/
└── lms/                                # Shared LMS components
    ├── CourseCard.tsx
    ├── ProgressBar.tsx
    ├── EnrollButton.tsx
    └── CourseAccessBadge.tsx

/src/lib/
└── lms/
    ├── types.ts                        # TypeScript types
    ├── progress.ts                     # Progress calculation
    ├── certificates.ts                 # Certificate generation
    └── localStorage.ts                 # Open course helpers

/prisma/
└── schema.prisma                       # Add lms schema
```

---

## Next Steps

1. **Review this plan** - Let me know any changes or additions
2. **Approve to proceed** - Once approved, we start with Phase 1
3. **Iterative development** - We'll complete phase by phase, testing as we go

---

*This document will be updated as we progress through implementation.*
