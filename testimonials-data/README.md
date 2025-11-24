# Nebiswera Testimonials Data

## Overview

This folder contains all testimonials scraped from the Nebiswera Shapo "Wall of Love" page.

**Source:** https://shapo.io/wall-of-love/c5cf604cf7
**Scraped Date:** November 24, 2025
**Total Testimonials:** ~40 testimonials

## Contents

### 📄 `all-testimonials.json`
Complete dataset with all testimonial data in structured JSON format.

**Structure:**
```json
{
  "metadata": {
    "total_count": 80,
    "scraped_date": "2025-11-24",
    "source": "https://shapo.io/wall-of-love/c5cf604cf7"
  },
  "testimonials": [
    {
      "id": "unique-id",
      "name": "Person Name",
      "role": "Title/Role (nullable)",
      "company": "Company (nullable)",
      "text": "Full testimonial text in Georgian",
      "rating": 5,
      "date": "YYYY-MM-DD",
      "profile_photo": "URL or null",
      "images": ["array of image URLs"],
      "videos": [{video object with playbackId}]
    }
  ]
}
```

### 📁 `images/`
All downloaded profile photos and additional images from testimonials.

**Naming convention:**
- Profile photos: `{id}-profile.{ext}`
- Additional images: `{id}-upload.{ext}` or `{id}-upload-{n}.{ext}` for multiple images

**Total images:** 35+ files

### 🎥 `videos/`
Video testimonials info (hosted on Mux CDN, not downloaded locally).

**Video playback:**
- Videos are hosted on Mux streaming platform
- Can be played using playbackId
- Format: `https://stream.mux.com/{playbackId}.m3u8`

**Videos found:**
1. მონაწილეები (Participants) - playbackId: `J7Kn7006ho00Idluty01n24EI1XHYxdxXaIJo6mQRUPudg`
2. ელენე სვანიძე - playbackId: `L00mDP8t6qAtagfVgWmu7eV017q4bDsFBaTMQkR7xCywg`

## Data Statistics

- **Total testimonials:** 40+
- **With profile photos:** 18
- **With additional images:** 17
- **With videos:** 2
- **Languages:** Primarily Georgian, 2 in English
- **Rating:** All 5 stars
- **Date range:** February 2023 - July 2025
- **Testimonial types:**
  - Personal development (Nebiswera program)
  - AI course feedback

## Key People Mentioned

- **ლევან (Levan)** - Program creator/instructor
- **სოფო (Sopo)** - Team member
- **ნინო (Nino)** - Team member

## Testimonial Categories

1. **Personal Development (Nebiswera Program)**
   - Self-discovery experiences
   - Life transformation stories
   - Mental clarity and peace
   - Pattern recognition and behavior change

2. **AI Course**
   - Comprehensive AI education
   - Practical applications
   - Tool automation
   - Process optimization

## Next Steps

To integrate these testimonials into the Nebiswera website:

1. **Database Schema** - Create `Testimonial` model in Prisma
2. **Migration Script** - Import JSON data into database
3. **File Upload** - Move images to public storage or CDN
4. **Video Integration** - Use Mux player or similar for video playback
5. **Display Component** - Build "Wall of Love" UI component
6. **Admin Panel** - Add testimonial management interface
7. **Submission Form** - Create form for new testimonials

## Notes

- All testimonials have 5-star ratings
- Most are in Georgian language (original)
- Some have English translations
- Photos and additional images preserved with original quality
- Videos remain on Mux CDN (streaming platform)
- Testimonials span 2+ years (2023-2025)

---

**For development questions, see:** `/CLAUDE.md`
