# Testimonial Form Multi-Step Redesign Plan

## Overview
Transform the testimonial form into a multi-step process where each step auto-saves progress. Users can stop at any step and their submission is already saved.

---

## Step 1: Basic Information & Review ⭐
**Required fields - Cannot proceed without these**

### Fields:
- Name (text input)
- Email (email input)
- Review/Opinion (textarea, 500 chars max)
- Rating (1-5 stars, visual star selector)

### UI:
- Clean, focused layout
- Character counter for review
- Visual star rating (clickable stars)
- "Next" button (disabled until all required fields filled)

### Backend:
- On "Next" click → Create testimonial with status `PENDING`
- Save: name, email, text, rating, locale
- Return testimonial ID to use in subsequent steps
- User can close browser at this point - testimonial already saved ✅

---

## Step 2: Profile Photo (Optional) 📸
**Can skip this step**

### Options:
1. **Take Photo with Camera**
   - "Take Photo" button
   - Opens camera preview (full screen or large area)
   - Shows countdown: "3... 2... 1..." (1 second each)
   - Flash effect (white screen overlay briefly)
   - Photo captured automatically after countdown
   - Preview shown with "Retake" or "Use This Photo" buttons

2. **Upload Photo**
   - "Upload from Device" button
   - File picker (images only)
   - Preview before confirming

### Visual Guide:
- Show example testimonial card with small circular profile photo
- Text: "Your photo will appear like this in your testimonial"
- Visual mockup showing their photo in a testimonial card

### UI Elements:
- **Take Photo** button
- **Upload Photo** button
- **Skip** button (bottom, secondary style)
- Photo preview with circular crop preview
- "Retake" / "Use This Photo" / "Remove Photo" buttons when photo selected

### Backend:
- Upload photo to R2
- Update testimonial: `profilePhoto` field
- PATCH `/api/testimonials/{id}` with profile photo URL

---

## Step 3: Audio or Video Testimonial (Optional) 🎤📹
**Can skip this step**

### Motivation Message:
Big, encouraging heading:
> "Want to make your testimonial even more powerful? 🌟"

Subtext:
> "Audio or video testimonials are incredibly impactful! They help others feel the genuine emotion and authenticity of your experience. It only takes a minute!"

### Options:
1. **Record Audio**
   - Visual waveform during recording
   - Record/Stop/Play buttons
   - Time indicator
   - "Use This" or "Re-record" options

2. **Record Video**
   - Camera preview
   - Record/Stop buttons
   - Time indicator (max 2 minutes?)
   - "Use This" or "Re-record" options

3. **Upload Audio/Video**
   - File picker
   - Show file name and duration when selected
   - Preview/play option

### UI Elements:
- Tabs or cards: "Audio" | "Video" | "Upload"
- Large, friendly buttons
- **Skip** button (bottom, secondary style)
- Visual recording indicators (red dot, timer)
- Playback controls for review

### Backend:
- Upload audio/video to R2
- Update testimonial: `audioUrl` or `videoUrl` field, `type` field
- PATCH `/api/testimonials/{id}`

---

## Step 4: Additional Images (Optional) 🖼️
**Can skip this step**

### Purpose:
"Have any photos that relate to your experience? Add up to 3 images!"

Examples:
- Screenshots
- Event photos
- Relevant visual content

### UI:
- Visual upload area (drag & drop + click to upload)
- Grid of uploaded images (max 3)
- Each image has "Remove" X button
- **Skip** button
- **Next** button (even if no images added)

### Backend:
- Upload images to R2 (max 3)
- Update testimonial: `images` array field
- PATCH `/api/testimonials/{id}`

---

## Step 5: Thank You! 🎉

### Message:
Big celebratory message:
> "Thank you so much! 💜"

Subtext:
> "Your testimonial means the world to us. It will be reviewed by our team and published soon. We appreciate you taking the time to share your experience!"

### UI:
- Success icon/animation
- Thank you message
- "View All Testimonials" button → `/love` page
- "Back to Home" button → home page

---

## Technical Implementation Plan

### 1. Create New Components
```
src/app/[locale]/(public)/collectlove/
├── CollectLoveMultiStepForm.tsx (main container)
├── steps/
│   ├── Step1BasicInfo.tsx
│   ├── Step2ProfilePhoto.tsx
│   ├── Step3AudioVideo.tsx
│   ├── Step4AdditionalImages.tsx
│   └── Step5ThankYou.tsx
└── components/
    ├── StepIndicator.tsx (progress bar/steps)
    ├── CameraCapture.tsx (camera with countdown)
    ├── AudioRecorder.tsx (already exists - can reuse/enhance)
    ├── VideoRecorder.tsx (already exists - can reuse/enhance)
    └── ImageUploader.tsx
```

### 2. State Management
- Use `useState` for current step (1-5)
- Store `testimonialId` after Step 1 submission
- Track completion status of each optional step

### 3. API Updates
Modify `/api/testimonials/[id]/route.ts`:
- Allow PATCH updates to existing testimonials
- Allow partial updates (only send changed fields)
- Don't require all fields for PATCH

### 4. Camera Countdown Component
```tsx
// Countdown logic:
// Show "3" for 1 second
// Show "2" for 1 second
// Show "1" for 1 second
// Flash white overlay (0.2s)
// Capture photo
// Show preview
```

### 5. Progress Indicator
- Visual step indicator at top: `1 → 2 → 3 → 4 → 5`
- Highlight current step
- Show completed steps with checkmarks

### 6. Translations
Add to `content/messages/ka.json` and `en.json`:
- All step titles
- Instructions
- Button labels
- Motivation messages
- Thank you message

---

## User Flow Diagram

```
START
  ↓
[Step 1: Basic Info] ← REQUIRED
  ↓ (Submit - testimonial saved)
  ↓
[Step 2: Profile Photo] ← Optional (Skip available)
  ↓ (Update testimonial)
  ↓
[Step 3: Audio/Video] ← Optional (Skip available)
  ↓ (Update testimonial)
  ↓
[Step 4: Images] ← Optional (Skip available)
  ↓ (Update testimonial)
  ↓
[Step 5: Thank You] ← Final
  ↓
END
```

---

## Key Principles

1. **Save Early, Save Often**
   - After Step 1, testimonial exists in DB
   - Each subsequent step just updates it
   - User can leave at any time - progress saved

2. **Optional is Optional**
   - Clear "Skip" buttons on Steps 2-4
   - No guilt-tripping, just encouragement
   - Easy to skip if user wants

3. **Visual Guidance**
   - Show examples of how their content will appear
   - Preview before confirming
   - Clear instructions at each step

4. **Mobile-First**
   - Camera access on mobile
   - Touch-friendly buttons
   - Responsive layouts

5. **Smooth Transitions**
   - Fade/slide animations between steps
   - Loading indicators during uploads
   - Success feedback on saves

---

## Validation Rules

### Step 1 (Required):
- Name: min 2 chars
- Email: valid email format
- Review: min 10 chars, max 500 chars
- Rating: must select 1-5 stars

### Steps 2-4 (Optional):
- No validation - can skip entirely
- File size limits: Images 10MB, Audio 50MB, Video 100MB
- File type validation on upload

---

## Error Handling

- Network errors: Show retry button
- Upload failures: Allow user to skip or retry
- Camera/mic permission denied: Show instructions + skip option
- Show friendly error messages in user's language

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Complexity**: Medium-High (camera countdown, multi-step state management)

