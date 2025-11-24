'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Step1BasicInfoProps {
  onComplete: (data: {
    name: string
    email: string
    text: string
    rating: number
    testimonialId: string
  }) => void
}

export function Step1BasicInfo({ onComplete }: Step1BasicInfoProps) {
  const t = useTranslations('collectLove')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5) // Preselect 5 stars
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = name.trim().length >= 2 &&
                  email.includes('@') &&
                  text.trim().length >= 10 &&
                  text.trim().length <= 500 &&
                  rating > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          text: text.trim(),
          rating,
          locale: document.documentElement.lang || 'ka',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      const data = await res.json()

      onComplete({
        name: name.trim(),
        email: email.trim(),
        text: text.trim(),
        rating,
        testimonialId: data.testimonial.id,
      })
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('step1.title')}
        </h2>
        <p className="text-text-secondary">
          {t('step1.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t('step1.nameLabel')}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('step1.namePlaceholder')}
          required
          minLength={2}
        />

        <Input
          label={t('step1.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('step1.emailPlaceholder')}
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t('step1.reviewLabel')}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('step1.reviewPlaceholder')}
            required
            minLength={10}
            maxLength={500}
            rows={5}
            className="w-full px-4 py-3 bg-neu-base rounded-neu shadow-neu-inset text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
          />
          <div className="text-right mt-1 text-sm text-text-secondary">
            {text.length} / 500
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            {t('step1.ratingLabel')}
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-neu-dark'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-neu text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isValid}
          loading={isSubmitting}
          loadingText={t('step1.submitting')}
        >
          {t('step1.nextButton')}
        </Button>
      </form>
    </div>
  )
}
