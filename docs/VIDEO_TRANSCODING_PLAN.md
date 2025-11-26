# Video Transcoding System - R2 + FFmpeg

## Overview

Replace Cloudflare Stream with self-hosted video transcoding using:
- **R2**: Store original and transcoded video files (free egress)
- **FFmpeg**: Transcode videos to HLS with multiple qualities
- **Railway Worker**: Background service for transcoding jobs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      UPLOAD FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Admin uploads video                                            │
│         ↓                                                        │
│   Next.js API receives file                                      │
│         ↓                                                        │
│   Upload original to R2 (webinars/originals/{id}.mp4)           │
│         ↓                                                        │
│   Create job in video_processing_jobs table (status: PENDING)    │
│         ↓                                                        │
│   Return to admin: "Processing..."                               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      WORKER FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Worker polls DB for PENDING jobs                               │
│         ↓                                                        │
│   Download original from R2                                      │
│         ↓                                                        │
│   FFmpeg transcode to HLS:                                       │
│     - 1080p (if source >= 1080p)                                │
│     - 720p                                                       │
│     - 480p                                                       │
│     - Generate master.m3u8 playlist                              │
│     - Generate thumbnail                                         │
│         ↓                                                        │
│   Upload HLS files to R2 (webinars/processed/{id}/)              │
│         ↓                                                        │
│   Update job status: COMPLETED                                   │
│         ↓                                                        │
│   Update webinar record with video URLs                          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      PLAYBACK FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User visits webinar watch page                                 │
│         ↓                                                        │
│   Load HLS.js player                                             │
│         ↓                                                        │
│   Player loads master.m3u8 from R2                               │
│         ↓                                                        │
│   Auto-adaptive quality based on bandwidth                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## R2 Folder Structure

```
nebiswera-bucket/
├── webinars/
│   ├── originals/
│   │   └── {webinarId}/
│   │       └── original.mp4
│   └── processed/
│       └── {webinarId}/
│           ├── master.m3u8          (HLS master playlist)
│           ├── 1080p/
│           │   ├── playlist.m3u8
│           │   └── segment-*.ts
│           ├── 720p/
│           │   ├── playlist.m3u8
│           │   └── segment-*.ts
│           ├── 480p/
│           │   ├── playlist.m3u8
│           │   └── segment-*.ts
│           └── thumbnail.jpg
```

## Implementation Steps

### Step 1: Database Schema
- [ ] Add `VideoProcessingJob` model to Prisma schema
- [ ] Run migration

```prisma
model VideoProcessingJob {
  id              String   @id @default(cuid())
  webinarId       String   @unique
  webinar         Webinar  @relation(fields: [webinarId], references: [id], onDelete: Cascade)

  status          VideoProcessingStatus @default(PENDING)
  progress        Int      @default(0)  // 0-100

  // Source
  originalUrl     String   // R2 URL of original file
  originalSize    BigInt?  // File size in bytes

  // Output (populated after processing)
  hlsUrl          String?  // R2 URL to master.m3u8
  thumbnailUrl    String?  // R2 URL to thumbnail
  duration        Int?     // Duration in seconds

  // Processing info
  startedAt       DateTime?
  completedAt     DateTime?
  error           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@schema("webinar")
  @@map("video_processing_jobs")
}

enum VideoProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED

  @@schema("webinar")
}
```

### Step 2: Update Webinar Model
- [ ] Add video fields to Webinar model

```prisma
// Add to Webinar model:
hlsUrl          String?  // URL to HLS master playlist
thumbnailUrl    String?  // URL to video thumbnail
videoDuration   Int?     // Duration in seconds
videoStatus     String?  // 'processing' | 'ready' | 'failed'
```

### Step 3: Video Upload API
- [ ] Create/update `/api/admin/webinars/upload` endpoint
- [ ] Accept video file upload
- [ ] Upload original to R2
- [ ] Create processing job in database
- [ ] Return job ID for status polling

### Step 4: FFmpeg Worker Service
- [ ] Create new Railway service: `video-worker`
- [ ] Dockerfile with FFmpeg installed
- [ ] Node.js script to:
  - Poll database for pending jobs
  - Download video from R2
  - Run FFmpeg transcoding
  - Upload HLS files to R2
  - Update job status

### Step 5: Job Status API
- [ ] Create `/api/admin/webinars/[id]/video-status` endpoint
- [ ] Return processing status, progress, errors

### Step 6: Update Video Player
- [ ] Replace Cloudflare Stream player with HLS.js
- [ ] Load video from R2 HLS URL
- [ ] Handle quality switching

### Step 7: Admin UI Updates
- [ ] Show processing status in webinar editor
- [ ] Progress bar during transcoding
- [ ] Error handling and retry option

## FFmpeg Commands

### Transcode to HLS with multiple qualities:

```bash
# 1080p
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -preset fast -crf 22 \
  -c:a aac -b:a 128k -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename '1080p/segment-%03d.ts' 1080p/playlist.m3u8

# 720p
ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename '720p/segment-%03d.ts' 720p/playlist.m3u8

# 480p
ffmpeg -i input.mp4 -vf scale=854:480 -c:v libx264 -preset fast -crf 24 \
  -c:a aac -b:a 96k -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename '480p/segment-%03d.ts' 480p/playlist.m3u8

# Thumbnail
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 -vf scale=640:360 thumbnail.jpg
```

### Master playlist (master.m3u8):
```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480
480p/playlist.m3u8
```

## Worker Dockerfile

```dockerfile
FROM node:20-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "worker.js"]
```

## Environment Variables (Worker)

```
DATABASE_URL=postgresql://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=nebiswera
R2_PUBLIC_URL=https://cdn.nebiswera.com
```

## Cost Estimate

| Resource | Cost |
|----------|------|
| R2 Storage | ~$0.015/GB/month |
| R2 Egress | FREE |
| Railway Worker (transcoding) | ~$0.01-0.02 per video |
| **Total per webinar** | **~$0.02-0.05** |

## Timeline

1. **Step 1-2**: Database schema (~30 min)
2. **Step 3**: Upload API (~1 hour)
3. **Step 4**: Worker service (~2 hours)
4. **Step 5-6**: Status API + Player (~1 hour)
5. **Step 7**: Admin UI (~30 min)

**Total: ~5 hours**

## Deploying the Worker to Railway

1. **Create a new service in Railway**:
   - Go to your Railway project
   - Click "New Service" → "GitHub Repo"
   - Select the same repo but set root directory to `video-worker`

2. **Configure build settings**:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node worker.js`
   - Or use the Dockerfile (recommended)

3. **Set environment variables**:
   ```
   DATABASE_URL=<copy from main app>
   R2_ACCOUNT_ID=71c315d5a485ec66ea22a5f76139b944
   R2_ACCESS_KEY_ID=<copy from main app>
   R2_SECRET_ACCESS_KEY=<copy from main app>
   R2_BUCKET_NAME=nebiswera
   R2_PUBLIC_URL=https://cdn.nebiswera.com
   ```

4. **Scaling considerations**:
   - Start with 1 instance (handles jobs sequentially)
   - Scale horizontally if needed (jobs are claimed atomically)
   - Consider Railway's "Hobby" plan to start (~$5/month)

## Status

- [x] Database schema (VideoProcessingJob model)
- [x] R2 upload with presigned URLs
- [x] Upload API endpoint
- [x] Job status polling API
- [x] FFmpeg worker service created
- [ ] Deploy worker to Railway
- [ ] Test end-to-end upload + transcode
- [ ] Update video player for HLS playback

## Notes

- Worker polls for PENDING jobs every 10 seconds
- Max 3 retry attempts per job
- Health check endpoint at /health
- Graceful shutdown waits for current job to complete
- Worker creates 480p, 720p, 1080p variants (based on source resolution)
- HLS segments are 6 seconds each for good seeking performance
