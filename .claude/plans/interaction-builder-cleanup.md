# Interaction Builder Cleanup & Robustness Plan

## Overview
Clean up the interaction builder to ensure it's production-ready, maintainable, and handles all edge cases gracefully.

## Phase 1: Code Quality & Maintainability ⭐ CRITICAL FOUNDATION

### 1.1 Remove Dead Code ❌
**WHY:** Unused code causes confusion, increases bundle size, and makes refactoring harder

**File:** `InteractionsEditorFullScreen.tsx`
- **Line 62-69:** Remove entire `POSITIONS` constant - completely unused after we removed position field
- **Line 22:** Remove `GripVertical` import - not used anywhere
- Audit all imports and remove any other unused ones

**Impact:** ~10 lines removed, cleaner code, smaller bundle

---

### 1.2 Fix Hardcoded Default Values Duplication 🔄
**WHY:** Same default values copy-pasted in 3 places - error-prone when updating

**CURRENT PROBLEM:**
```typescript
// Lines 88-99: Initial state
const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>({
  type: 'POLL',
  triggerTime: 0,
  duration: 30,
  title: '',
  config: {},
  pauseVideo: false,
  required: false,
  showOnReplay: true,
  position: 'BOTTOM_RIGHT',
  enabled: true,
})

// Lines 138-149: Reset after add (DUPLICATE!)
setNewInteraction({
  type: 'POLL',
  triggerTime: 0,
  duration: 30,
  title: '',
  config: {},
  pauseVideo: false,
  required: false,
  showOnReplay: true,
  position: 'BOTTOM_RIGHT',
  enabled: true,
})
```

**SOLUTION:**
```typescript
// At top of file, before component
const DEFAULT_INTERACTION: Partial<Interaction> = {
  type: 'POLL',
  triggerTime: 0,
  duration: 30,
  title: '',
  config: {},
  pauseVideo: false,
  required: false,
  showOnReplay: true,
  position: 'BOTTOM_RIGHT',
  enabled: true,
} as const

// In component:
const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>(DEFAULT_INTERACTION)

// After add:
setNewInteraction(DEFAULT_INTERACTION)
```

**Impact:** Single source of truth, easier to modify defaults

---

### 1.3 Fix Repetitive State Clearing 🧹
**WHY:** State clearing code duplicated 6+ times - maintenance nightmare

**CURRENT PROBLEM:**
```typescript
// After add (lines 135-137)
setEditingId(null)
setSelectedInteractionId(null)
setHighlightedInteractionId(null)

// After update (lines 178-180)
setEditingId(null)
setSelectedInteractionId(null)
setHighlightedInteractionId(null)

// Close add modal X button (lines 370-372)
setSelectedInteractionId(null)
setHighlightedInteractionId(null)

// Cancel add modal (lines 505-506)
setSelectedInteractionId(null)
setHighlightedInteractionId(null)

// Close edit modal X button (lines 342-344)
setEditingId(null)
setSelectedInteractionId(null)
setHighlightedInteractionId(null)

// Cancel edit modal (lines 356-358)
setEditingId(null)
setSelectedInteractionId(null)
setHighlightedInteractionId(null)
```

**SOLUTION:**
```typescript
// Create single helper function
const clearSelectionState = useCallback(() => {
  setEditingId(null)
  setSelectedInteractionId(null)
  setHighlightedInteractionId(null)
}, [])

// Use everywhere:
clearSelectionState()
```

**Impact:** 6 blocks of 3 lines → 6 single function calls. Much cleaner!

---

### 1.4 Fix State Management Redundancy 🎯
**WHY:** Two separate states (`highlightedInteractionId` + `selectedInteractionId`) are confusing and often combined

**CURRENT PROBLEM:**
```typescript
// Lines 84-85: Two states for similar purpose
const [highlightedInteractionId, setHighlightedInteractionId] = useState<string | null>(null)
const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null)

// Everywhere we use them, we combine them:
highlightedInteractionId={highlightedInteractionId || selectedInteractionId}
```

**SOLUTION - Option A (Simpler):**
Keep two states but use better names and don't combine:
```typescript
const [hoveredInteractionId, setHoveredInteractionId] = useState<string | null>(null)
const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null)

// Pass both to children, let them decide how to highlight
// VideoTimelineEditor shows BOTH: hover glow + selected border
// Sidebar scrolls to selected, highlights both
```

**SOLUTION - Option B (More Complex but Cleaner):**
Single state with metadata:
```typescript
const [activeInteraction, setActiveInteraction] = useState<{
  hoveredId: string | null
  selectedId: string | null
}>({ hoveredId: null, selectedId: null })

// Helpers:
const setHovered = (id: string | null) =>
  setActiveInteraction(prev => ({ ...prev, hoveredId: id }))

const setSelected = (id: string | null) =>
  setActiveInteraction(prev => ({ ...prev, selectedId: id }))

const clearAll = () =>
  setActiveInteraction({ hoveredId: null, selectedId: null })
```

**DECISION:** Use **Option A** - clearer intent, easier to understand, no migration pain

**Changes Required:**
1. Rename `highlightedInteractionId` → `hoveredInteractionId`
2. Keep `selectedInteractionId` as is
3. Don't combine them with `||` - pass both separately
4. Update all child components to handle both independently

**Impact:** Clearer code, no more confusion about which state is which

---

### 1.5 Standardize Z-Index System 📐
**WHY:** Z-index values scattered and inconsistent - causes layering bugs

**CURRENT PROBLEM:**
```typescript
// In VideoTimelineEditor.tsx:
z-10        // Line 443: marker hover
z-20        // Line 506: hover indicator
z-30        // Line 474: playhead
z-40        // Line 442: highlighted marker
z-50        // Line 454: marker tooltip
z-[60]      // Line 487: add button
z-[100]     // Line 454: tooltip (also z-50 elsewhere??)
z-[200]     // Line 454: tooltip?? (conflicting)

// In InteractionsEditorFullScreen.tsx:
z-50        // Modal backdrop
```

**SOLUTION:**
Create shared constants file:

```typescript
// src/app/admin/webinars/[id]/interactions/constants.ts
export const Z_INDEX = {
  // Timeline layers (base: 0)
  TIMELINE_TRACK: 0,
  MARKER_BASE: 10,
  MARKER_HOVER: 20,
  PLAYHEAD: 30,
  MARKER_DRAGGING: 40,
  MARKER_HIGHLIGHTED: 40,

  // Timeline UI overlays
  TIMELINE_CONTAINER: 50,
  ADD_BUTTON: 60,
  HOVER_INDICATOR: 70,

  // Tooltips and popovers
  TOOLTIP: 100,
  POPOVER: 110,

  // Modals and overlays
  MODAL_BACKDROP: 200,
  MODAL_CONTENT: 210,
} as const

export type ZIndex = typeof Z_INDEX[keyof typeof Z_INDEX]
```

**Then in VideoTimelineEditor.tsx:**
```typescript
import { Z_INDEX } from './constants'

// Replace all z-index values:
className={`... z-${Z_INDEX.MARKER_BASE}`}  // ❌ WRONG - Tailwind doesn't support dynamic
```

**WAIT - Tailwind Issue!** Tailwind requires literal class names. Solution:

```typescript
// constants.ts - Use Tailwind's arbitrary values
export const Z_INDEX_CLASSES = {
  MARKER_BASE: 'z-10',
  MARKER_HOVER: 'z-20',
  PLAYHEAD: 'z-30',
  MARKER_DRAGGING: 'z-40',
  MARKER_HIGHLIGHTED: 'z-40',
  TIMELINE_CONTAINER: 'z-50',
  ADD_BUTTON: 'z-[60]',
  HOVER_INDICATOR: 'z-[70]',
  TOOLTIP: 'z-[100]',
  MODAL_BACKDROP: 'z-[200]',
  MODAL_CONTENT: 'z-[210]',
} as const

// Usage:
className={`... ${Z_INDEX_CLASSES.MARKER_BASE}`}
```

**All replacements:**
1. Line 443: `z-10` → `Z_INDEX_CLASSES.MARKER_BASE`
2. Line 442: `z-40` → `Z_INDEX_CLASSES.MARKER_HIGHLIGHTED`
3. Line 474: `z-30` → `Z_INDEX_CLASSES.PLAYHEAD`
4. Line 487: `z-[60]` → `Z_INDEX_CLASSES.ADD_BUTTON`
5. Line 506: `z-20` → `Z_INDEX_CLASSES.HOVER_INDICATOR`
6. Line 454: `z-[200]` → `Z_INDEX_CLASSES.TOOLTIP`
7. Modal: `z-50` → `Z_INDEX_CLASSES.MODAL_BACKDROP`

**Impact:**
- All z-index values in one place
- Easy to see the layering hierarchy
- No more conflicts or guessing
- Self-documenting code

---

### 1.6 Extract Shared Time Utilities 🕐
**WHY:** `formatTime()` and `parseTime()` duplicated in 3 files

**Create:** `src/app/admin/webinars/[id]/interactions/utils.ts`

```typescript
/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse MM:SS or plain number to seconds
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }
  return parseInt(timeStr) || 0
}
```

**Remove from:**
- `InteractionsEditorFullScreen.tsx` (lines 101-113)
- `InteractionsSidebar.tsx` (lines 87-91 and 199-203)
- `VideoTimelineEditor.tsx` (lines 129-142)

**Import instead:**
```typescript
import { formatTime, parseTime } from './utils'
```

**Impact:** DRY principle, single source of truth for time formatting

## Phase 2: Validation & Error Prevention

### 2.1 Form Validation
**File:** `InteractionsEditorFullScreen.tsx`

**Add validation function:**
```typescript
function validateInteraction(interaction: Partial<Interaction>) {
  const errors: string[] = []

  // Required fields
  if (!interaction.title?.trim()) {
    errors.push('Title is required')
  }

  // Time validation
  if (interaction.triggerTime! < 0) {
    errors.push('Trigger time cannot be negative')
  }
  if (interaction.triggerTime! > videoDuration) {
    errors.push(`Trigger time cannot exceed video duration (${formatTime(videoDuration)})`)
  }

  // Type-specific validation
  if (interaction.type === 'POLL' || interaction.type === 'QUIZ') {
    const options = (interaction.config?.options as string[]) || []
    if (options.length < 2) {
      errors.push('At least 2 options required')
    }
    if (options.some(opt => !opt.trim())) {
      errors.push('All options must have text')
    }
  }

  if (interaction.type === 'QUIZ') {
    const correctAnswers = (interaction.config?.correctAnswers as number[]) || []
    if (correctAnswers.length === 0) {
      errors.push('At least one correct answer required')
    }
  }

  if (interaction.type === 'CTA' || interaction.type === 'SPECIAL_OFFER') {
    const url = interaction.config?.buttonUrl as string
    if (url && !isValidUrl(url)) {
      errors.push('Invalid URL format')
    }
  }

  if (interaction.type === 'DOWNLOAD') {
    const url = interaction.config?.downloadUrl as string
    if (!url || !isValidUrl(url)) {
      errors.push('Valid download URL is required')
    }
  }

  return errors
}
```

**Add URL validator:**
```typescript
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

**Update form submission to show errors:**
- Replace `alert()` with inline error display
- Show errors as list above form

### 2.2 Interaction Conflict Detection
**File:** `InteractionsEditorFullScreen.tsx`

**Add conflict detection:**
```typescript
function detectConflicts(
  newInteraction: Partial<Interaction>,
  existingInteractions: Interaction[]
): string[] {
  const warnings: string[] = []
  const triggerTime = newInteraction.triggerTime!

  existingInteractions.forEach(existing => {
    // Skip if comparing to self during edit
    if (existing.id === newInteraction.id) return

    // Exact same time
    if (existing.triggerTime === triggerTime) {
      warnings.push(`Another interaction "${existing.title}" triggers at the same time`)
    }

    // Too close together (within 3 seconds)
    const timeDiff = Math.abs(existing.triggerTime - triggerTime)
    if (timeDiff < 3 && timeDiff > 0) {
      warnings.push(`Very close to "${existing.title}" (${timeDiff}s apart)`)
    }

    // Required interaction followed by another
    if (existing.required && existing.triggerTime < triggerTime && triggerTime - existing.triggerTime < 5) {
      warnings.push(`Follows required interaction "${existing.title}" too closely`)
    }
  })

  return warnings
}
```

**Add visual indicators:**
- Show warning icon on timeline markers with conflicts
- Display warning message in modal when adding/editing

### 2.3 Real-time Validation Feedback
**File:** `InteractionConfigFields` component
- Add validation as user types
- Show red border on invalid fields
- Display helper text with requirements

## Phase 3: Error Handling & User Feedback

### 3.1 Replace Native Dialogs
**Create new component:** `src/components/ui/ConfirmDialog.tsx`
```typescript
interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}
```

**Create new component:** `src/components/ui/Toast.tsx`
```typescript
// Toast notification system for success/error messages
```

**Update all instances:**
- Replace `alert()` with Toast notifications
- Replace `confirm()` with ConfirmDialog
- Replace `setSaveMessage()` with Toast system

### 3.2 API Error Handling
**File:** `InteractionsEditorFullScreen.tsx`

**Improve error handling:**
```typescript
catch (error) {
  console.error('Failed to create interaction:', error)

  let errorMessage = 'Failed to create interaction'

  if (error instanceof Error) {
    errorMessage = error.message
  }

  // Show toast with specific error
  showToast({
    type: 'error',
    title: 'Error',
    message: errorMessage,
  })
}
```

**Add retry logic for network failures:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError!
}
```

### 3.3 Loading States
**File:** `InteractionsSidebar.tsx`
- Add loading spinner on individual interactions during save
- Disable actions while saving
- Visual feedback on optimistic updates

**File:** `VideoTimelineEditor.tsx`
- Show loading state while dragging if save is pending
- Revert position on save failure with animation

## Phase 4: Video Player Robustness

### 4.1 Video Error Handling
**File:** `VideoTimelineEditor.tsx`

**Add error state:**
```typescript
const [videoError, setVideoError] = useState<string | null>(null)
```

**Add error listeners:**
```typescript
useEffect(() => {
  const video = videoRef.current
  if (!video) return

  const handleError = () => {
    const error = video.error
    let message = 'Failed to load video'

    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          message = 'Video loading was aborted'
          break
        case error.MEDIA_ERR_NETWORK:
          message = 'Network error while loading video'
          break
        case error.MEDIA_ERR_DECODE:
          message = 'Video decoding error'
          break
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Video format not supported'
          break
      }
    }

    setVideoError(message)
  }

  const handleCanPlay = () => {
    setVideoError(null)
  }

  video.addEventListener('error', handleError)
  video.addEventListener('canplay', handleCanPlay)

  return () => {
    video.removeEventListener('error', handleError)
    video.removeEventListener('canplay', handleCanPlay)
  }
}, [])
```

**Display error state:**
```typescript
{videoError && (
  <div className="absolute inset-0 bg-black flex items-center justify-center">
    <div className="text-center text-white p-8">
      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
      <h3 className="text-lg font-semibold mb-2">Video Error</h3>
      <p className="text-sm text-gray-300">{videoError}</p>
      <Button
        onClick={() => window.location.reload()}
        className="mt-4"
      >
        Retry
      </Button>
    </div>
  </div>
)}
```

### 4.2 Video Loading State
**Add loading indicator:**
```typescript
const [isVideoLoading, setIsVideoLoading] = useState(true)

// Add to useEffect:
const handleLoadStart = () => setIsVideoLoading(true)
const handleCanPlay = () => setIsVideoLoading(false)

video.addEventListener('loadstart', handleLoadStart)
video.addEventListener('canplay', handleCanPlay)
```

## Phase 5: Performance Optimizations

### 5.1 Memoization
**File:** `InteractionsSidebar.tsx`
```typescript
const InteractionPreviewCard = React.memo(
  React.forwardRef<HTMLDivElement, InteractionPreviewCardProps>((props, ref) => {
    // ... component code
  })
)
```

**File:** `InteractionsEditorFullScreen.tsx`
```typescript
const sortedInteractions = useMemo(
  () => [...interactions].sort((a, b) => a.triggerTime - b.triggerTime),
  [interactions]
)
```

### 5.2 Debounce Drag Updates
**File:** `VideoTimelineEditor.tsx`
- Only save position after user stops dragging (not during)
- Use debounced callback for drag events

## Phase 6: UX Enhancements

### 6.1 Keyboard Shortcuts
**File:** `InteractionsEditorFullScreen.tsx`

**Add keyboard handler:**
```typescript
useEffect(() => {
  function handleKeyPress(e: KeyboardEvent) {
    // Don't trigger if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (e.key) {
      case 'Escape':
        if (showAddModal || editingId) {
          setShowAddModal(false)
          setEditingId(null)
          clearSelectionState()
        }
        break

      case 'Delete':
      case 'Backspace':
        if (selectedInteractionId && !showAddModal && !editingId) {
          e.preventDefault()
          handleDeleteInteraction(selectedInteractionId)
        }
        break
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [selectedInteractionId, showAddModal, editingId])
```

**File:** `VideoTimelineEditor.tsx`
```typescript
// Add Space = play/pause
// Add Left/Right arrow = skip 5s
```

### 6.2 Duplicate Interaction
**File:** `InteractionsSidebar.tsx`
- Add "Duplicate" button to interaction cards
- Copy all fields except ID and increment trigger time by 5s

**File:** `InteractionsEditorFullScreen.tsx`
```typescript
const handleDuplicateInteraction = async (interaction: Interaction) => {
  const duplicate: Partial<Interaction> = {
    ...interaction,
    title: `${interaction.title} (Copy)`,
    triggerTime: Math.min(interaction.triggerTime + 5, videoDuration),
  }

  // Open add modal with pre-filled data
  setNewInteraction(duplicate)
  setTypeConfirmed(true)
  setShowAddModal(true)
}
```

### 6.3 Visual Conflict Indicators
**File:** `VideoTimelineEditor.tsx`
- Add warning icon to markers that have conflicts
- Show tooltip explaining the conflict on hover

**File:** `InteractionsSidebar.tsx`
- Add warning badge to cards with conflicts
- Show conflict details in card preview

## Implementation Order

1. **Day 1: Code Cleanup (Phase 1)**
   - Remove dead code
   - Extract constants and helpers
   - Simplify state management
   - Standardize z-index

2. **Day 2: Validation (Phase 2)**
   - Add form validation
   - Implement conflict detection
   - Add real-time feedback

3. **Day 3: Error Handling (Phase 3)**
   - Create Toast and ConfirmDialog components
   - Replace native dialogs
   - Improve API error handling
   - Add loading states

4. **Day 4: Video Robustness (Phase 4)**
   - Add video error handling
   - Add loading states
   - Add retry logic

5. **Day 5: Polish (Phases 5-6)**
   - Performance optimizations
   - Keyboard shortcuts
   - Duplicate feature
   - Conflict indicators

## Success Criteria

- ✅ No dead code or unused constants
- ✅ No native `alert()` or `confirm()` dialogs
- ✅ All user inputs validated before submission
- ✅ Clear error messages for all failure cases
- ✅ Video errors handled gracefully with retry option
- ✅ Conflicts detected and warned about
- ✅ Keyboard shortcuts work as expected
- ✅ Consistent z-index system with no layering bugs
- ✅ Performance: no unnecessary re-renders
- ✅ Code maintainability: DRY, single responsibility

## Testing Checklist

### Validation Testing
- [ ] Try to create poll with 0 options
- [ ] Try to create poll with 1 option
- [ ] Try to create poll with empty option text
- [ ] Try to create quiz without correct answer
- [ ] Try to create CTA with invalid URL
- [ ] Try to create download without URL
- [ ] Try to set trigger time beyond video duration
- [ ] Try to set negative trigger time

### Conflict Testing
- [ ] Create two interactions at exact same time
- [ ] Create interactions 1 second apart
- [ ] Create interaction right after required one
- [ ] Verify warnings appear in UI

### Error Handling Testing
- [ ] Disconnect network and try to save
- [ ] Try to save with invalid data (should show specific error)
- [ ] Delete interaction and verify confirmation dialog
- [ ] Cancel operations and verify states reset

### Video Testing
- [ ] Load page with invalid video URL
- [ ] Load page with slow network
- [ ] Test with different video formats
- [ ] Verify error messages are clear
- [ ] Test retry functionality

### UX Testing
- [ ] Press Escape to close modals
- [ ] Press Delete to remove selected interaction
- [ ] Duplicate an interaction
- [ ] Drag interaction and verify smooth updates
- [ ] Select interaction on timeline, verify sidebar scrolls
- [ ] Hover on timeline, verify sidebar highlights

## Notes
- Keep backwards compatibility with existing database
- Don't change API endpoints (only client-side changes)
- Maintain current design language
- All changes should be non-breaking
