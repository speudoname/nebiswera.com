/**
 * Migration Script: Move Testimonial Images from R2 to Bunny CDN
 *
 * This script:
 * 1. Fetches all testimonials from the database
 * 2. Downloads images from R2
 * 3. Uploads them to Bunny Storage
 * 4. Updates database with new Bunny URLs
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

const prisma = new PrismaClient()

// R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Bunny Configuration
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME!
const BUNNY_STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD!
const BUNNY_STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME!
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL!

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function downloadFromR2(url: string): Promise<Buffer> {
  // Extract key from R2 URL
  // Example URL: https://cdn.nebiswera.com/testimonials/images/xyz.jpg
  const key = url.replace('https://cdn.nebiswera.com/', '')

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })

  const response = await r2Client.send(command)
  const stream = response.Body as Readable
  return await streamToBuffer(stream)
}

async function uploadToBunny(buffer: Buffer, path: string): Promise<string> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE}/${cleanPath}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
      'Content-Type': getContentType(cleanPath),
    },
    body: buffer,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to upload to Bunny: ${error}`)
  }

  return `${BUNNY_CDN_URL}/${cleanPath}`
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  return types[ext || ''] || 'image/jpeg'
}

function extractFilename(url: string): string {
  return url.split('/').pop() || 'unknown'
}

async function migrateTestimonialImages() {
  console.log('🚀 Starting migration of testimonial images from R2 to Bunny CDN...\n')

  // Fetch all testimonials
  const testimonials = await prisma.testimonial.findMany({
    select: {
      id: true,
      profilePhoto: true,
      images: true,
      name: true,
    },
  })

  console.log(`Found ${testimonials.length} testimonials to process\n`)

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const testimonial of testimonials) {
    console.log(`Processing testimonial: ${testimonial.name} (${testimonial.id})`)

    try {
      const updates: any = {}

      // Migrate profile photo
      if (testimonial.profilePhoto && testimonial.profilePhoto.includes('cdn.nebiswera.com')) {
        console.log(`  Migrating profile photo...`)
        const buffer = await downloadFromR2(testimonial.profilePhoto)
        const filename = extractFilename(testimonial.profilePhoto)
        const newUrl = await uploadToBunny(buffer, `testimonials/profile-photos/${filename}`)
        updates.profilePhoto = newUrl
        console.log(`  ✅ Profile photo migrated`)
      }

      // Migrate images array
      if (testimonial.images && testimonial.images.length > 0) {
        const newImageUrls: string[] = []

        for (let i = 0; i < testimonial.images.length; i++) {
          const imageUrl = testimonial.images[i]

          if (imageUrl.includes('cdn.nebiswera.com')) {
            console.log(`  Migrating image ${i + 1}/${testimonial.images.length}...`)
            const buffer = await downloadFromR2(imageUrl)
            const filename = extractFilename(imageUrl)
            const newUrl = await uploadToBunny(buffer, `testimonials/images/${filename}`)
            newImageUrls.push(newUrl)
            console.log(`  ✅ Image ${i + 1} migrated`)
          } else {
            // Keep existing URL if not from R2
            newImageUrls.push(imageUrl)
          }
        }

        if (newImageUrls.length > 0) {
          updates.images = newImageUrls
        }
      }

      // Update database if any changes
      if (Object.keys(updates).length > 0) {
        await prisma.testimonial.update({
          where: { id: testimonial.id },
          data: updates,
        })
        migrated++
        console.log(`✅ Testimonial migrated successfully\n`)
      } else {
        skipped++
        console.log(`⏭️  No R2 images to migrate\n`)
      }
    } catch (error: any) {
      errors++
      console.error(`❌ Error migrating testimonial ${testimonial.id}:`, error.message)
      console.error(`\n`)
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`  Total testimonials: ${testimonials.length}`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Errors: ${errors}`)
  console.log('\n✨ Migration complete!')
}

// Run migration
migrateTestimonialImages()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
