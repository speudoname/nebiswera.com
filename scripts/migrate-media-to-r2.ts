// Migrate all media from Shapo CDN to R2
// Run with: npx tsx scripts/migrate-media-to-r2.ts

import { PrismaClient } from '@prisma/client'
import { uploadToR2, generateTestimonialKey } from '../src/lib/r2'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.status}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error: any) {
    console.error(`Error downloading ${url}:`, error.message)
    return null
  }
}

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i)
  return match ? match[1] : 'jpg'
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
  }
  return types[ext.toLowerCase()] || 'application/octet-stream'
}

async function main() {
  console.log('🔄 Migrating media from Shapo CDN to R2...\n')

  // Get all testimonials with media
  const testimonials = await prisma.testimonial.findMany({
    select: {
      id: true,
      name: true,
      profilePhoto: true,
      images: true,
    },
  })

  console.log(`📊 Found ${testimonials.length} testimonials\n`)

  let profilePhotosProcessed = 0
  let profilePhotosUploaded = 0
  let imagesProcessed = 0
  let imagesUploaded = 0
  let errors = 0

  for (const testimonial of testimonials) {
    console.log(`\n📝 Processing: ${testimonial.name}`)

    // Migrate profile photo
    if (testimonial.profilePhoto && testimonial.profilePhoto.includes('cdn.shapo.io')) {
      profilePhotosProcessed++
      console.log(`  📸 Profile photo: ${testimonial.profilePhoto}`)

      const buffer = await downloadFile(testimonial.profilePhoto)
      if (buffer) {
        try {
          const ext = getFileExtension(testimonial.profilePhoto)
          const filename = `profile-${Date.now()}.${ext}`
          const key = generateTestimonialKey(testimonial.id, filename)
          const contentType = getContentType(ext)

          const r2Url = await uploadToR2(buffer, key, contentType)

          // Update database with new R2 URL
          await prisma.testimonial.update({
            where: { id: testimonial.id },
            data: { profilePhoto: r2Url },
          })

          profilePhotosUploaded++
          console.log(`  ✓ Uploaded to R2: ${r2Url}`)
        } catch (error: any) {
          console.error(`  ✗ Failed to upload: ${error.message}`)
          errors++
        }
      } else {
        console.log(`  ⊘ Failed to download`)
        errors++
      }
    }

    // Migrate additional images
    if (testimonial.images && testimonial.images.length > 0) {
      const shapoImages = testimonial.images.filter((img: string) =>
        img.includes('cdn.shapo.io')
      )

      if (shapoImages.length > 0) {
        console.log(`  🖼️  Additional images: ${shapoImages.length}`)
        const newImageUrls: string[] = []

        for (const imageUrl of testimonial.images) {
          if (imageUrl.includes('cdn.shapo.io')) {
            imagesProcessed++
            const buffer = await downloadFile(imageUrl)
            if (buffer) {
              try {
                const ext = getFileExtension(imageUrl)
                const filename = `image-${Date.now()}-${nanoid(6)}.${ext}`
                const key = generateTestimonialKey(testimonial.id, filename)
                const contentType = getContentType(ext)

                const r2Url = await uploadToR2(buffer, key, contentType)
                newImageUrls.push(r2Url)
                imagesUploaded++
                console.log(`  ✓ Uploaded: ${r2Url}`)
              } catch (error: any) {
                console.error(`  ✗ Failed to upload: ${error.message}`)
                errors++
                // Keep original URL if upload fails
                newImageUrls.push(imageUrl)
              }
            } else {
              console.log(`  ⊘ Failed to download: ${imageUrl}`)
              errors++
              // Keep original URL if download fails
              newImageUrls.push(imageUrl)
            }
          } else {
            // Keep non-Shapo URLs as-is
            newImageUrls.push(imageUrl)
          }
        }

        // Update database with new image URLs
        await prisma.testimonial.update({
          where: { id: testimonial.id },
          data: { images: newImageUrls },
        })
      }
    }
  }

  console.log('\n\n✅ Migration complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   Profile photos processed: ${profilePhotosProcessed}`)
  console.log(`   Profile photos uploaded: ${profilePhotosUploaded}`)
  console.log(`   Additional images processed: ${imagesProcessed}`)
  console.log(`   Additional images uploaded: ${imagesUploaded}`)
  console.log(`   Errors: ${errors}`)

  if (errors > 0) {
    console.log('\n⚠️  Some files failed to migrate. Check logs above for details.')
  }

  // Verify migration
  const remaining = await prisma.testimonial.count({
    where: {
      OR: [
        { profilePhoto: { contains: 'cdn.shapo.io' } },
        { images: { has: 'cdn.shapo.io' } },
      ],
    },
  })

  console.log(`\n📍 Testimonials still using Shapo CDN: ${remaining}`)
  if (remaining === 0) {
    console.log('🎉 All media successfully migrated to R2!')
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
