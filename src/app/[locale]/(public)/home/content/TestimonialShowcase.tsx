import { getRandomTestimonials } from '@/lib/testimonials'
import { TestimonialShowcaseClient } from './TestimonialShowcaseClient'

type TestimonialType = 'TEXT' | 'AUDIO' | 'VIDEO'

interface TestimonialShowcaseProps {
  count?: number
  type?: TestimonialType
  title?: string
  subtitle?: string
  darkBackground?: boolean
}

export async function TestimonialShowcase({
  count = 3,
  type,
  title,
  subtitle,
  darkBackground = false,
}: TestimonialShowcaseProps) {
  const testimonials = await getRandomTestimonials(count, type)

  if (testimonials.length === 0) {
    return null
  }

  return (
    <TestimonialShowcaseClient
      testimonials={testimonials}
      title={title}
      subtitle={subtitle}
      darkBackground={darkBackground}
    />
  )
}
