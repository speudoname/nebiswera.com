import { prisma } from '@/lib/db'

export type TestimonialType = 'TEXT' | 'AUDIO' | 'VIDEO'

export interface TestimonialData {
  id: string
  name: string
  text: string
  rating: number
  profilePhoto: string | null
  videoUrl: string | null
  hlsUrl: string | null
  videoThumbnail: string | null
  audioUrl: string | null
  images: string[]
  type: TestimonialType
  locale: string
  submittedAt: Date
}

/**
 * Fetches random approved testimonials from the database
 * @param count Number of testimonials to fetch
 * @param type Optional filter by testimonial type (TEXT, VIDEO, AUDIO)
 * @returns Array of approved testimonials
 */
export async function getRandomTestimonials(
  count: number,
  type?: TestimonialType
): Promise<TestimonialData[]> {
  const where: any = { status: 'APPROVED' }
  if (type) {
    where.type = type
  }

  // Get total count for random skip
  const total = await prisma.testimonial.count({ where })

  if (total === 0) {
    return []
  }

  // Calculate random skip offset (ensure we can get `count` items)
  const maxSkip = Math.max(0, total - count)
  const skip = maxSkip > 0 ? Math.floor(Math.random() * maxSkip) : 0

  const testimonials = await prisma.testimonial.findMany({
    where,
    take: count,
    skip,
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      name: true,
      text: true,
      rating: true,
      profilePhoto: true,
      videoUrl: true,
      hlsUrl: true,
      videoThumbnail: true,
      audioUrl: true,
      images: true,
      type: true,
      locale: true,
      submittedAt: true,
    },
  })

  return testimonials
}

/**
 * Gets the initials from a name for avatar fallback
 * @param name Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
