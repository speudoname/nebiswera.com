import { getRandomTestimonials, getInitials, type TestimonialData } from '@/lib/testimonials'
import type { TestimonialType } from '@prisma/client'
import { Star } from 'lucide-react'

interface TestimonialShowcaseProps {
  count?: number
  type?: TestimonialType
  title?: string
  subtitle?: string
}

export async function TestimonialShowcase({
  count = 3,
  type,
  title,
  subtitle,
}: TestimonialShowcaseProps) {
  const testimonials = await getRandomTestimonials(count, type)

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
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

function TestimonialCard({ testimonial }: { testimonial: TestimonialData }) {
  const { name, text, rating, profilePhoto, videoUrl, audioUrl, images, type } = testimonial

  return (
    <div className="bg-neu-base rounded-neu-lg p-6 md:p-8 shadow-neu flex flex-col">
      {/* Header with avatar and name */}
      <div className="flex items-center gap-4 mb-4">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt={name}
            className="w-14 h-14 rounded-full object-cover shadow-neu-sm"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
            <span className="text-primary-600 font-semibold text-lg">
              {getInitials(name)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">{name}</h3>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? 'text-primary-600 fill-primary-600'
                    : 'text-neu-dark fill-neu-dark'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Video player if available */}
      {videoUrl && (
        <div className="mb-4 rounded-neu overflow-hidden shadow-neu-inset aspect-video">
          <video
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
          </video>
        </div>
      )}

      {/* Audio player if available and no video */}
      {!videoUrl && audioUrl && (
        <div className="mb-4 rounded-neu p-4 shadow-neu-inset bg-neu-light">
          <audio controls className="w-full" preload="metadata">
            <source src={audioUrl} type="audio/mpeg" />
            <source src={audioUrl} type="audio/wav" />
          </audio>
        </div>
      )}

      {/* Text content */}
      <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-4 flex-1">
        "{text}"
      </p>

      {/* Additional images (first 3) */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {images.slice(0, 3).map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${name} - image ${index + 1}`}
              className="rounded-neu-sm shadow-neu-sm aspect-square object-cover"
            />
          ))}
        </div>
      )}

      {/* Type badge */}
      {type !== 'TEXT' && (
        <div className="mt-4 inline-block">
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            {type === 'VIDEO' ? '📹 Video' : '🎤 Audio'}
          </span>
        </div>
      )}
    </div>
  )
}
