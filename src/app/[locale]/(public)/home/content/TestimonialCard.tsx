'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Star } from 'lucide-react'
import { getInitials, type TestimonialData } from '@/lib/testimonials'
import type { Locale } from '@/i18n/config'

const translations: Record<Locale, { readMore: string, showLess: string }> = {
  ka: { readMore: 'მეტის ნახვა', showLess: 'ნაკლების ნახვა' },
  en: { readMore: 'Read more', showLess: 'Show less' },
}

export function TestimonialCard({ testimonial }: { testimonial: TestimonialData }) {
  const { name, text, rating, profilePhoto, videoUrl, audioUrl, images, type } = testimonial
  const [isExpanded, setIsExpanded] = useState(false)
  const locale = useLocale() as Locale
  const t = translations[locale]

  // Check if text is long (more than ~200 characters)
  const isLongText = text.length > 200
  const displayText = isExpanded || !isLongText ? text : text.slice(0, 200) + '...'

  return (
    <div className="bg-neu-base rounded-neu-lg p-6 md:p-8 shadow-neu flex flex-col h-full">
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
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{name}</h3>
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

      {/* Text content with height constraint */}
      <div className="mb-4">
        <p className={`text-text-secondary text-sm md:text-base leading-relaxed ${!isExpanded && isLongText ? 'line-clamp-4' : ''}`}>
          "{displayText}"
        </p>
        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary-600 text-sm font-medium mt-2 hover:text-primary-700 transition-colors"
          >
            {isExpanded ? t.showLess : t.readMore}
          </button>
        )}
      </div>

      {/* Additional images (first 3) */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-auto">
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
        <div className="mt-4">
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
            {type === 'VIDEO' ? '📹 Video' : '🎤 Audio'}
          </span>
        </div>
      )}
    </div>
  )
}
