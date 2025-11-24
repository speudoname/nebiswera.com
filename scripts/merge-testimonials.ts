// Merge scraped Nebiswera testimonials with database
// Run with: npx tsx scripts/merge-testimonials.ts

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

type ScrapedTestimonial = {
  _id: string
  name: string
  title?: string
  link?: string
  profileImage?: string
  rating: number
  source: string
  date: string
  message: string
  images?: string[]
  videos?: Array<{ playbackId: string }> // Old format (array)
  video?: { playbackId: string } // New format (singular object)
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

function calculateSimilarity(text1: string, text2: string): number {
  const norm1 = normalizeText(text1)
  const norm2 = normalizeText(text2)

  // Exact match
  if (norm1 === norm2) return 1.0

  // Check if one contains the other (for truncated texts)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9

  // Compare first 100 characters
  const sub1 = norm1.substring(0, 100)
  const sub2 = norm2.substring(0, 100)
  if (sub1 === sub2) return 0.8

  return 0.0
}

async function main() {
  console.log('🔄 Merging Nebiswera testimonials with database...\n')

  // Load scraped data
  const dataPath = path.join(
    process.cwd(),
    'testimonials-data',
    'shapo-nebiswera-testimonials.json'
  )

  if (!fs.existsSync(dataPath)) {
    console.error('❌ Scraped data not found!')
    console.log('   Please run: npx tsx scripts/scrape-shapo.ts')
    process.exit(1)
  }

  const scrapedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const scraped: ScrapedTestimonial[] = scrapedData.testimonials

  console.log(`📊 Loaded ${scraped.length} Nebiswera testimonials from Shapo.io`)

  // Get existing testimonials from database
  const existing = await prisma.testimonial.findMany({
    select: {
      id: true,
      name: true,
      text: true,
      tags: true,
      status: true,
      submittedAt: true,
    },
  })

  console.log(`📊 Found ${existing.length} testimonials in database\n`)

  let updated = 0
  let inserted = 0
  let skipped = 0

  for (const item of scraped) {
    try {
      // Determine type based on media
      let type: 'TEXT' | 'AUDIO' | 'VIDEO' = 'TEXT'
      const hasVideo = (item.videos && item.videos.length > 0) || item.video
      if (hasVideo) type = 'VIDEO'

      // Determine locale (most are Georgian)
      const message = item.message || ''
      const locale =
        message && /[a-zA-Z]/.test(message) && message.split(' ').filter((w: string) => /^[a-zA-Z]+$/.test(w)).length > 10
          ? 'en'
          : 'ka'

      // Try to find existing testimonial by name + text similarity
      const match = existing.find((e) => {
        const nameMatch = normalizeText(e.name) === normalizeText(item.name)
        const textSimilarity = calculateSimilarity(e.text, message)
        return nameMatch && textSimilarity > 0.7
      })

      // Handle both old format (videos array) and new format (video object)
      let videoUrl: string | null = null
      if (item.videos && item.videos.length > 0) {
        videoUrl = `https://stream.mux.com/${item.videos[0].playbackId}.m3u8`
      } else if (item.video && item.video.playbackId) {
        videoUrl = `https://stream.mux.com/${item.video.playbackId}.m3u8`
      }

      if (match) {
        // Update existing testimonial
        await prisma.testimonial.update({
          where: { id: match.id },
          data: {
            name: item.name, // Update name in case of spelling corrections
            text: message,
            rating: item.rating || 5,
            locale,
            profilePhoto: item.profileImage || null,
            images: item.images || [],
            videoUrl,
            type,
            // Preserve existing tags and status
          },
        })
        updated++
        console.log(`✓ Updated: ${item.name}`)
      } else {
        // Insert new testimonial
        await prisma.testimonial.create({
          data: {
            id: item._id,
            name: item.name,
            text: message,
            rating: item.rating || 5,
            submittedAt: new Date(item.date),
            locale,
            profilePhoto: item.profileImage || null,
            images: item.images || [],
            videoUrl,
            status: 'APPROVED', // All scraped testimonials are pre-approved
            type,
            source: 'shapo_import',
            tags: ['nebiswera-participant', 'shapo-import'], // Default tags
          },
        })
        inserted++
        console.log(`+ Inserted: ${item.name}`)
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⊘ Skipped (duplicate ID): ${item.name}`)
        skipped++
      } else {
        console.error(`✗ Error processing ${item.name}:`, error.message)
      }
    }
  }

  // Get final count
  const finalCount = await prisma.testimonial.count()

  console.log('\n✅ Merge complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Inserted: ${inserted}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total in database: ${finalCount}`)
  console.log('\n💡 Next steps:')
  console.log('   1. Review testimonials in admin panel: /admin/testimonials')
  console.log('   2. Add additional tags as needed')
  console.log('   3. Download and upload media to R2 if needed')
}

main()
  .catch((e) => {
    console.error('❌ Merge failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
