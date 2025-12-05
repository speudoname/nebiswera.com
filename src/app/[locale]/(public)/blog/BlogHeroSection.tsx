'use client'

import React, { useState } from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Mail, BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, defaultViewport } from '@/lib/animations'
import { isValidEmail } from '@/lib'

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  description: string
  emailPlaceholder: string
  ctaButton: string
  successMessage: string
  errorMessage: string
  validationError: string
  privacyNote: string
}> = {
  ka: {
    eyebrow: 'ნებისწერის ბლოგი',
    title: 'გინდა შექმნა შენი',
    titleAccent: 'საკუთარი რეალობა?',
    subtitle: 'ეს სტატიები დაგეხმარება ისწავლო როგორ.',
    description: 'გამოიწერე ბლოგი და არ გამოტოვო არცერთი ახალი იდეა, რომელსაც გაგიზიარებთ. ყოველი სტატია არის ნაბიჯი იმისკენ, რომ შენი ნება შენს ხელში იყოს.',
    emailPlaceholder: 'შეიყვანე შენი ელ-ფოსტა',
    ctaButton: 'გამოწერა',
    successMessage: 'გმადლობთ! გამოწერა წარმატებით დასრულდა.',
    errorMessage: 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან.',
    validationError: 'გთხოვთ შეიყვანოთ სწორი ელ. ფოსტის მისამართი',
    privacyNote: 'არასოდეს გავაზიარებთ შენს ელ-ფოსტას მესამე პირებთან',
  },
  en: {
    eyebrow: 'Nebiswera Blog',
    title: 'Want to create your',
    titleAccent: 'own reality?',
    subtitle: 'These articles will help you learn how.',
    description: 'Subscribe to the blog and never miss a new idea we share. Every article is a step towards having your will in your hands.',
    emailPlaceholder: 'Enter your email',
    ctaButton: 'Subscribe',
    successMessage: 'Thank you! Subscription successful.',
    errorMessage: 'An error occurred. Please try again.',
    validationError: 'Please enter a valid email address',
    privacyNote: 'We will never share your email with third parties',
  },
}

export function BlogHeroSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setError(t.validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contacts/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          source: 'blog_subscription',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to subscribe')
      }

      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
      setError(t.errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const HeroContent = () => (
    <div className="text-center max-w-3xl mx-auto">
      {/* Icon */}
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>

      {/* Eyebrow */}
      <span className="inline-block text-primary-600 font-semibold text-sm md:text-base mb-4 tracking-wider uppercase">
        {t.eyebrow}
      </span>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-2 leading-tight">
        {t.title}
      </h1>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-600 mb-6 leading-tight">
        {t.titleAccent}
      </h1>

      {/* Subtitle */}
      <p className="text-xl md:text-2xl text-text-secondary font-medium mb-4">
        {t.subtitle}
      </p>

      {/* Description */}
      <p className="text-base md:text-lg text-text-secondary/80 mb-8 max-w-2xl mx-auto leading-relaxed">
        {t.description}
      </p>

      {/* Subscription Form */}
      {status === 'success' ? (
        <div className="bg-green-50 border border-green-200 rounded-neu-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Sparkles className="w-5 h-5" />
            <p className="font-medium">{t.successMessage}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                  setStatus('idle')
                }}
                placeholder={t.emailPlaceholder}
                className="w-full bg-neu-base rounded-neu-md pl-12 pr-4 py-3.5 shadow-neu-inset text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3.5 rounded-neu-md shadow-neu flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {t.ctaButton}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 text-center">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs text-text-secondary/60 text-center">
            {t.privacyNote}
          </p>
        </form>
      )}
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50/30 to-neu-base relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary-500/5 blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            <HeroContent />
          </motion.div>
        ) : (
          <HeroContent />
        )}
      </div>
    </section>
  )
}
