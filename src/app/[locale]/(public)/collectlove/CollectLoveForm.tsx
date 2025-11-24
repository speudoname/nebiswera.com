'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Mic, Video, Upload, Star, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function CollectLoveForm() {
  const router = useRouter()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    text: '',
    rating: 5,
  })

  const t = {
    ka: {
      title: 'გააზიარე შენი გამოცდილება',
      subtitle: 'გქონდა გამოცდილება ნებისწერასთან? გვიზიარე შენი აზრი',
      nameLabel: 'სახელი',
      namePlaceholder: 'შენი სახელი',
      emailLabel: 'ელ-ფოსტა',
      emailPlaceholder: 'email@example.com',
      textLabel: 'შენი გამოცდილება',
      textPlaceholder: 'გვიზიარე რა გამოცდილება გქონდა ნებისწერასთან, როგორ შეცვალა შენი ცხოვრება...',
      ratingLabel: 'შეფასება',
      submitBtn: 'გაგზავნა',
      submitting: 'იგზავნება...',
      successTitle: 'მადლობა!',
      successMessage: 'შენი გამოცდილება მიღებულია. დაუმტკიცდება ადმინისტრატორს და მალე გამოჩნდება.',
      backBtn: 'უკან დაბრუნება',
      audioNote: '(აუდიო ჩაწერა - მალე)',
      videoNote: '(ვიდეო ჩაწერა - მალე)',
    },
    en: {
      title: 'Share Your Experience',
      subtitle: 'Had an experience with Nebiswera? Share your thoughts',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'email@example.com',
      textLabel: 'Your Experience',
      textPlaceholder: 'Share your experience with Nebiswera, how it changed your life...',
      ratingLabel: 'Rating',
      submitBtn: 'Submit',
      submitting: 'Submitting...',
      successTitle: 'Thank You!',
      successMessage: 'Your testimonial has been received. It will be reviewed by an administrator and published soon.',
      backBtn: 'Go Back',
      audioNote: '(Audio recording - coming soon)',
      videoNote: '(Video recording - coming soon)',
    },
  }[locale as 'ka' | 'en']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.text) {
      alert(locale === 'ka' ? 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი' : 'Please fill all required fields')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          locale,
          type: 'TEXT',
        }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        alert(locale === 'ka' ? 'შეცდომა. გთხოვთ სცადოთ ხელახლა' : 'Error. Please try again')
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      alert(locale === 'ka' ? 'შეცდომა. გთხოვთ სცადოთ ხელახლა' : 'Error. Please try again')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center px-4">
        <Card variant="raised" padding="lg" className="max-w-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-4">{t.successTitle}</h2>
          <p className="text-text-secondary mb-8">{t.successMessage}</p>
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/love`)}
          >
            {t.backBtn}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neu-base py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">{t.title}</h1>
          <p className="text-lg text-text-secondary">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card variant="raised" padding="lg">
            <div className="space-y-6">
              {/* Name */}
              <Input
                label={t.nameLabel}
                placeholder={t.namePlaceholder}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              {/* Email */}
              <Input
                label={t.emailLabel}
                type="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              {/* Testimonial Text */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.textLabel} *
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder={t.textPlaceholder}
                  rows={6}
                  maxLength={500}
                  required
                  className="w-full px-4 py-3 rounded-neu bg-neu-base shadow-neu-inset text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {formData.text.length}/500
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t.ratingLabel}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: r })}
                      className="p-2 rounded-full hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          r <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-neu-dark'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Options (Coming Soon) */}
              <div className="pt-4 border-t border-neu-dark">
                <p className="text-sm font-medium text-text-primary mb-4">
                  {locale === 'ka' ? 'სხვა ფორმატები' : 'Other Formats'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 px-4 py-3 rounded-neu bg-neu-base shadow-neu text-text-secondary opacity-50 cursor-not-allowed"
                  >
                    <Mic className="w-5 h-5" />
                    {t.audioNote}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 px-4 py-3 rounded-neu bg-neu-base shadow-neu text-text-secondary opacity-50 cursor-not-allowed"
                  >
                    <Video className="w-5 h-5" />
                    {t.videoNote}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  loadingText={t.submitting}
                  leftIcon={Send}
                  className="w-full"
                >
                  {t.submitBtn}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
