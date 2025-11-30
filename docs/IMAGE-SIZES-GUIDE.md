# Image Sizes Attribute - Complete Guide

## The Problem You Asked About

**Question:** "Does the browser understand that this image is small on screen, or does it serve the full resolution?"

**Answer:** The browser **ONLY knows** what you tell it via the `sizes` attribute. It doesn't automatically detect the rendered size.

## How `sizes` Works

The `sizes` attribute tells the browser: **"How many CSS pixels will this image occupy in the layout?"**

### Example Breakdown:

```tsx
<BunnyImage
  src="door.jpg"
  width={768}
  sizes="(max-width: 768px) 90vw, 448px"
/>
```

**What happens:**

1. **Mobile (375px viewport):**
   - Browser reads: `(max-width: 768px) 90vw` ← This condition matches
   - Calculates: `375px * 90% = 337px` needed
   - From srcset [400w, 640w, 768w], picks: `400w` (smallest ≥ 337px)
   - Downloads: `door.jpg?width=400`

2. **Desktop (1920px viewport):**
   - Browser reads: `448px` ← Mobile condition doesn't match, uses default
   - Calculates: `448px` needed (fixed value, not percentage)
   - From srcset [400w, 640w, 768w], picks: `640w` (smallest ≥ 448px)
   - Downloads: `door.jpg?width=640`

## Common Mistakes

### ❌ Wrong: Using viewport percentages for fixed-width containers

```tsx
<div className="max-w-md"> {/* 448px max */}
  <BunnyImage
    sizes="50vw"  ❌ WRONG!
    // On 1920px screen: 50vw = 960px
    // But container is only 448px!
    // Browser downloads 1024w instead of 640w
  />
</div>
```

### ✅ Correct: Match the actual rendered size

```tsx
<div className="max-w-md"> {/* 448px max */}
  <BunnyImage
    sizes="(max-width: 768px) 90vw, 448px"  ✅ CORRECT
    // Mobile: 90% of viewport
    // Desktop: 448px fixed (matches max-w-md)
  />
</div>
```

## Our Implementation

### 1. Background Images (Low Quality is Fine)

```tsx
// Background with opacity and blur
<div className="opacity-10">
  <BunnyImage
    src="door.jpg"
    width={1200}      // Max size we'll ever need
    quality={50}      // Low quality (it's blurred anyway)
    sizes="100vw"     // Full viewport width
  />
</div>
```

**Result:**
- Mobile (375px): Downloads `door.jpg?width=400&quality=50`
- Tablet (768px): Downloads `door.jpg?width=768&quality=50`
- Desktop (1920px): Downloads `door.jpg?width=1200&quality=50`

**Why quality=50?**
- Image is at 10% opacity and used as subtle background
- User won't notice compression artifacts
- Saves ~40% file size vs quality=75

---

### 2. Featured Images (Higher Quality)

```tsx
// Featured image in max-w-md container (448px)
<div className="max-w-md">
  <BunnyImage
    src="door.jpg"
    width={768}       // 768px covers retina displays (448 * 2 = 896, so 768 is close)
    quality={75}      // Higher quality (user focus on this)
    sizes="(max-width: 768px) 90vw, 448px"
  />
</div>
```

**Result:**
- Mobile (375px): Downloads `door.jpg?width=400&quality=75` (~60-80 KB as WebP)
- Tablet (768px): Downloads `door.jpg?width=768&quality=75` (~150 KB as WebP)
- Desktop (1920px): Downloads `door.jpg?width=640&quality=75` (~120 KB as WebP)

**Why 448px on desktop?**
- Tailwind's `max-w-md` = 448px
- Even on 4K screen, image container never exceeds 448px
- So we tell browser: "Don't download bigger than 640w"

---

## Tailwind Width Reference

Common Tailwind max-width classes and their pixel values:

| Class | Pixels | Recommended `sizes` (desktop) |
|-------|--------|-------------------------------|
| `max-w-xs` | 320px | `320px` |
| `max-w-sm` | 384px | `384px` |
| `max-w-md` | 448px | `448px` |
| `max-w-lg` | 512px | `512px` |
| `max-w-xl` | 576px | `576px` |
| `max-w-2xl` | 672px | `672px` |
| `max-w-4xl` | 896px | `896px` |
| `max-w-7xl` | 1280px | `1280px` |

## How to Calculate Correct `sizes`

### Step 1: Inspect the Container

```tsx
<div className="max-w-md md:w-1/2">
  <BunnyImage ... />
</div>
```

- Mobile: No max-width, so likely `90vw` or `100vw`
- Desktop: `md:w-1/2` means 50% of parent
- But `max-w-md` caps it at 448px

### Step 2: Write the `sizes` Attribute

```tsx
sizes="(max-width: 768px) 90vw, 448px"
```

Translation:
- **Mobile (≤768px):** Image is 90% of viewport width
- **Desktop (>768px):** Image is capped at 448px (max-w-md)

### Step 3: Set Appropriate `width` and `quality`

```tsx
width={768}    // 448 * 2 for retina = 896, round down to 768
quality={75}   // Standard quality for featured images
```

## Testing Your Setup

### Browser DevTools

1. Open Network tab → Filter by "Img"
2. Resize browser window
3. Reload page
4. Check image URLs

**What you should see:**

| Screen Width | Expected URL |
|--------------|-------------|
| 375px (mobile) | `door.jpg?width=400&quality=75` |
| 768px (tablet) | `door.jpg?width=640&quality=75` |
| 1920px (desktop) | `door.jpg?width=640&quality=75` (same as tablet!) |

**Why same on desktop?**
Because `sizes="448px"` tells browser the image is 448px, so it picks 640w (the smallest that's ≥448px).

## Key Takeaways

1. **`sizes` is required** - Without it, browser assumes `100vw` (full viewport)
2. **Match actual layout** - Inspect your CSS to find real rendered width
3. **Use pixels for fixed containers** - `max-w-md` = `448px` in sizes
4. **Use percentages for fluid layouts** - `w-full` = `100vw` in sizes
5. **Background images can be lower quality** - Use quality=50 for subtle backgrounds
6. **Featured images need higher quality** - Use quality=75 for user-focused images

## Common Patterns

### Full-width hero

```tsx
<BunnyImage sizes="100vw" />
```

### Sidebar (1/3 width on desktop)

```tsx
<BunnyImage sizes="(max-width: 768px) 100vw, 33vw" />
```

### Grid item (3 columns on desktop)

```tsx
<BunnyImage sizes="(max-width: 768px) 100vw, 33vw" />
```

### Card in max-width container

```tsx
<BunnyImage sizes="(max-width: 768px) 90vw, 448px" />
```

### Background (full viewport)

```tsx
<BunnyImage sizes="100vw" quality={50} />
```
