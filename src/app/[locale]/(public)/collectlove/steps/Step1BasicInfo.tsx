'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Star, Upload, X, Image as ImageIcon } from 'lucide-react'
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
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = name.trim().length >= 2 &&
                  email.includes('@') &&
                  text.trim().length >= 10 &&
                  text.trim().length <= 500 &&
                  rating > 0

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    const remainingSlots = 3 - images.length
    const newImages = imageFiles.slice(0, remainingSlots)

    if (newImages.length > 0) {
      setImages([...images, ...newImages])

      newImages.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Create testimonial first
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
      const testimonialId = data.testimonial.id

      // Upload images if any
      if (images.length > 0) {
        const { uploadFileToR2 } = await import('@/lib/storage/upload-helpers')
        const imageUrls: string[] = []

        for (const image of images) {
          const url = await uploadFileToR2(image, 'image')
          imageUrls.push(url)
        }

        // Update testimonial with image URLs
        const updateRes = await fetch(`/api/testimonials/${testimonialId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imageUrls }),
        })

        if (!updateRes.ok) throw new Error('Failed to save images')
      }

      onComplete({
        name: name.trim(),
        email: email.trim(),
        text: text.trim(),
        rating,
        testimonialId,
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

        {/* Optional images section */}
        <div className="pt-4 border-t border-neu-dark">
          <div className="text-center mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('step4.title')}
            </label>
            <p className="text-xs text-text-secondary">
              {t('step4.description')}
            </p>
          </div>

          {/* Upload area */}
          {images.length < 3 && (
            <label className="block mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-neu-dark rounded-neu-lg p-8 text-center cursor-pointer hover:bg-neu-light transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-text-primary font-medium mb-1">
                  {t('step4.uploadLabel')}
                </p>
                <p className="text-xs text-text-secondary">
                  {t('step4.uploadHint', { count: 3 - images.length })}
                </p>
              </div>
            </label>
          )}

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-neu overflow-hidden shadow-neu group"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-neu-sm hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
