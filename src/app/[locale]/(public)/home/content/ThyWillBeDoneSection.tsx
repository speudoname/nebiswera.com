'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  mainTitle: string
  subtitle: string
  supportingText: string
}> = {
  ka: {
    mainTitle: 'იყოს ნება შენი',
    subtitle: 'უსაფრთხოდ იგრძნო თავი იმით, რომ მომავალი შენს ხელშია',
    supportingText: 'არაფრის ქნა აღარ დაგჭირდება',
  },
  en: {
    mainTitle: 'Thy Will Be Done',
    subtitle: 'Feel safe knowing the future is in your hands',
    supportingText: 'You won\'t need to do anything',
  },
}

export function ThyWillBeDoneSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const ContentBlock = () => (
    <div className="text-center max-w-3xl mx-auto">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Crown className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 md:mb-8 leading-tight">
        {t.mainTitle}
      </h2>
      <p className="text-xl md:text-2xl lg:text-3xl text-text-secondary mb-4 md:mb-6 leading-relaxed">
        {t.subtitle}
      </p>
      <div className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 rounded-neu px-6 py-3 md:px-8 md:py-4 shadow-neu-md">
        <p className="text-lg md:text-xl font-semibold text-white">
          {t.supportingText}
        </p>
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50/50 to-neu-base relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #8B5CF6 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            <ContentBlock />
          </motion.div>
        ) : (
          <ContentBlock />
        )}
      </div>
    </section>
  )
}
