// Fix R2 URLs to use custom domain
// Run with: npx tsx scripts/fix-r2-urls.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OLD_DOMAIN = 'pub-94fddea96e5ac4602783f62decbc.r2.cloudflarestorage.com'
const NEW_DOMAIN = 'cdn.nebiswera.com'

async function main() {
  console.log('🔄 Fixing R2 URLs to use custom domain...\n')
  console.log(`   Old: https://${OLD_DOMAIN}`)
  console.log(`   New: https://${NEW_DOMAIN}\n`)

  // Get all testimonials with R2 URLs
  const testimonials = await prisma.testimonial.findMany({
    where: {
      OR: [
        { profilePhoto: { contains: OLD_DOMAIN } },
        { images: { isEmpty: false } },
      ],
    },
    select: {
      id: true,
      name: true,
      profilePhoto: true,
      images: true,
    },
  })

  console.log(`📊 Found ${testimonials.length} testimonials to check\n`)

  let profilePhotosFixed = 0
  let imagesFixed = 0

  for (const testimonial of testimonials) {
    let needsUpdate = false
    const updates: any = {}

    // Fix profile photo URL
    if (testimonial.profilePhoto && testimonial.profilePhoto.includes(OLD_DOMAIN)) {
      updates.profilePhoto = testimonial.profilePhoto.replace(OLD_DOMAIN, NEW_DOMAIN)
      profilePhotosFixed++
      needsUpdate = true
    }

    // Fix image URLs
    if (testimonial.images && testimonial.images.length > 0) {
      const oldImages = testimonial.images.filter((img: string) => img.includes(OLD_DOMAIN))
      if (oldImages.length > 0) {
        updates.images = testimonial.images.map((img: string) =>
          img.replace(OLD_DOMAIN, NEW_DOMAIN)
        )
        imagesFixed += oldImages.length
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await prisma.testimonial.update({
        where: { id: testimonial.id },
        data: updates,
      })
      console.log(`✓ Fixed: ${testimonial.name}`)
    }
  }

  console.log('\n✅ URL fix complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   Profile photos fixed: ${profilePhotosFixed}`)
  console.log(`   Images fixed: ${imagesFixed}`)

  // Verify fix
  const remaining = await prisma.testimonial.count({
    where: {
      OR: [
        { profilePhoto: { contains: OLD_DOMAIN } },
        { images: { has: OLD_DOMAIN } },
      ],
    },
  })

  console.log(`\n📍 Testimonials still using old domain: ${remaining}`)
  if (remaining === 0) {
    console.log('🎉 All URLs successfully updated to custom domain!')
  }
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
