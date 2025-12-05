'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowRight, Mail } from 'lucide-react'
import { isValidEmail } from '@/lib'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  placeholderMobile: string
  placeholderDesktop: string
  ctaButton: string
  validationError: string
  requiredError: string
  helperText: string
  disclaimer: string
  rating: string
}> = {
  ka: {
    placeholderMobile: 'შეიყვანე შენი ელ-ფოსტა',
    placeholderDesktop: 'შეიყვანე ელ-ფოსტა და გამოგიგზავნით',
    ctaButton: 'ნახე',
    validationError: 'გთხოვთ შეიყვანოთ სწორი ელ. ფოსტის მისამართი',
    requiredError: 'შეავსე ეს ველი',
    helperText: 'შეავსე ტესტი - შენი ნებისწერის ტიპი',
    disclaimer: 'მხოლოდ 3 წუთში, ზუსტად და სიღრმისეულად გაიგებ რამდენად შენს ხელშია შენი ბედი',
    rating: '4.9 ვარსკვლავი 500+ შეფასებიდან',
  },
  en: {
    placeholderMobile: 'Enter your email',
    placeholderDesktop: 'Enter your email and we will send you',
    ctaButton: 'Go',
    validationError: 'Please enter a valid email address',
    requiredError: 'Please fill out this field',
    helperText: 'nebiswera personality type test',
    disclaimer: 'In just 3 minutes, accurately understand how much your destiny is in your hands',
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
  const emailInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const validateEmail = (email: string) => {
    return isValidEmail(email)
  }

  const handleInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    // Don't prevent default - let the browser show the validation UI
    const input = e.currentTarget
    if (input.validity.valueMissing) {
      input.setCustomValidity(t.requiredError)
    } else if (input.validity.typeMismatch) {
      input.setCustomValidity(t.validationError)
    }
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    input.setCustomValidity('')
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

      // Redirect to quiz page with email as URL parameter
      router.push(`/${locale}/nebisweraquiz?email=${encodeURIComponent(email)}`)
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
        {/* Email input form */}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-4">
          <div className={`flex items-center gap-2 md:gap-3 bg-white/95 backdrop-blur-sm rounded-2xl p-2 md:p-3 transition-all duration-300 ${isSubmitting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} style={{ boxShadow: '0 8px 32px rgba(107, 45, 92, 0.1)' }}>
            <div className="flex items-center px-3 md:px-6 py-2.5 md:py-3 min-w-0 flex-1 rounded-xl" style={{ boxShadow: 'inset 3px 3px 6px rgba(0, 0, 0, 0.1), inset -3px -3px 6px rgba(255, 255, 255, 0.5)', backgroundColor: '#F0EBF8' }}>
              <Mail className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 shrink-0 text-gray-500" />
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                onInput={handleInput}
                onInvalid={handleInvalid}
                placeholder={isMobile ? t.placeholderMobile : t.placeholderDesktop}
                className="w-full bg-transparent text-gray-800 placeholder:text-gray-500 focus:outline-none text-sm md:text-base min-w-0"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F27059] hover:bg-[#E04D36] text-white font-bold px-3 md:px-5 py-3 md:py-3 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm md:text-lg shrink-0"
              style={{ boxShadow: '0 4px 14px rgba(242, 112, 89, 0.3)' }}
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

        {/* Disclaimer */}
        <p className="text-xs md:text-sm text-center font-medium text-gray-900">{t.disclaimer}</p>
      </div>
    )
  }

  // Inline variant - for sections throughout the page
  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 bg-neu-light rounded-neu-lg p-4" style={{ boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.3)' }}>
          <div className="flex-1 flex items-center px-2">
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              onInput={handleInput}
              onInvalid={handleInvalid}
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
