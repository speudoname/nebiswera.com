'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Star, Play } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

type Testimonial = {
  id: string
  name: string
  role: string | null
  company: string | null
  text: string
  rating: number
  type: 'TEXT' | 'AUDIO' | 'VIDEO'
  locale: string
  profilePhoto: string | null
  images: string[]
  videoUrl: string | null
  submittedAt: string
}

export function LoveWallClient() {
  const t = useTranslations('common')
  const locale = useLocale()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'TEXT' | 'AUDIO' | 'VIDEO'>('ALL')

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    try {
      const res = await fetch('/api/testimonials?limit=100')
      const data = await res.json()
      setTestimonials(data.testimonials || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      setTestimonials([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'ALL'
    ? testimonials
    : testimonials.filter(t => t.type === filter)

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-base py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-text-secondary">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neu-base py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            {locale === 'ka' ? 'რას ამბობენ ჩვენზე' : 'What They Say About Us'}
          </h1>
          <p className="text-lg text-text-secondary mb-8">
            {locale === 'ka'
              ? 'ნებისწერის მონაწილეთა გამოცდილება და გაზიარებული მოსაზრებები'
              : 'Experiences and shared thoughts from Nebiswera participants'}
          </p>

          <div className="flex justify-center">
            <Link href={`/${locale}/collectlove`}>
              <button className="px-6 py-3 bg-primary-500 text-white rounded-neu shadow-neu hover:shadow-neu-hover font-medium">
                {locale === 'ka' ? 'გააზიარე შენი გამოცდილება' : 'Share Your Experience'}
              </button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {(['ALL', 'TEXT', 'VIDEO'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-neu font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white shadow-neu-pressed'
                  : 'bg-neu-base text-text-secondary shadow-neu hover:shadow-neu-hover'
              }`}
            >
              {f === 'ALL' ? (locale === 'ka' ? 'ყველა' : 'All') :
               f === 'TEXT' ? (locale === 'ka' ? 'ტექსტი' : 'Text') :
               locale === 'ka' ? 'ვიდეო' : 'Video'}
            </button>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((testimonial) => (
            <Card key={testimonial.id} variant="raised" padding="lg" className="flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                {/* Profile Photo */}
                {testimonial.profilePhoto ? (
                  <img
                    src={testimonial.profilePhoto}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover shadow-neu"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 shadow-neu flex items-center justify-center text-primary-600 font-semibold">
                    {getInitials(testimonial.name)}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{testimonial.name}</h3>
                  {testimonial.role && (
                    <p className="text-sm text-text-secondary">
                      {testimonial.role}
                      {testimonial.company && `, ${testimonial.company}`}
                    </p>
                  )}
                  {/* Rating */}
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>

                {/* Type Badge */}
                {testimonial.type !== 'TEXT' && (
                  <Badge variant="default" size="sm">{testimonial.type}</Badge>
                )}
              </div>

              {/* Text */}
              <p className="text-text-secondary text-sm leading-relaxed mb-4 flex-1">
                {testimonial.text}
              </p>

              {/* Video Preview */}
              {testimonial.videoUrl && (
                <div className="mt-4 relative rounded-neu overflow-hidden bg-neu-dark/20 aspect-video flex items-center justify-center cursor-pointer group">
                  <Play className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
                </div>
              )}

              {/* Additional Images */}
              {testimonial.images.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {testimonial.images.slice(0, 3).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-16 h-16 object-cover rounded-neu shadow-neu"
                    />
                  ))}
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-text-secondary mt-4">
                {new Date(testimonial.submittedAt).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB')}
              </p>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            {locale === 'ka' ? 'მოწმობები არ მოიძებნა' : 'No testimonials found'}
          </div>
        )}
      </div>
    </div>
  )
}
