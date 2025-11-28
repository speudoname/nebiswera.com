// Migration script: Move Mux testimonial videos to R2
// Run with: npx tsx scripts/migrate-mux-testimonials.ts

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'nebiswera'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.nebiswera.com'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
})

// Extract Mux playback ID from URL
function getMuxPlaybackId(url: string): string | null {
  // https://stream.mux.com/xxx.m3u8 or https://image.mux.com/xxx/thumbnail.jpg
  const streamMatch = url.match(/stream\.mux\.com\/([^.\/]+)/)
  const imageMatch = url.match(/image\.mux\.com\/([^\/]+)/)
  return streamMatch?.[1] || imageMatch?.[1] || null
}

// Download file from URL
async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log(`  Downloading: ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
  console.log(`  Downloaded: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

// Download HLS stream using ffmpeg
function downloadHLS(hlsUrl: string, outputPath: string): void {
  console.log(`  Downloading HLS: ${hlsUrl}`)
  try {
    execSync(`ffmpeg -i "${hlsUrl}" -c copy -bsf:a aac_adtstoasc "${outputPath}" -y`, {
      stdio: 'pipe',
      timeout: 300000 // 5 min timeout
    })
    const stats = fs.statSync(outputPath)
    console.log(`  Downloaded: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`)
  } catch (error) {
    throw new Error(`ffmpeg failed: ${error instanceof Error ? error.message : error}`)
  }
}

// Extract thumbnail from video using ffmpeg
function extractThumbnail(videoPath: string, outputPath: string): void {
  console.log(`  Extracting thumbnail from video`)
  try {
    execSync(`ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=640:-1" "${outputPath}" -y`, {
      stdio: 'pipe'
    })
    console.log(`  Thumbnail extracted: ${outputPath}`)
  } catch (error) {
    throw new Error(`Failed to extract thumbnail: ${error instanceof Error ? error.message : error}`)
  }
}

// Upload file to R2
async function uploadToR2(localPath: string, r2Key: string, contentType: string): Promise<string> {
  const buffer = fs.readFileSync(localPath)

  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
  }))

  const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`
  console.log(`  Uploaded to R2: ${publicUrl}`)
  return publicUrl
}

// Optimize image using sharp (via CLI)
function optimizeImage(inputPath: string, outputPath: string, width: number = 640): void {
  // Use sips on macOS to resize and convert
  try {
    execSync(`sips -z ${Math.round(width * 0.5625)} ${width} "${inputPath}" --out "${outputPath}"`, { stdio: 'pipe' })
    console.log(`  Optimized thumbnail: ${width}px wide`)
  } catch {
    // If sips fails, just copy the file
    fs.copyFileSync(inputPath, outputPath)
    console.log(`  Copied thumbnail (optimization skipped)`)
  }
}

async function migrateTestimonials() {
  console.log('=== Migrating Mux Testimonials to R2 ===\n')

  // Find all testimonials with Mux video URLs
  const testimonials = await prisma.testimonial.findMany({
    where: {
      videoUrl: { contains: 'mux.com' },
    },
    select: {
      id: true,
      name: true,
      videoUrl: true,
      videoThumbnail: true,
    },
  })

  if (testimonials.length === 0) {
    console.log('No Mux testimonials found!')
    return
  }

  console.log(`Found ${testimonials.length} testimonials with Mux videos\n`)

  // Create temp directory
  const tempDir = path.join(process.cwd(), 'temp-migration')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  for (const testimonial of testimonials) {
    console.log(`\nProcessing testimonial: ${testimonial.id}`)
    console.log(`  Name: ${testimonial.name || 'Anonymous'}`)

    try {
      const playbackId = getMuxPlaybackId(testimonial.videoUrl!)
      if (!playbackId) {
        console.log(`  ERROR: Could not extract playback ID from ${testimonial.videoUrl}`)
        continue
      }

      console.log(`  Mux Playback ID: ${playbackId}`)

      // Mux HLS stream URL
      const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`

      const videoPath = path.join(tempDir, `${playbackId}.mp4`)
      const thumbPath = path.join(tempDir, `${playbackId}_thumb.jpg`)

      // Download HLS stream using ffmpeg
      downloadHLS(hlsUrl, videoPath)

      // Extract thumbnail from video using ffmpeg
      extractThumbnail(videoPath, thumbPath)

      // Upload to R2
      const r2VideoKey = `testimonials/${testimonial.id}/video.mp4`
      const r2ThumbKey = `testimonials/${testimonial.id}/thumbnail.jpg`

      const newVideoUrl = await uploadToR2(videoPath, r2VideoKey, 'video/mp4')
      const newThumbnailUrl = await uploadToR2(thumbPath, r2ThumbKey, 'image/jpeg')

      // Update database
      await prisma.testimonial.update({
        where: { id: testimonial.id },
        data: {
          videoUrl: newVideoUrl,
          videoThumbnail: newThumbnailUrl,
        },
      })

      console.log(`  ✓ Updated database with new URLs`)

      // Cleanup temp files
      fs.unlinkSync(videoPath)
      fs.unlinkSync(thumbPath)

    } catch (error) {
      console.log(`  ERROR: ${error instanceof Error ? error.message : error}`)
    }
  }

  // Cleanup temp directory
  try {
    fs.rmdirSync(tempDir)
  } catch {
    // Ignore if not empty
  }

  console.log('\n=== Migration Complete ===')

  // Show results
  const updated = await prisma.testimonial.findMany({
    where: { videoUrl: { not: null } },
    select: { id: true, name: true, videoUrl: true, videoThumbnail: true },
  })

  console.log('\nUpdated testimonials:')
  for (const t of updated) {
    console.log(`  ${t.name || 'Anonymous'}:`)
    console.log(`    Video: ${t.videoUrl}`)
    console.log(`    Thumb: ${t.videoThumbnail}`)
  }
}

migrateTestimonials()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
