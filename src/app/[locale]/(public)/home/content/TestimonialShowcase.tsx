import { getRandomTestimonials } from '@/lib/testimonials'
import type { TestimonialType } from '@prisma/client'
import { TestimonialCard } from './TestimonialCard'

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

  const bgClass = darkBackground
    ? 'bg-gradient-to-b from-neu-base to-neu-light'
    : 'bg-gradient-to-b from-neu-light to-neu-base'

  return (
    <section className={`py-16 md:py-20 px-4 sm:px-6 md:px-8 ${bgClass}`}>
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {title && (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-text-secondary">{subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid gap-6 md:gap-8 ${
          testimonials.length === 1 ? 'max-w-2xl mx-auto' :
          testimonials.length === 2 ? 'md:grid-cols-2' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
