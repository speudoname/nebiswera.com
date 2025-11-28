/**
 * One-time script to transcode existing video testimonials to HLS
 * Run with: npx tsx scripts/process-existing-videos.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BASE_URL = process.env.NEXTAUTH_URL || 'https://nebiswera.ge'

async function main() {
  console.log('Finding video testimonials without HLS...')

  const testimonials = await prisma.testimonial.findMany({
    where: {
      videoUrl: { not: null },
      hlsUrl: null,
    },
    select: {
      id: true,
      name: true,
      videoUrl: true,
      videoStatus: true,
    },
  })

  console.log(`Found ${testimonials.length} video testimonials to process`)

  for (const t of testimonials) {
    console.log(`\nProcessing: ${t.name} (${t.id})`)
    console.log(`  Video URL: ${t.videoUrl}`)

    try {
      const response = await fetch(`${BASE_URL}/api/testimonials/${t.id}/process`, {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        console.log(`  ✓ Transcoding started. Job ID: ${result.transcodingJobId}`)
      } else {
        console.log(`  ✗ Failed: ${result.error}`)
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error}`)
    }

    // Wait 2 seconds between requests to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n\nDone! MediaConvert jobs are processing.')
  console.log('Videos will be available with HLS once processing completes (usually 2-5 minutes).')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
