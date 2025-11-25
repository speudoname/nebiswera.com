/**
 * Script to generate thumbnails for existing video testimonials
 * Run with: npx tsx scripts/generate-existing-thumbnails.ts
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

const prisma = new PrismaClient()

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

function isMuxVideo(url: string): boolean {
  return url.includes('stream.mux.com')
}

function getMuxPlaybackId(url: string): string | null {
  // Extract playback ID from Mux URL
  // Format: https://stream.mux.com/{PLAYBACK_ID}.m3u8
  const match = url.match(/stream\.mux\.com\/([^.]+)/)
  return match ? match[1] : null
}

function getMuxThumbnailUrl(playbackId: string, time: number = 1): string {
  // Mux thumbnail API: https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg?time={seconds}
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=1280`
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function downloadVideoFromR2(videoUrl: string): Promise<Buffer> {
  // Extract the key from the R2 URL
  const url = new URL(videoUrl)
  const key = url.pathname.substring(1) // Remove leading '/'

  console.log(`  Downloading video from R2: ${key}`)

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)
  if (!response.Body) {
    throw new Error('No video data received')
  }

  return streamToBuffer(response.Body as Readable)
}

async function generateThumbnailFromBuffer(
  videoBuffer: Buffer
): Promise<Buffer> {
  // For server-side thumbnail generation, we'll use a different approach
  // Since we can't use browser APIs, we'll use ffmpeg or similar
  // For now, let's create a placeholder approach using the first frame

  // Note: This requires ffmpeg to be installed on the server
  const { execSync } = await import('child_process')
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')

  // Create temporary files
  const tempDir = os.tmpdir()
  const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`)
  const thumbnailPath = path.join(tempDir, `thumb-${Date.now()}.jpg`)

  try {
    // Write video buffer to temp file
    fs.writeFileSync(videoPath, videoBuffer)

    // Use ffmpeg to extract frame at 1 second
    execSync(
      `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${thumbnailPath}"`,
      { stdio: 'ignore' }
    )

    // Read thumbnail
    const thumbnailBuffer = fs.readFileSync(thumbnailPath)

    // Clean up temp files
    fs.unlinkSync(videoPath)
    fs.unlinkSync(thumbnailPath)

    return thumbnailBuffer
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
    if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath)
    throw error
  }
}

async function uploadThumbnailToR2(
  thumbnailBuffer: Buffer,
  originalVideoKey: string
): Promise<string> {
  // Generate thumbnail key based on video key
  const ext = '.jpg'
  const timestamp = Date.now()
  const thumbnailKey = `thumbnails/thumb-${timestamp}${ext}`

  console.log(`  Uploading thumbnail to R2: ${thumbnailKey}`)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: thumbnailKey,
    Body: thumbnailBuffer,
    ContentType: 'image/jpeg',
  })

  await s3Client.send(command)

  return `${R2_PUBLIC_URL}/${thumbnailKey}`
}

async function main() {
  console.log('🎬 Starting thumbnail generation for existing videos...\n')

  // Find all video testimonials without thumbnails
  const videoTestimonials = await prisma.testimonial.findMany({
    where: {
      videoUrl: {
        not: null,
      },
      videoThumbnail: null,
    },
    select: {
      id: true,
      name: true,
      videoUrl: true,
    },
  })

  if (videoTestimonials.length === 0) {
    console.log('✅ No videos found that need thumbnails!')
    return
  }

  console.log(`Found ${videoTestimonials.length} videos without thumbnails\n`)

  let processed = 0
  let failed = 0

  for (const testimonial of videoTestimonials) {
    try {
      console.log(`Processing: ${testimonial.name} (${testimonial.id})`)

      let thumbnailUrl: string

      if (isMuxVideo(testimonial.videoUrl!)) {
        // Handle Mux videos - just use Mux's thumbnail URL directly
        console.log(`  Detected Mux video`)
        const playbackId = getMuxPlaybackId(testimonial.videoUrl!)
        if (!playbackId) {
          throw new Error('Could not extract Mux playback ID')
        }

        thumbnailUrl = getMuxThumbnailUrl(playbackId)
        console.log(`  Using Mux thumbnail: ${thumbnailUrl}`)
      } else {
        // Handle R2 videos - download, generate thumbnail, upload
        console.log(`  Detected R2 video`)

        // Download video from R2
        const videoBuffer = await downloadVideoFromR2(testimonial.videoUrl!)

        // Generate thumbnail
        console.log(`  Generating thumbnail...`)
        const thumbnailBuffer = await generateThumbnailFromBuffer(videoBuffer)

        // Upload thumbnail to R2
        thumbnailUrl = await uploadThumbnailToR2(
          thumbnailBuffer,
          testimonial.videoUrl!
        )
      }

      // Update database
      console.log(`  Updating database...`)
      await prisma.testimonial.update({
        where: { id: testimonial.id },
        data: { videoThumbnail: thumbnailUrl },
      })

      processed++
      console.log(`  ✅ Success!\n`)
    } catch (error) {
      failed++
      console.error(`  ❌ Failed: ${error}\n`)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`  Total videos: ${videoTestimonials.length}`)
  console.log(`  Processed: ${processed}`)
  console.log(`  Failed: ${failed}`)
  console.log('\n✅ Done!')
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
