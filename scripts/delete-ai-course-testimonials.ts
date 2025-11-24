// Delete AI course testimonials
// Run with: npx tsx scripts/delete-ai-course-testimonials.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 10 AI course testimonials to remove
const aiCourseEmails = [
  'ekaterina.shavgulidze@gmail.com',
  'tjokhadze@gmail.com',
  'maka.shavgulidze@gmail.com',
  'n_gordeladze@yahoo.com',
  'manjgalashvili@gmail.com', // AI course testimonial (not Nebiswera one)
  'ekasamadashvili@yahoo.com',
  'nina.natsvlishvili@yahoo.com',
  'marakoni78@gmail.com',
  'teo.makalatia@gmail.com',
  'lasha@sarke.ge',
]

async function main() {
  console.log('🔍 Searching for AI course testimonials to delete...\n')

  // First, let's see what we're about to delete
  const testimonials = await prisma.testimonial.findMany({
    where: {
      email: { in: aiCourseEmails },
    },
    select: {
      id: true,
      name: true,
      email: true,
      text: true,
      submittedAt: true,
    },
  })

  console.log(`Found ${testimonials.length} testimonials matching AI course emails:\n`)
  testimonials.forEach((t, idx) => {
    const preview = t.text.substring(0, 80) + (t.text.length > 80 ? '...' : '')
    console.log(`${idx + 1}. ${t.name} (${t.email})`)
    console.log(`   "${preview}"`)
    console.log(`   Submitted: ${t.submittedAt.toISOString().split('T')[0]}`)
    console.log()
  })

  if (testimonials.length === 0) {
    console.log('✅ No AI course testimonials found. Database already clean!')
    return
  }

  // Special handling for manjgalashvili@gmail.com
  // We need to identify the AI course one specifically
  const manjgalashvili = testimonials.filter((t) => t.email === 'manjgalashvili@gmail.com')
  if (manjgalashvili.length > 1) {
    console.log('⚠️  Warning: Found multiple testimonials from manjgalashvili@gmail.com')
    console.log('    Need to identify which one is AI course (contains "AI" keywords)')
    console.log()
  }

  // Delete testimonials
  console.log('🗑️  Deleting AI course testimonials...\n')

  const result = await prisma.testimonial.deleteMany({
    where: {
      AND: [
        { email: { in: aiCourseEmails } },
        {
          OR: [
            { text: { contains: 'AI კურსი', mode: 'insensitive' } },
            { text: { contains: 'AI-ის', mode: 'insensitive' } },
            { text: { contains: 'ხელოვნური ინტელექტი', mode: 'insensitive' } },
            { text: { contains: 'AI აკადემია', mode: 'insensitive' } },
            { text: { contains: 'CHAT-GPT', mode: 'insensitive' } },
            // For emails that don't overlap with Nebiswera participants
            {
              email: {
                in: [
                  'ekaterina.shavgulidze@gmail.com',
                  'tjokhadze@gmail.com',
                  'maka.shavgulidze@gmail.com',
                  'n_gordeladze@yahoo.com',
                  'ekasamadashvili@yahoo.com',
                  'nina.natsvlishvili@yahoo.com',
                  'marakoni78@gmail.com',
                  'teo.makalatia@gmail.com',
                  'lasha@sarke.ge',
                ],
              },
            },
          ],
        },
      ],
    },
  })

  console.log(`✅ Deleted ${result.count} AI course testimonials`)

  // Verify remaining count
  const remaining = await prisma.testimonial.count()
  console.log(`\n📊 Remaining testimonials in database: ${remaining}`)
  console.log('   (Expected: 47 Nebiswera participant testimonials)')
}

main()
  .catch((e) => {
    console.error('❌ Deletion failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
