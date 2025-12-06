# Community System Implementation Plan

## Overview

Build a comprehensive community platform with:
- **Multi-community support** (parallel communities + tiered access within each)
- **Discussions** with threaded comments
- **Events & Calendar** for live sessions
- **Challenges** with gamification
- **LMS Integration** (link existing courses to communities)

---

## Phase 1: Database Schema

### New Models (in `public` schema)

```prisma
// ============================================
// COMMUNITY CORE
// ============================================

model Community {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  nameKa      String?
  description String?  @db.Text
  descriptionKa String? @db.Text
  image       String?  // Cover image
  icon        String?  // Small icon/logo

  // Settings
  visibility  CommunityVisibility @default(PUBLIC)
  joinPolicy  JoinPolicy @default(OPEN)

  // Ownership
  ownerId     String
  owner       User @relation("OwnedCommunities", fields: [ownerId], references: [id])

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tiers       CommunityTier[]
  members     CommunityMember[]
  spaces      Space[]
  events      CommunityEvent[]
  challenges  Challenge[]
  badges      Badge[]
  courses     CommunityCourse[]  // LMS integration

  @@map("communities")
}

enum CommunityVisibility {
  PUBLIC      // Anyone can see, listed in directory
  UNLISTED    // Anyone with link can see
  PRIVATE     // Only members can see
}

enum JoinPolicy {
  OPEN        // Anyone can join
  APPROVAL    // Request to join, admin approves
  INVITE      // Invite-only
  PAID        // Requires payment (via tier)
}

// ============================================
// MEMBERSHIP TIERS
// ============================================

model CommunityTier {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  name        String   // e.g., "Free", "Premium", "VIP"
  nameKa      String?
  slug        String   // e.g., "free", "premium", "vip"
  description String?  @db.Text
  descriptionKa String? @db.Text

  // Pricing
  price       Decimal? @db.Decimal(10, 2) // null = free
  currency    String   @default("GEL")
  billingPeriod BillingPeriod?

  // Ordering
  position    Int      @default(0)

  // Permissions (JSON for flexibility)
  permissions Json     @default("{}")
  // Example: { "canPost": true, "canCreateEvents": false, "accessSpaces": ["general", "premium"] }

  // Styling
  color       String?  // Badge color for tier display

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  members     CommunityMember[]
  spaceAccess SpaceTierAccess[]

  @@unique([communityId, slug])
  @@map("community_tiers")
}

enum BillingPeriod {
  MONTHLY
  QUARTERLY
  YEARLY
  LIFETIME
}

// ============================================
// MEMBERS
// ============================================

model CommunityMember {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tierId      String?
  tier        CommunityTier? @relation(fields: [tierId], references: [id])

  // Status
  status      MemberStatus @default(ACTIVE)
  role        MemberRole   @default(MEMBER)

  // Engagement
  points      Int      @default(0)
  streak      Int      @default(0) // Consecutive days active
  lastActiveAt DateTime?

  // Timestamps
  joinedAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  posts       Post[]
  comments    Comment[]
  reactions   Reaction[]
  eventRsvps  EventRsvp[]
  challengeParticipants ChallengeParticipant[]
  earnedBadges MemberBadge[]

  @@unique([communityId, userId])
  @@map("community_members")
}

enum MemberStatus {
  PENDING     // Awaiting approval
  ACTIVE
  SUSPENDED
  BANNED
}

enum MemberRole {
  MEMBER
  MODERATOR
  ADMIN
  OWNER
}

// ============================================
// SPACES (Sub-sections within a community)
// ============================================

model Space {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  name        String
  nameKa      String?
  slug        String
  description String?
  descriptionKa String?
  icon        String?  // Lucide icon name

  // Type determines what kind of content
  type        SpaceType @default(DISCUSSION)

  // Ordering
  position    Int      @default(0)

  // Settings
  isDefault   Boolean  @default(false) // Show to all new members

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  posts       Post[]
  tierAccess  SpaceTierAccess[]

  @@unique([communityId, slug])
  @@map("spaces")
}

enum SpaceType {
  DISCUSSION  // Forum-style posts
  ANNOUNCEMENTS // Admin-only posts
  RESOURCES   // File/link sharing
  INTRODUCTIONS // Member intros
  QA          // Q&A format
}

model SpaceTierAccess {
  id       String @id @default(cuid())
  spaceId  String
  space    Space  @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  tierId   String
  tier     CommunityTier @relation(fields: [tierId], references: [id], onDelete: Cascade)

  canView  Boolean @default(true)
  canPost  Boolean @default(true)
  canComment Boolean @default(true)

  @@unique([spaceId, tierId])
  @@map("space_tier_access")
}

// ============================================
// POSTS & COMMENTS
// ============================================

model Post {
  id          String   @id @default(cuid())
  spaceId     String
  space       Space    @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  authorId    String
  author      CommunityMember @relation(fields: [authorId], references: [id], onDelete: Cascade)

  title       String?
  content     String   @db.Text
  contentKa   String?  @db.Text

  // Rich content
  attachments Json?    // Array of { type, url, name }

  // Status
  isPinned    Boolean  @default(false)
  isLocked    Boolean  @default(false) // No new comments

  // Engagement counts (denormalized for performance)
  likeCount   Int      @default(0)
  commentCount Int     @default(0)
  viewCount   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  comments    Comment[]
  reactions   Reaction[]

  @@index([spaceId, createdAt])
  @@map("posts")
}

model Comment {
  id          String   @id @default(cuid())
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId    String
  author      CommunityMember @relation(fields: [authorId], references: [id], onDelete: Cascade)

  // Threading
  parentId    String?
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")

  content     String   @db.Text

  // Engagement
  likeCount   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  reactions   Reaction[]

  @@index([postId, createdAt])
  @@map("comments")
}

model Reaction {
  id          String   @id @default(cuid())
  memberId    String
  member      CommunityMember @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Polymorphic - either post or comment
  postId      String?
  post        Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  commentId   String?
  comment     Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  type        ReactionType @default(LIKE)

  createdAt   DateTime @default(now())

  @@unique([memberId, postId])
  @@unique([memberId, commentId])
  @@map("reactions")
}

enum ReactionType {
  LIKE
  LOVE
  CELEBRATE
  INSIGHTFUL
  CURIOUS
}

// ============================================
// EVENTS & CALENDAR
// ============================================

model CommunityEvent {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  hostId      String   // CommunityMember who's hosting

  title       String
  titleKa     String?
  description String?  @db.Text
  descriptionKa String? @db.Text

  // Schedule
  startAt     DateTime
  endAt       DateTime?
  timezone    String   @default("Asia/Tbilisi")

  // Location
  type        EventType @default(ONLINE)
  location    String?  // Physical address or online platform
  meetingUrl  String?  // Zoom/Meet link

  // Settings
  maxAttendees Int?
  isRecurring Boolean  @default(false)
  recurrence  Json?    // { frequency: "weekly", days: [1, 3], until: "2024-12-31" }

  // Access control
  requiredTierId String? // Minimum tier required

  // Cover image
  image       String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  rsvps       EventRsvp[]

  @@index([communityId, startAt])
  @@map("community_events")
}

enum EventType {
  ONLINE      // Virtual meeting
  IN_PERSON   // Physical location
  HYBRID      // Both
}

model EventRsvp {
  id          String   @id @default(cuid())
  eventId     String
  event       CommunityEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  memberId    String
  member      CommunityMember @relation(fields: [memberId], references: [id], onDelete: Cascade)

  status      RsvpStatus @default(GOING)

  // Attendance tracking
  attendedAt  DateTime?

  createdAt   DateTime @default(now())

  @@unique([eventId, memberId])
  @@map("event_rsvps")
}

enum RsvpStatus {
  GOING
  MAYBE
  NOT_GOING
}

// ============================================
// CHALLENGES
// ============================================

model Challenge {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  title       String
  titleKa     String?
  description String?  @db.Text
  descriptionKa String? @db.Text

  // Schedule
  startAt     DateTime
  endAt       DateTime

  // Settings
  type        ChallengeType @default(HABIT)
  goal        Json?    // { type: "checkin", target: 7 } or { type: "points", target: 100 }

  // Rewards
  pointsReward Int     @default(0)
  badgeId     String?  // Badge awarded on completion
  badge       Badge?   @relation(fields: [badgeId], references: [id])

  // Cover
  image       String?

  // Status
  status      ChallengeStatus @default(DRAFT)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  participants ChallengeParticipant[]

  @@index([communityId, startAt])
  @@map("challenges")
}

enum ChallengeType {
  HABIT       // Daily check-in (e.g., 7-day meditation)
  GOAL        // Reach a target (e.g., complete 5 lessons)
  COMPETITION // Leaderboard-based
}

enum ChallengeStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

model ChallengeParticipant {
  id          String   @id @default(cuid())
  challengeId String
  challenge   Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  memberId    String
  member      CommunityMember @relation(fields: [memberId], references: [id], onDelete: Cascade)

  // Progress
  progress    Json     @default("{}") // { days: [1,2,3,5], points: 50 }
  completedAt DateTime?

  joinedAt    DateTime @default(now())

  @@unique([challengeId, memberId])
  @@map("challenge_participants")
}

// ============================================
// GAMIFICATION
// ============================================

model Badge {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  name        String
  nameKa      String?
  description String?
  descriptionKa String?

  // Visual
  icon        String   // Lucide icon name or custom image URL
  color       String   @default("#8B5CF6") // Purple

  // Earning criteria
  criteria    BadgeCriteria
  threshold   Int?     // e.g., 10 posts, 100 points

  // Rarity
  rarity      BadgeRarity @default(COMMON)

  createdAt   DateTime @default(now())

  // Relations
  members     MemberBadge[]
  challenges  Challenge[]

  @@map("badges")
}

enum BadgeCriteria {
  MANUAL          // Awarded by admin
  POSTS_COUNT     // X number of posts
  COMMENTS_COUNT  // X number of comments
  POINTS_TOTAL    // Reach X points
  STREAK_DAYS     // X day streak
  CHALLENGE_COMPLETE // Complete a challenge
  EVENTS_ATTENDED // Attend X events
  MEMBER_SINCE    // Member for X days
}

enum BadgeRarity {
  COMMON
  UNCOMMON
  RARE
  EPIC
  LEGENDARY
}

model MemberBadge {
  id        String   @id @default(cuid())
  memberId  String
  member    CommunityMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  badgeId   String
  badge     Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  earnedAt  DateTime @default(now())

  @@unique([memberId, badgeId])
  @@map("member_badges")
}

// ============================================
// LMS INTEGRATION
// ============================================

model CommunityCourse {
  id          String   @id @default(cuid())
  communityId String
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  courseId    String   // References lms.Course

  // Access control
  requiredTierId String? // Minimum tier to access

  // Ordering in community
  position    Int      @default(0)

  createdAt   DateTime @default(now())

  @@unique([communityId, courseId])
  @@map("community_courses")
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...

  // New relations
  ownedCommunities Community[] @relation("OwnedCommunities")
  communityMemberships CommunityMember[]
}
```

---

## Phase 2: Admin Panel

### New Admin Routes

```
/admin/communities                    # List all communities
/admin/communities/new                # Create community
/admin/communities/[id]               # Edit community
/admin/communities/[id]/tiers         # Manage tiers
/admin/communities/[id]/members       # Manage members
/admin/communities/[id]/spaces        # Manage spaces
/admin/communities/[id]/events        # Manage events
/admin/communities/[id]/challenges    # Manage challenges
/admin/communities/[id]/badges        # Manage badges
/admin/communities/[id]/courses       # Link LMS courses
/admin/communities/[id]/analytics     # Community analytics
```

### Admin Features

1. **Community Management**
   - Create/edit community settings
   - Set visibility and join policy
   - Upload cover image and icon

2. **Tier Management**
   - Create membership tiers (Free, Premium, VIP)
   - Set pricing and billing period
   - Configure permissions per tier
   - Assign colors for visual differentiation

3. **Space Management**
   - Create/reorder spaces
   - Set space types (Discussion, Announcements, etc.)
   - Configure tier access per space

4. **Member Management**
   - View all members with engagement stats
   - Change member tier/role
   - Suspend/ban members
   - Export member list

5. **Event Management**
   - Create one-time and recurring events
   - Set RSVP limits
   - Track attendance
   - Send reminders

6. **Challenge Management**
   - Create challenges with goals
   - Set date ranges
   - Assign badge rewards
   - Track participant progress

7. **Badge Management**
   - Create badges with criteria
   - Manual badge awards
   - View badge distribution

8. **Course Integration**
   - Link existing LMS courses
   - Set tier requirements
   - Reorder courses

---

## Phase 3: User-Facing Pages

### Routes

```
/[locale]/community                   # Community directory (list all public)
/[locale]/community/[slug]            # Community home
/[locale]/community/[slug]/spaces/[space] # Space with posts
/[locale]/community/[slug]/events     # Events calendar
/[locale]/community/[slug]/challenges # Active challenges
/[locale]/community/[slug]/members    # Member directory
/[locale]/community/[slug]/leaderboard # Points leaderboard
/[locale]/community/[slug]/courses    # Linked courses
```

### Key Components

1. **Community Home**
   - Hero with cover image
   - Quick stats (members, posts, events)
   - Recent activity feed
   - Upcoming events sidebar
   - Active challenges

2. **Space Feed**
   - Post list with infinite scroll
   - Create post form
   - Pinned posts at top
   - Filter/sort options

3. **Post Detail**
   - Full post content
   - Threaded comments
   - Reactions
   - Share functionality

4. **Events Calendar**
   - Month/week/day views
   - Event cards with RSVP
   - Filtering by type

5. **Challenge Card**
   - Progress visualization
   - Leaderboard preview
   - Join/check-in buttons

6. **Member Profile**
   - Activity history
   - Earned badges
   - Points/streak display
   - Joined communities

---

## Phase 4: Real-time Features (Future)

- Live activity notifications
- Real-time post/comment updates
- Online member indicators
- Live event chat

---

## Implementation Order

### Sprint 1: Foundation
1. Database schema migration
2. Basic admin CRUD for communities
3. Community creation wizard
4. Member join/leave flow

### Sprint 2: Discussions
1. Spaces CRUD
2. Posts CRUD with rich editor
3. Comments with threading
4. Reactions system

### Sprint 3: Events & Challenges
1. Event CRUD and calendar
2. RSVP system
3. Challenge CRUD
4. Progress tracking

### Sprint 4: Gamification
1. Points system
2. Badge definitions and awards
3. Leaderboards
4. Streak tracking

### Sprint 5: Integrations
1. LMS course linking
2. Email notifications
3. Activity feed
4. Analytics dashboard

---

## Research Sources

- [Mighty Networks](https://www.mightynetworks.com) - Gamification, challenges, events
- [Circle](https://circle.so) - Spaces, member networking
- [Kajabi](https://kajabi.com) - Community + courses integration
- [Skool](https://www.skool.com) - Leaderboards, levels, gamification
- [Bettermode](https://bettermode.com) - Space templates, Q&A

### Key Insights from Research

1. **First 7 days are critical** - Strong onboarding flow
2. **Personalization matters** - Show relevant content per tier
3. **Gamification drives engagement** - Points, badges, streaks
4. **Events build loyalty** - Regular live sessions
5. **Analytics needed** - Who's engaged, who's at risk
