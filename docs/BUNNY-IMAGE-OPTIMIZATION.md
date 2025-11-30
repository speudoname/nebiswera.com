# Bunny CDN Image Optimization Setup

## Overview

This project uses Bunny CDN's Dynamic Image API for responsive image delivery. This approach provides the best performance and cost-efficiency for our self-hosted setup.

## How It Works

1. **Upload once** - Upload high-quality images (up to 1920px width) using the upload script
2. **Bunny resizes on-demand** - Images are resized via URL parameters (`?width=400`, `?width=800`, etc.)
3. **Global CDN caching** - Each size variant is cached at Bunny's edge servers worldwide
4. **Automatic format conversion** - Bunny automatically converts JPEG → WebP/AVIF based on browser support
5. **No server disk usage** - All optimization and caching happens on Bunny CDN (not on our DigitalOcean Droplet)

## Configuration

### Bunny Pull Zone Settings

- **Optimizer Enabled**: `true`
- **Manipulation Engine**: `true` (enables ?width= parameters)
- **WebP Enabled**: `true`
- **AVIF Enabled**: `true`
- **Image Quality**: `75`

### Next.js Configuration

```javascript
// next.config.js
images: {
  unoptimized: true, // IMPORTANT: Next.js does NO optimization - Bunny handles it all
  remotePatterns: [
    { protocol: 'https', hostname: 'nebiswera-cdn.b-cdn.net' },
  ],
}
```

## Components

### BunnyImage Component

Location: `/src/components/ui/BunnyImage.tsx`

A custom component that generates responsive `srcset` using Bunny's Dynamic Image API.

**Usage:**

```tsx
import { BunnyImage } from '@/components/ui/BunnyImage'

<BunnyImage
  src="https://nebiswera-cdn.b-cdn.net/images/door.jpg"
  alt="Door artwork"
  width={768}
  height={1152}
  quality={75}
  priority
  sizes="(max-width: 768px) 90vw, 50vw"
/>
```

**What it does:**

- Generates multiple width variants (400w, 640w, 768w, 1024w, etc.)
- Creates `srcset` with Bunny URL parameters: `?width=400&quality=75`
- Browser automatically selects appropriate size based on screen
- Lazy loading by default (`priority={false}`)

## Uploading Images

Use the optimized upload script:

```bash
npm run upload-image <path-to-image> [destination-name]
```

**Example:**

```bash
npm run upload-image ~/Downloads/hero.png hero
```

**What it does:**

1. Converts PNG → JPEG (better compression)
2. Resizes to max 1200px width
3. Applies quality 75
4. Shows file size savings
5. Uploads to Bunny CDN

**Script location:** `/scripts/upload-image-optimized.ts`

## Why This Approach?

### ✅ Advantages

- **No disk usage** on DigitalOcean Droplet (all caching on Bunny CDN)
- **Global performance** - Images served from edge servers worldwide
- **Flexible** - Can request any image size via URL parameters
- **Automatic format conversion** - WebP/AVIF for modern browsers
- **Simple uploads** - One file per image, multiple sizes generated automatically
- **Cost-effective** - No image optimization CPU usage on our server

### ❌ Alternative Rejected: Next.js Image Optimization

We disabled Next.js Image optimization because:

- Fills up disk space on Droplet with cached variants
- CDN doesn't cache Next.js optimized images (they're dynamic routes)
- CPU usage on server for image processing
- Slower than pure CDN delivery

### ❌ Alternative Rejected: Pre-Generate Multiple Sizes

We don't manually upload multiple sizes because:

- Storage costs multiply (5x the files)
- Upload time increases
- Inflexible (need to regenerate for new sizes)
- More complex upload scripts

## Responsive Sizing Strategy

### Background Images (100vw)

```tsx
<BunnyImage
  src="https://nebiswera-cdn.b-cdn.net/images/frustration.jpg"
  width={1920}
  height={1920}
  sizes="100vw"
  quality={60}  // Lower quality for backgrounds
/>
```

Generates: 400w, 640w, 768w, 1024w, 1280w, 1536w, 1920w

### Featured Images (50vw on desktop, 90vw on mobile)

```tsx
<BunnyImage
  src="https://nebiswera-cdn.b-cdn.net/images/door.jpg"
  width={768}
  height={1152}
  sizes="(max-width: 768px) 90vw, 50vw"
  quality={75}
/>
```

Generates: 400w, 640w, 768w

## File Size Results

| Image | Original | Optimized | Savings |
|-------|----------|-----------|---------|
| door.jpg | 4368.8 KB (PNG) | 1271.9 KB (JPEG) | 70.9% |
| frustration.jpg | 3443.1 KB (PNG) | 329.4 KB (JPEG) | 90.4% |

Plus additional 25-35% savings from WebP/AVIF conversion by Bunny CDN.

## Testing

To verify responsive images are working:

1. Open browser DevTools → Network tab
2. Filter by "Img"
3. Resize browser window
4. Reload page
5. Check image URLs - should see different `?width=` values for different screen sizes

**Example URLs you should see:**

- Mobile (375px): `door.jpg?width=400&quality=75`
- Tablet (768px): `door.jpg?width=768&quality=75`
- Desktop (1920px): `door.jpg?width=1536&quality=75`

## Utility Scripts

- **List images:** `npx tsx scripts/list-bunny-images.ts`
- **Delete image:** `npx tsx scripts/delete-bunny-image.ts images/filename.jpg`
- **Check Pull Zone settings:** `npx tsx scripts/check-bunny-pullzone.ts`

## Resources

- [Bunny Dynamic Image API Docs](https://docs.bunny.net/docs/stream-image-processing)
- Component: `/src/components/ui/BunnyImage.tsx`
- Upload script: `/scripts/upload-image-optimized.ts`
