'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  placeholderMobile: string
  placeholderDesktop: string
  ctaButton: string
  validationError: string
  helperText: string
  disclaimer: string
  rating: string
}> = {
  ka: {
    placeholderMobile: 'შეიყვანე შენი ელ-ფოსტა',
    placeholderDesktop: 'შეიყვანე შენი ელ-ფოსტა და ჩაიტარე ნებისწერის ტესტი',
    ctaButton: 'ნახე',
    validationError: 'გთხოვთ შეიყვანოთ სწორი ელ. ფოსტის მისამართი',
    helperText: 'გაიარე პერსონალური ნებისწერის დიაგნოზირების 9 კითხვიანი ტესტი',
    disclaimer: 'მხოლოდ 3 წუთში, ზუსტად და სიღრმისეულად გაიგებ რამდენად შენს ხელშია შენი ბედი',
    rating: '4.9 ვარსკვლავი 500+ შეფასებიდან',
  },
  en: {
    placeholderMobile: 'Enter your email...',
    placeholderDesktop: 'Enter your email and take the Nebiswera test',
    ctaButton: 'Do it',
    validationError: 'Please enter a valid email address',
    helperText: 'Enter your email here and we\'ll send you some \'magic\'...',
    disclaimer: '*But it\'s 100% legal (pinky promise)',
    rating: '4.9 stars out of 500+ reviews',
  },
}

interface EmailCaptureFormProps {
  variant?: 'hero' | 'inline'
  className?: string
}

export function EmailCaptureForm({ variant = 'inline', className = '' }: EmailCaptureFormProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const t = content[locale]
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError(t.validationError)
      return
    }

    setIsSubmitting(true)

    try {
      // Save contact to database
      const response = await fetch('/api/contacts/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          source: 'home_page_test',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save contact')
      }

      // Redirect to test page with email as URL parameter
      router.push(`/${locale}/test?email=${encodeURIComponent(email)}`)
    } catch (error) {
      console.error('Error saving contact:', error)
      setError(t.validationError)
      setIsSubmitting(false)
    }
  }

  if (variant === 'hero') {
    // Hero variant - King Kong style
    return (
      <div className={className}>
        {/* Helper text above */}
        <p className="text-gray-900 text-center mb-3 text-sm md:text-base font-medium">
          {t.helperText}
        </p>

        {/* Email input form */}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-4">
          <div className="flex items-center bg-white rounded-full p-1 md:p-1.5 shadow-xl">
            <div className="flex items-center px-3 md:px-4 py-2 md:py-1 min-w-0 flex-1">
              <span className="text-lg md:text-2xl mr-2 shrink-0">👋</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder={isMobile ? t.placeholderMobile : t.placeholderDesktop}
                className="w-full bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none text-sm md:text-base min-w-0"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#C4F82A] hover:bg-[#b5e625] text-black font-bold px-4 md:px-10 py-3 md:py-4 rounded-full flex items-center justify-center gap-1.5 md:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm md:text-lg shrink-0"
            >
              <span>{t.ctaButton}</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs md:text-sm text-red-200 text-center">
              {error}
            </p>
          )}
        </form>

        {/* Disclaimer and Rating - Two separate centered lines */}
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-xs md:text-sm text-center font-medium text-gray-900">{t.disclaimer}</p>
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 fill-yellow-400"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
            <span className="text-xs md:text-sm ml-1 text-gray-900">{t.rating}</span>
          </div>
        </div>
      </div>
    )
  }

  // Inline variant - for sections throughout the page
  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 bg-neu-light rounded-neu-lg p-4 shadow-neu-md">
          <div className="flex-1 flex items-center px-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              placeholder={isMobile ? t.placeholderMobile : t.placeholderDesktop}
              className="flex-1 bg-neu-base rounded-neu-md px-4 py-3 shadow-neu-inset text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-neu-md shadow-neu flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {t.ctaButton}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 text-center">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
