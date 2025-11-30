'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  welcomeTitle: string
  welcomeSubtitle: string
  nameLabel: string
  namePlaceholder: string
  continueButton: string
  // Test questions will be added here
}> = {
  ka: {
    welcomeTitle: 'კეთილი იყოს შენი მობრძანება!',
    welcomeSubtitle: 'დავიწყოთ შენი სახელით',
    nameLabel: 'შენი სახელი',
    namePlaceholder: 'შეიყვანე შენი სახელი...',
    continueButton: 'გაგრძელება',
  },
  en: {
    welcomeTitle: 'Welcome!',
    welcomeSubtitle: 'Let\'s start with your name',
    nameLabel: 'Your Name',
    namePlaceholder: 'Enter your name...',
    continueButton: 'Continue',
  },
}

interface TestPageClientProps {
  locale: string
}

export function TestPageClient({ locale: initialLocale }: TestPageClientProps) {
  const locale = useLocale() as Locale
  const searchParams = useSearchParams()
  const t = content[locale]

  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'questions' | 'results'>('name')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Get email from URL parameter
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    } else {
      // If no email, redirect back to home page
      window.location.href = `/${locale}`
    }
  }, [searchParams, locale])

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setStep('questions')
      // TODO: Implement 9 questions flow
      console.log('Name submitted:', name, 'Email:', email)
    }
  }

  const NameForm = () => (
    <form onSubmit={handleNameSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-neu-light rounded-neu-lg p-6 md:p-8 shadow-neu-md">
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-3">
          {t.nameLabel}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="flex-1 px-6 py-4 rounded-neu-md shadow-neu-inset bg-neu-base text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neu-light text-base md:text-lg"
            required
            autoFocus
          />
          <Button
            type="submit"
            size="lg"
            rightIcon={ArrowRight}
            variant="primary"
            className="whitespace-nowrap px-8"
          >
            {t.continueButton}
          </Button>
        </div>
        <p className="mt-4 text-xs text-text-secondary text-center">
          თქვენი ელ-ფოსტა: {email}
        </p>
      </div>
    </form>
  )

  if (!isMounted || !email) {
    return null // Or show a loading spinner
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neu-light to-neu-base">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-24">
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary text-center mb-6 leading-tight"
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            {t.welcomeTitle}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-text-secondary text-center mb-12 md:mb-16 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            {t.welcomeSubtitle}
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={scaleUpVariants}
          >
            <NameForm />
          </motion.div>
        </div>
      </div>
    )
  }

  if (step === 'questions') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neu-light to-neu-base">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-24">
          <h1 className="text-3xl font-bold text-text-primary text-center mb-6">
            გამარჯობა, {name}!
          </h1>
          <p className="text-lg text-text-secondary text-center mb-12">
            ახლა დავიწყოთ ტესტი...
          </p>
          {/* TODO: Implement 9 questions here */}
          <div className="bg-neu-light rounded-neu-lg p-8 shadow-neu-md max-w-3xl mx-auto">
            <p className="text-center text-text-secondary">
              კითხვები მალე დაემატება... (9 კითხვა)
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
