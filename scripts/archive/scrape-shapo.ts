// Scrape testimonials from Shapo.io Wall of Love
// Run with: npx tsx scripts/scrape-shapo.ts

import fs from 'fs'
import path from 'path'

const SHAPO_URL = 'https://shapo.io/wall-of-love/c5cf604cf7'

// AI course testimonial identification keywords
const AI_KEYWORDS = [
  'AI კურსი',
  'AI-ის',
  'ხელოვნური ინტელექტი',
  'AI აკადემია',
  'CHAT-GPT',
  'AI-ს შესახებ',
]

// AI course email addresses to exclude
const AI_COURSE_EMAILS = [
  'ekaterina.shavgulidze@gmail.com',
  'tjokhadze@gmail.com',
  'maka.shavgulidze@gmail.com',
  'n_gordeladze@yahoo.com',
  'ekasamadashvili@yahoo.com',
  'nina.natsvlishvili@yahoo.com',
  'marakoni78@gmail.com',
  'teo.makalatia@gmail.com',
  'lasha@sarke.ge',
]

function isAICourseTestimonial(testimonial: any): boolean {
  // Check if email matches AI course emails (except manjgalashvili which might be Nebiswera)
  if (testimonial.email && AI_COURSE_EMAILS.includes(testimonial.email.toLowerCase())) {
    return true
  }

  // Check if text contains AI course keywords
  // Shapo uses 'message' field, older exports use 'text'
  const text = (testimonial.message || testimonial.text || '').toLowerCase()
  return AI_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()))
}

async function main() {
  console.log('🔍 Scraping Shapo.io Wall of Love...')
  console.log(`   URL: ${SHAPO_URL}\n`)

  try {
    // Fetch the page
    const response = await fetch(SHAPO_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Parse testimonials from HTML
    // Note: This is a simplified parser. Shapo.io likely embeds data in JSON-LD or as inline JS
    console.log('📄 Parsing HTML...')

    // Look for Next.js data in the page
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)
    if (!nextDataMatch) {
      console.error('❌ Could not find Next.js data in page')
      console.log('\n💡 The page structure may have changed.')
      console.log('   You may need to:')
      console.log('   1. Inspect the page source manually')
      console.log('   2. Look for API endpoints (Network tab in DevTools)')
      console.log('   3. Use Puppeteer/Playwright for dynamic content')
      console.log('   4. Contact Shapo.io for API access')
      process.exit(1)
    }

    const nextData = JSON.parse(nextDataMatch[1])
    console.log('✓ Found Next.js data')

    // Extract testimonials from the data structure
    // This is highly dependent on Shapo's page structure
    let testimonials: any[] = []

    // Try to find testimonials in the page props
    const pageProps = nextData?.props?.pageProps
    if (pageProps) {
      // Common locations for testimonials data
      testimonials =
        pageProps.testimonials ||
        pageProps.wall?.testimonials ||
        pageProps.data?.testimonials ||
        pageProps.initialData?.testimonials ||
        []
    }

    console.log(`✓ Found ${testimonials.length} testimonials\n`)

    if (testimonials.length === 0) {
      console.error('❌ No testimonials found in page data')
      console.log('\n💡 The data structure may have changed. Dumping page props:')
      console.log(JSON.stringify(pageProps, null, 2).substring(0, 500))
      process.exit(1)
    }

    // Filter out AI course testimonials
    console.log('🔍 Filtering out AI course testimonials...')
    const aiTestimonials: any[] = []
    const nebisweraTestimonials: any[] = []

    testimonials.forEach((t) => {
      if (isAICourseTestimonial(t)) {
        aiTestimonials.push(t)
      } else {
        nebisweraTestimonials.push(t)
      }
    })

    console.log(`   AI course: ${aiTestimonials.length}`)
    console.log(`   Nebiswera: ${nebisweraTestimonials.length}\n`)

    // Save results
    const outputDir = path.join(process.cwd(), 'testimonials-data')
    const timestamp = new Date().toISOString().split('T')[0]

    // Save all testimonials
    const allData = {
      metadata: {
        total_count: testimonials.length,
        scraped_date: timestamp,
        source: SHAPO_URL,
      },
      testimonials,
    }
    fs.writeFileSync(
      path.join(outputDir, 'shapo-all-testimonials.json'),
      JSON.stringify(allData, null, 2)
    )
    console.log('✓ Saved all testimonials to shapo-all-testimonials.json')

    // Save Nebiswera testimonials only
    const nebisweraData = {
      metadata: {
        total_count: nebisweraTestimonials.length,
        scraped_date: timestamp,
        source: SHAPO_URL,
        notes: 'Nebiswera participant testimonials only (AI course testimonials filtered out)',
      },
      testimonials: nebisweraTestimonials,
    }
    fs.writeFileSync(
      path.join(outputDir, 'shapo-nebiswera-testimonials.json'),
      JSON.stringify(nebisweraData, null, 2)
    )
    console.log('✓ Saved Nebiswera testimonials to shapo-nebiswera-testimonials.json')

    // Save AI course testimonials for reference
    const aiData = {
      metadata: {
        total_count: aiTestimonials.length,
        scraped_date: timestamp,
        source: SHAPO_URL,
        notes: 'AI course testimonials (excluded from Nebiswera database)',
      },
      testimonials: aiTestimonials,
    }
    fs.writeFileSync(
      path.join(outputDir, 'shapo-ai-course-testimonials.json'),
      JSON.stringify(aiData, null, 2)
    )
    console.log('✓ Saved AI course testimonials to shapo-ai-course-testimonials.json')

    console.log('\n✅ Scraping complete!')
    console.log(`\n📊 Summary:`)
    console.log(`   Total scraped: ${testimonials.length}`)
    console.log(`   Nebiswera: ${nebisweraTestimonials.length}`)
    console.log(`   AI course: ${aiTestimonials.length}`)
  } catch (error: any) {
    console.error('❌ Scraping failed:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check if the URL is still accessible')
    console.log('   2. Verify network connectivity')
    console.log('   3. The page structure may have changed - may need manual inspection')
    process.exit(1)
  }
}

main()
