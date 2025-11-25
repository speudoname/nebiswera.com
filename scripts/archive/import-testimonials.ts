// Import script for Shapo testimonials
// Run with: npx tsx scripts/import-testimonials.ts

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  const dataPath = path.join(process.cwd(), 'testimonials-data', 'testimonials-cleaned.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

  console.log(`Importing ${data.testimonials.length} testimonials...`)

  let imported = 0
  let skipped = 0

  for (const t of data.testimonials) {
    try {
      // Determine type based on media
      let type: 'TEXT' | 'AUDIO' | 'VIDEO' = 'TEXT'
      if (t.videos && t.videos.length > 0) type = 'VIDEO'
      // Note: Original data doesn't have audio, so all are either TEXT or VIDEO

      // Determine locale (most are Georgian, 2 are English)
      const locale = t.text && /[a-zA-Z]/.test(t.text) && t.text.split(' ').filter((w: string) => /^[a-zA-Z]+$/.test(w)).length > 10 ? 'en' : 'ka'

      await prisma.testimonial.create({
        data: {
          id: t.id,
          name: t.name,
          text: t.text || '',
          rating: t.rating || 5,
          submittedAt: new Date(t.date),
          locale,
          profilePhoto: t.profile_photo,
          images: t.images || [],
          videoUrl: t.videos && t.videos.length > 0 ? `https://stream.mux.com/${t.videos[0].playbackId}.m3u8` : null,
          status: 'APPROVED', // All imported testimonials are pre-approved
          type,
          source: 'shapo_import',
        },
      })

      imported++
      console.log(`✓ Imported: ${t.name}`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log(`⊘ Skipped (duplicate): ${t.name}`)
        skipped++
      } else {
        console.error(`✗ Error importing ${t.name}:`, error.message)
      }
    }
  }

  console.log(`\n✅ Import complete!`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${data.testimonials.length}`)
}

main()
  .catch((e) => {
    console.error('Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
