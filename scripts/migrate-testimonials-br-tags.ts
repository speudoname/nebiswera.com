#!/usr/bin/env tsx
/**
 * Migration script to replace <br> tags with line breaks in testimonials
 *
 * This script:
 * 1. Finds all testimonials with <br> tags in the text field
 * 2. Replaces <br>, <br/>, and <br /> with \n (newline)
 * 3. Updates the database
 *
 * Usage: npx tsx scripts/migrate-testimonials-br-tags.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateBrTags() {
  console.log('🔍 Finding testimonials with <br> tags...\n')

  // Find all testimonials with <br> tags
  const testimonials = await prisma.testimonial.findMany({
    where: {
      OR: [
        { text: { contains: '<br>' } },
        { text: { contains: '<br/>' } },
        { text: { contains: '<br />' } },
        { text: { contains: '<BR>' } },
        { text: { contains: '<BR/>' } },
        { text: { contains: '<BR />' } },
      ]
    },
    select: {
      id: true,
      name: true,
      text: true,
    }
  })

  console.log(`📊 Found ${testimonials.length} testimonials with <br> tags\n`)

  if (testimonials.length === 0) {
    console.log('✅ No testimonials need migration. All clean!')
    return
  }

  // Show preview of first 3
  console.log('📝 Preview of first 3 testimonials:\n')
  testimonials.slice(0, 3).forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.name}`)
    console.log(`   Before: ${t.text.substring(0, 100)}${t.text.length > 100 ? '...' : ''}`)
    const cleaned = cleanBrTags(t.text)
    console.log(`   After:  ${cleaned.substring(0, 100)}${cleaned.length > 100 ? '...' : ''}`)
    console.log('')
  })

  // Ask for confirmation
  console.log(`\n⚠️  This will update ${testimonials.length} testimonials in the database.`)
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('🚀 Starting migration...\n')

  let updated = 0
  for (const testimonial of testimonials) {
    try {
      const cleanedText = cleanBrTags(testimonial.text)

      await prisma.testimonial.update({
        where: { id: testimonial.id },
        data: { text: cleanedText }
      })

      updated++
      if (updated % 10 === 0) {
        console.log(`✓ Updated ${updated}/${testimonials.length} testimonials...`)
      }
    } catch (error) {
      console.error(`❌ Error updating testimonial ${testimonial.id}:`, error)
    }
  }

  console.log(`\n✅ Migration complete! Updated ${updated} testimonials.`)
}

function cleanBrTags(text: string): string {
  // Replace all variations of <br> with newline
  return text
    .replace(/<br\s*\/?>/gi, '\n')  // Matches <br>, <br/>, <br />
    .replace(/\n{3,}/g, '\n\n')      // Replace 3+ newlines with 2 (clean up)
}

// Run migration
migrateBrTags()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
