# Phase 5: Component Refactoring - Execution Plan

**Date:** 2025-01-04
**Status:** 🔴 Not Started
**Progress:** 0/5 components completed (0%)
**Estimated Time:** 8-10 hours total

---

## Progress Tracker

### Overall Status
```
✅ = Completed
🟡 = In Progress
🔴 = Not Started
⏸️ = Blocked/Paused
```

**Components:**
- 🔴 InteractionsEditor.tsx (0/7 steps)
- 🔴 WebinarEditor.tsx (0/3 steps)
- 🔴 ChatPanel.tsx (0/3 steps)
- 🔴 WebinarRoom.tsx (0/3 steps)
- 🔴 ScheduleConfigForm.tsx (0/5 steps)

**Total Progress:** 0/21 steps (0%)

---

## Overview

Refactor 5 large components (3,258 lines total) into smaller, maintainable pieces:
1. InteractionsEditor.tsx (877 lines) → ~15 files
2. WebinarEditor.tsx (943 lines) → ~8 files
3. ChatPanel.tsx (416 lines) → ~4 files
4. WebinarRoom.tsx (404 lines) → Extract hooks
5. ScheduleConfigForm.tsx (618 lines) → ~6 files

---

## Part 1: InteractionsEditor.tsx Refactoring

**Status:** 🔴 Not Started
**Current:** 877 lines, 3 components mixed, duplicated code
**Target:** ~15 focused files, no duplication, clear separation
**Progress:** 0/7 steps completed

### Step 1: Create Shared Utilities (15 min)
**Status:** 🔴 Not Started

**Files to create:**
1. `/src/app/admin/webinars/[id]/interactions/lib/timeUtils.ts`
   - `formatTime(seconds: number): string`
   - `parseTime(timeStr: string): number`
   - Remove duplication from 3 places

2. `/src/app/admin/webinars/[id]/interactions/lib/interactionTypes.ts`
   - `INTERACTION_TYPES` array
   - `POSITIONS` array
   - TypeScript interfaces
   - Move constants out of component

3. `/src/app/admin/webinars/[id]/interactions/lib/interactionDefaults.ts`
   - `DEFAULT_INTERACTION` constant
   - Remove duplication from 2 places

**Testing:** Import in InteractionsEditor, verify no errors

**Completion Checklist:**
- [ ] timeUtils.ts created and working
- [ ] interactionTypes.ts created and working
- [ ] interactionDefaults.ts created and working
- [ ] Imports updated in InteractionsEditor.tsx
- [ ] No TypeScript errors
- [ ] Browser test passed

---

### Step 2: Extract API Hook (20 min)
**Status:** 🔴 Not Started

**File to create:**
`/src/app/admin/webinars/[id]/interactions/hooks/useInteractionAPI.ts`

**Functions:**
- `addInteraction(interaction)` → POST
- `updateInteraction(id, interaction)` → PUT
- `deleteInteraction(id)` → DELETE
- `moveInteraction(id, newTime)` → PUT (timeline drag)

**Returns:**
```typescript
{
  addInteraction,
  updateInteraction,
  deleteInteraction,
  moveInteraction,
  isLoading,
  error,
  successMessage
}
```

**Benefits:**
- Centralized error handling
- Loading states managed in one place
- Reusable across components

**Testing:** Use hook in InteractionsEditor, verify API calls work

**Completion Checklist:**
- [ ] useInteractionAPI.ts created
- [ ] All 4 API functions working
- [ ] Loading states working
- [ ] Error handling working
- [ ] Success messages working
- [ ] Hook integrated in InteractionsEditor.tsx

---

### Step 3: Extract Interaction Config Components (1.5 hours)
**Status:** 🔴 Not Started

**Create directory:**
`/src/app/admin/webinars/[id]/interactions/components/interaction-configs/`

**Files to create:**

1. **PollConfig.tsx** (~60 lines)
   - Options array management
   - Add/remove options
   - Max 6 options
   - Props: `{ config, onChange }`

2. **QuizConfig.tsx** (~80 lines)
   - Options array
   - Correct answer checkboxes
   - State management for both
   - Props: `{ config, onChange }`

3. **CTAConfig.tsx** (~50 lines)
   - Button text input
   - Button URL input
   - Description textarea
   - Also used by SPECIAL_OFFER type

4. **DownloadConfig.tsx** (~50 lines)
   - Download URL input
   - File name input
   - Description textarea

5. **QuestionConfig.tsx** (~40 lines)
   - Description textarea only
   - Also used by TIP type

6. **FeedbackConfig.tsx** (~30 lines)
   - Just informational text
   - No inputs needed

7. **ContactFormConfig.tsx** (~60 lines)
   - Collect phone checkbox
   - Collect company checkbox
   - Success message input

8. **PauseConfig.tsx** (~50 lines)
   - Pause message input
   - Auto-resume duration number input

9. **SpecialOfferConfig.tsx** (~50 lines)
   - Reuses CTAConfig component
   - Same fields as CTA

10. **index.tsx** (~40 lines)
    - Smart router component
    - Maps type → component
    - Exports single `InteractionConfigFields`

**Structure of each config:**
```typescript
interface ConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function PollConfig({ config, onChange }: ConfigProps) {
  // Local state for editing
  // Update parent on change
  // Return JSX
}
```

**Testing after each:**
- Add interaction with that type
- Edit interaction with that type
- Verify config saves correctly

**Completion Checklist:**
- [ ] PollConfig.tsx created and tested
- [ ] QuizConfig.tsx created and tested
- [ ] CTAConfig.tsx created and tested
- [ ] DownloadConfig.tsx created and tested
- [ ] QuestionConfig.tsx created and tested
- [ ] FeedbackConfig.tsx created and tested
- [ ] ContactFormConfig.tsx created and tested
- [ ] PauseConfig.tsx created and tested
- [ ] SpecialOfferConfig.tsx created and tested
- [ ] index.tsx router created
- [ ] All 10 types working in InteractionsEditor

---

### Step 4: Extract List Components (45 min)
**Status:** 🔴 Not Started

**Files to create:**

1. **components/InteractionListItem.tsx** (~80 lines)
   - Display single interaction
   - Icon, title, type badge, time
   - Edit and delete buttons
   - Props: `{ interaction, onEdit, onDelete, onHover }`

2. **components/InteractionList.tsx** (~100 lines)
   - Map over interactions
   - Sort by trigger time
   - Empty state
   - Props: `{ interactions, onEdit, onDelete, onHover }`

**Benefits:**
- InteractionListItem can be memoized
- Easy to add drag-and-drop later
- Cleaner main component

**Testing:**
- View list of interactions
- Hover works (timeline highlight)
- Edit button opens form
- Delete button works

**Completion Checklist:**
- [ ] InteractionListItem.tsx created
- [ ] InteractionList.tsx created
- [ ] List rendering works
- [ ] Hover highlighting works
- [ ] Edit/delete buttons work
- [ ] Empty state works

---

### Step 5: Extract Modal Component (45 min)
**Status:** 🔴 Not Started

**File to create:**
`/src/app/admin/webinars/[id]/interactions/components/InteractionModal.tsx`

**Handles:**
- Modal backdrop and positioning
- Modal header with close button
- Basic fields (title, trigger time, position)
- Type selection grid
- Config fields (uses InteractionConfigFields)
- Options checkboxes (pause video, show on replay)
- Action buttons (cancel, save)

**Two modes:**
- **Add mode:** `mode="add"`, creates new interaction
- **Edit mode:** `mode="edit"`, updates existing

**Props:**
```typescript
{
  mode: 'add' | 'edit',
  interaction: Interaction | null,
  isOpen: boolean,
  onClose: () => void,
  onSave: (interaction) => void,
  videoDuration: number
}
```

**Testing:**
- Open add modal → works
- Open edit modal → works
- Cancel closes without saving
- Save calls API and closes

**Completion Checklist:**
- [ ] InteractionModal.tsx created
- [ ] Add mode works
- [ ] Edit mode works
- [ ] All fields render correctly
- [ ] Type-specific configs show
- [ ] Save functionality works
- [ ] Cancel functionality works

---

### Step 6: Refactor Main Component (30 min)
**Status:** 🔴 Not Started

**New InteractionsEditor.tsx** (~150 lines)

**Responsibilities:**
- Manage state (interactions list, modal open/close)
- Use useInteractionAPI hook
- Render VideoTimelineEditor
- Render InteractionList
- Render InteractionModal
- Show save messages
- Coordinate between sub-components

**Structure:**
```typescript
export function InteractionsEditor({ webinarId, videoUrl, videoDuration, initialInteractions }) {
  // State
  const [interactions, setInteractions] = useState(initialInteractions)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // API hook
  const { addInteraction, updateInteraction, deleteInteraction, moveInteraction, isLoading, successMessage } = useInteractionAPI(webinarId)

  // Handlers
  const handleAdd = () => setModalMode('add')
  const handleEdit = (interaction) => { setEditingInteraction(interaction); setModalMode('edit') }
  const handleSave = async (interaction) => { /* ... */ }

  return (
    <div className="space-y-6">
      {successMessage && <SuccessMessage />}

      <VideoTimelineEditor
        videoUrl={videoUrl}
        videoDuration={videoDuration}
        interactions={interactions}
        highlightedInteractionId={hoveredId}
        onInteractionClick={handleEdit}
        onInteractionMove={moveInteraction}
        onAddInteraction={handleAdd}
      />

      <Button onClick={handleAdd}>Add Interaction</Button>

      <InteractionList
        interactions={interactions}
        onEdit={handleEdit}
        onDelete={deleteInteraction}
        onHover={setHoveredId}
      />

      <InteractionModal
        mode={modalMode}
        interaction={editingInteraction}
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        onSave={handleSave}
        videoDuration={videoDuration}
      />
    </div>
  )
}
```

**Testing:**
- Full workflow: add → edit → delete
- Timeline interaction
- Modal interaction
- All 10 interaction types

**Completion Checklist:**
- [ ] New InteractionsEditor.tsx created
- [ ] Under 200 lines
- [ ] Uses all new components
- [ ] Uses useInteractionAPI hook
- [ ] Timeline integration works
- [ ] Add workflow works
- [ ] Edit workflow works
- [ ] Delete workflow works
- [ ] No TypeScript errors

---

### Step 7: Cleanup (15 min)
**Status:** 🔴 Not Started

**Completion Checklist:**
- [ ] Old InteractionsEditor.tsx backed up as .old.tsx
- [ ] All imports updated
- [ ] No TypeScript errors
- [ ] Build succeeds (npm run build)
- [ ] Final browser test passed
- [ ] All 10 interaction types work
- [ ] Commit changes to git

---

## Part 2: WebinarEditor.tsx Refactoring

**Status:** 🔴 Not Started
**Progress:** 0/3 steps completed

**Current:** 943 lines, tab-based UI
**Target:** Main coordinator + tab components

### Step 1: Analyze Structure (15 min)
**Status:** 🔴 Not Started

**Tasks:**
- Current tabs and their content
- Shared state between tabs
- API calls used
- Reusable patterns

**Completion Checklist:**
- [ ] Structure analyzed
- [ ] Tabs identified
- [ ] State dependencies mapped
- [ ] API calls documented

### Step 2: Create Tab Components (2 hours)
**Status:** 🔴 Not Started

**Files to create:**
```
/src/app/admin/webinars/components/tabs/
├── BasicInfoTab.tsx (~150 lines)
├── VideoTab.tsx (~100 lines)
├── ScheduleTab.tsx (~200 lines)
├── RegistrationTab.tsx (~150 lines)
├── EndScreenTab.tsx (~100 lines)
└── index.ts (exports)
```

**Existing tabs to keep:**
- InteractionsTab (already separate)
- ChatTab (already separate)
- NotificationsTab (already separate)
- RegistrationsTab (already separate)
- AnalyticsTab (already separate)

**Completion Checklist:**
- [ ] BasicInfoTab.tsx created
- [ ] VideoTab.tsx created
- [ ] ScheduleTab.tsx created
- [ ] RegistrationTab.tsx created
- [ ] EndScreenTab.tsx created
- [ ] All tabs tested individually

### Step 3: Refactor Main Component (30 min)
**Status:** 🔴 Not Started

**New WebinarEditor.tsx** (~250 lines)
- Tab navigation
- Shared state management
- Pass props to tab components
- Coordinate saves

---

**Completion Checklist:**
- [ ] New WebinarEditor.tsx created
- [ ] Tab routing works
- [ ] State management works
- [ ] All tabs render correctly
- [ ] Save functionality works
- [ ] Build succeeds

---

## Part 3: ChatPanel.tsx Refactoring

**Status:** 🔴 Not Started
**Progress:** 0/3 steps completed
**Current:** 416 lines, mixed chat/interactions
**Target:** Separate concerns

### Components to Extract:

1. **AblyChat.tsx** (~120 lines)
   - Real-time chat with Ably
   - Message list
   - Send message form
   - Connection status

2. **InteractionsFeed.tsx** (~100 lines)
   - Display interactions in feed
   - Show poll results, responses
   - Engagement indicators

3. **ChatPanel.tsx** (~150 lines)
   - Tab switcher (chat vs interactions)
   - Layout wrapper
   - Coordinate between chat and interactions

---

**Completion Checklist:**
- [ ] AblyChat.tsx created and tested
- [ ] InteractionsFeed.tsx created and tested
- [ ] New ChatPanel.tsx created
- [ ] Tab switching works
- [ ] Chat functionality works
- [ ] Interactions feed works

---

## Part 4: WebinarRoom.tsx Hook Extraction

**Status:** 🔴 Not Started
**Progress:** 0/3 steps completed
**Current:** 404 lines, hooks mixed with UI
**Target:** Extract custom hooks

### Hooks to Create:

1. **useWebinarAnalytics.ts** (~80 lines)
   - SESSION_JOINED tracking
   - SESSION_EXITED tracking
   - Progress updates
   - Returns: `{ trackJoin, trackExit, trackProgress }`

2. **useInteractionTiming.ts** (~60 lines)
   - Calculate which interactions to show
   - Based on current video time
   - Returns: `{ activeInteractions }`

3. **useWaitingRoom.ts** (~50 lines)
   - Check if waiting room should show
   - Calculate countdown
   - Returns: `{ showWaitingRoom, timeUntilStart }`

**New WebinarRoom.tsx** (~200 lines)
- Just layout and coordination
- Use custom hooks
- Pass data to child components

---

**Completion Checklist:**
- [ ] useWebinarAnalytics.ts created and tested
- [ ] useInteractionTiming.ts created and tested
- [ ] useWaitingRoom.ts created and tested
- [ ] New WebinarRoom.tsx updated to use hooks
- [ ] All analytics tracking works
- [ ] Interaction timing works
- [ ] Waiting room works

---

## Part 5: ScheduleConfigForm.tsx Refactoring

**Status:** 🔴 Not Started
**Progress:** 0/5 steps completed
**Current:** 618 lines, all schedule types in one file
**Target:** Separate components per schedule type

### Components to Extract:

1. **RecurringScheduleConfig.tsx** (~150 lines)
   - Days of week selection
   - Time selection
   - Timezone

2. **SpecificDatesConfig.tsx** (~100 lines)
   - Date picker
   - Time picker
   - Add/remove dates

3. **IntervalScheduleConfig.tsx** (~80 lines)
   - Interval dropdown
   - Start/end hour
   - Preview text

4. **BlackoutDatesConfig.tsx** (~80 lines)
   - Date picker
   - Add/remove dates
   - Holiday presets

5. **ScheduleConfigForm.tsx** (~200 lines)
   - Schedule type selector
   - Route to appropriate component
   - Common fields (replay, expiration)

**Completion Checklist:**
- [ ] RecurringScheduleConfig.tsx created
- [ ] SpecificDatesConfig.tsx created
- [ ] IntervalScheduleConfig.tsx created
- [ ] BlackoutDatesConfig.tsx created
- [ ] New ScheduleConfigForm.tsx created
- [ ] All schedule types work
- [ ] Form submission works
- [ ] Validation works

---

## Testing Checklist (Per Component)

### Before Refactoring:
- [ ] Screenshot current UI
- [ ] Test all interactions manually
- [ ] Document any bugs found

### During Refactoring:
- [ ] Create new files
- [ ] Copy relevant code
- [ ] Update imports
- [ ] Fix TypeScript errors
- [ ] Test in browser

### After Refactoring:
- [ ] Compare with screenshot
- [ ] Test all interactions again
- [ ] Check console for errors
- [ ] Check network tab (API calls)
- [ ] Run build command
- [ ] Commit changes

---

## File Structure Summary

### Before (5 files, 3,258 lines):
```
InteractionsEditor.tsx (877)
WebinarEditor.tsx (943)
ChatPanel.tsx (416)
WebinarRoom.tsx (404)
ScheduleConfigForm.tsx (618)
```

### After (~45 files, better organized):
```
/interactions/
  InteractionsEditor.tsx (150)
  /components/ (10 files, ~600 lines)
  /hooks/ (1 file, ~80 lines)
  /lib/ (3 files, ~70 lines)

/webinars/components/
  WebinarEditor.tsx (250)
  /tabs/ (5 files, ~700 lines)

/watch/components/
  ChatPanel.tsx (150)
  AblyChat.tsx (120)
  InteractionsFeed.tsx (100)
  WebinarRoom.tsx (200)
  /hooks/ (3 files, ~190 lines)

/admin/webinars/components/
  ScheduleConfigForm.tsx (200)
  /schedule-configs/ (4 files, ~410 lines)
```

---

## Order of Execution

### Session 1: InteractionsEditor (3-4 hours)
1. Utilities → 15 min
2. API Hook → 20 min
3. Config Components → 1.5 hours (do in batches of 3)
4. List Components → 45 min
5. Modal Component → 45 min
6. Main Component → 30 min
7. Testing → 30 min

### Session 2: WebinarEditor + ChatPanel (2-3 hours)
1. WebinarEditor tabs → 2 hours
2. WebinarEditor main → 30 min
3. ChatPanel split → 1 hour

### Session 3: WebinarRoom + ScheduleConfigForm (2-3 hours)
1. WebinarRoom hooks → 1.5 hours
2. ScheduleConfigForm components → 1.5 hours
3. Final testing → 30 min

---

## Risk Mitigation

### Backups:
- Keep `.old.tsx` versions for 24 hours
- Can quickly restore if issues

### Rollback Plan:
```bash
# If issues found:
mv InteractionsEditor.tsx InteractionsEditor.new.tsx
mv InteractionsEditor.old.tsx InteractionsEditor.tsx
# Test and fix new version
```

### Gradual Deployment:
- Test locally first
- Deploy to staging
- Verify all workflows
- Deploy to production

---

## Success Metrics

### Quantitative:
- [x] All files under 300 lines
- [x] No code duplication
- [x] Reduced complexity (nesting levels)
- [x] All TypeScript errors resolved
- [x] Build succeeds

### Qualitative:
- [x] Easier to understand each file
- [x] Easier to find specific code
- [x] Easier to test individual pieces
- [x] Easier to add new features
- [x] Better developer experience

---

## Next Steps

1. Get approval for this plan
2. Start with InteractionsEditor (longest, most complex)
3. Test thoroughly
4. Continue with remaining components
5. Update WEBINAR_CLEANUP_PLAN.md when done
6. Create PHASE_5_COMPONENT_REFACTORING_SUMMARY.md

---

## Quick Progress Summary

**Last Updated:** 2025-01-04

### Components Status:
```
Part 1: InteractionsEditor.tsx  🔴 0/7 steps (0%)
Part 2: WebinarEditor.tsx       🔴 0/3 steps (0%)
Part 3: ChatPanel.tsx           🔴 0/3 steps (0%)
Part 4: WebinarRoom.tsx         🔴 0/3 steps (0%)
Part 5: ScheduleConfigForm.tsx  🔴 0/5 steps (0%)
```

### Overall: 0/21 steps completed (0%)

### Files Created: 0/45
### Lines Refactored: 0/3,258

---

## How to Use This Plan

1. **Start with Part 1, Step 1**
2. **Complete each step's checklist**
3. **Update status** (🔴 → 🟡 → ✅)
4. **Test after each step**
5. **Move to next step only after testing**
6. **Update progress percentages**
7. **Commit frequently**

---

**Ready to execute!** 🚀

