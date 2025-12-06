# Email Warmup System - Implementation Plan

## Status: COMPLETE
Started: 2024-12-06
Completed: 2024-12-06

---

## Overview

Implement a comprehensive email warmup system for the marketing server (nbswera.com) with:
- 30-day warmup schedule with engagement-based recipient prioritization
- Cooldown detection and automatic re-warmup
- Real-time engagement tracking on contacts
- Admin UI with warmup dashboard and campaign status integration

---

## Implementation Phases

### Phase 1: Database Schema & Migrations
- [ ] 1.1 Add WarmupConfig model
- [ ] 1.2 Add WarmupSchedule model (seed with 30-day schedule)
- [ ] 1.3 Add WarmupLog model for daily tracking
- [ ] 1.4 Add engagement fields to Contact model
- [ ] 1.5 Run migration
- [ ] 1.6 Seed default warmup schedule

### Phase 2: Warmup Service (Core Logic)
- [ ] 2.1 Create `/src/lib/warmup/index.ts` - main service
- [ ] 2.2 Implement `getWarmupStatus()` - current status for a server
- [ ] 2.3 Implement `getDailyLimit()` - today's allowed volume
- [ ] 2.4 Implement `getRemainingToday()` - remaining capacity
- [ ] 2.5 Implement `recordSent()` - update sent counter
- [ ] 2.6 Implement `advanceDay()` - progress to next day
- [ ] 2.7 Implement `checkCooldown()` - detect inactivity
- [ ] 2.8 Implement `calculateEngagementTier()` - tier for contact
- [ ] 2.9 Implement `getAllowedTiers()` - tiers for current phase
- [ ] 2.10 Implement `getMetrics()` - recent performance stats

### Phase 3: Contact Engagement Tracking
- [ ] 3.1 Update marketing webhook to update Contact engagement
- [ ] 3.2 Add `updateContactEngagement()` helper function
- [ ] 3.3 Create cron job for daily tier recalculation
- [ ] 3.4 Update Contact model queries to include tier

### Phase 4: Campaign Sender Integration
- [ ] 4.1 Modify `prepareCampaignRecipients()` for warmup limits
- [ ] 4.2 Add engagement-based recipient ordering
- [ ] 4.3 Handle campaign spreading across multiple days
- [ ] 4.4 Update campaign status to show warmup progress
- [ ] 4.5 Modify `processCampaignBatch()` to check warmup limits

### Phase 5: Warmup Cron Jobs
- [ ] 5.1 Create `/api/cron/warmup-daily` endpoint
- [ ] 5.2 Implement daily limit reset
- [ ] 5.3 Implement auto-progression logic
- [ ] 5.4 Implement cooldown detection
- [ ] 5.5 Implement metrics calculation and logging

### Phase 6: Admin API Routes
- [ ] 6.1 GET `/api/admin/warmup` - get warmup status
- [ ] 6.2 POST `/api/admin/warmup/start` - start warmup
- [ ] 6.3 POST `/api/admin/warmup/pause` - pause warmup
- [ ] 6.4 POST `/api/admin/warmup/resume` - resume warmup
- [ ] 6.5 POST `/api/admin/warmup/advance` - manually advance day
- [ ] 6.6 GET `/api/admin/warmup/logs` - get warmup history

### Phase 7: Admin UI - Warmup Dashboard
- [ ] 7.1 Create `/admin/warmup/page.tsx` - main dashboard
- [ ] 7.2 Create WarmupStatusCard component
- [ ] 7.3 Create WarmupScheduleView component
- [ ] 7.4 Create WarmupHistoryTable component
- [ ] 7.5 Create WarmupControls component

### Phase 8: Admin UI - Campaign Integration
- [ ] 8.1 Add WarmupBanner to campaigns list page
- [ ] 8.2 Show warmup status in campaign detail/send flow
- [ ] 8.3 Show estimated completion time for large campaigns
- [ ] 8.4 Add warmup warnings in campaign validation

### Phase 9: Testing & Verification
- [ ] 9.1 Test warmup progression
- [ ] 9.2 Test engagement tier calculation
- [ ] 9.3 Test campaign spreading across days
- [ ] 9.4 Test cooldown detection
- [ ] 9.5 Run build verification

---

## Technical Specifications

### Warmup Schedule (30 days)

```
Day 1-7 (Foundation):    50 → 100 → 200 → 300 → 400 → 500 → 600
Day 8-14 (Growth):       800 → 1000 → 1200 → 1500 → 1800 → 2000 → 2500
Day 15-21 (Scaling):     3000 → 3500 → 4000 → 5000 → 6000 → 7500 → 10000
Day 22-28 (Maturation):  12500 → 15000 → 17500 → 20000 → 25000 → 30000 → 40000
Day 29-30 (Full):        50000 → unlimited
```

### Engagement Tiers

| Tier | Criteria | Allowed From |
|------|----------|--------------|
| HOT | Opened/clicked in 30 days | Day 1 |
| NEW | Never received email | Day 8 |
| WARM | Opened/clicked in 60 days | Day 15 |
| COOL | Opened/clicked in 90 days | Day 22 |
| COLD | No engagement 90+ days | Day 29 |

### Cooldown Rules

| Inactivity | Action |
|------------|--------|
| < 7 days | Resume at current level |
| 7-14 days | Resume at 75% |
| 14-30 days | Resume at 50% |
| 30+ days | Full re-warmup (day 1) |

### Auto-Progression Criteria

Advance to next day if ALL conditions met:
- Open rate >= 15%
- Bounce rate <= 3%
- Spam complaint rate <= 0.1%

Pause warmup if ANY condition met:
- Spam complaint rate > 0.1%
- Bounce rate > 5%

---

## File Structure

```
src/
├── lib/
│   └── warmup/
│       ├── index.ts           # Main service exports
│       ├── service.ts         # Core warmup logic
│       ├── engagement.ts      # Engagement tier logic
│       ├── schedule.ts        # Schedule helpers
│       └── types.ts           # TypeScript types
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── warmup/
│   │   │       ├── route.ts           # GET status, POST start
│   │   │       ├── pause/route.ts
│   │   │       ├── resume/route.ts
│   │   │       ├── advance/route.ts
│   │   │       └── logs/route.ts
│   │   └── cron/
│   │       └── warmup-daily/route.ts
│   └── admin/
│       ├── warmup/
│       │   └── page.tsx               # Warmup dashboard
│       └── campaigns/
│           └── components/
│               └── WarmupBanner.tsx   # Banner for campaigns list
prisma/
└── schema.prisma                      # New models
```

---

## Progress Log

### 2024-12-06
- [ ] Created implementation plan
- [ ] Starting Phase 1: Database Schema

---

## Notes

- Marketing server: nbswera (ID: 17544033)
- Starting fresh - no prior sends from this domain
- Auto-continue campaigns that exceed daily limits
- Real-time + daily cron for engagement updates
- UI: Banner on campaigns + dedicated warmup page
