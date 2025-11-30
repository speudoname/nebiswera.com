'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  title: string
  subtitle: string
}> = {
  ka: {
    title: 'შენი ცხოვრება კვლავ შენი ხდება',
    subtitle: 'ნებისწერა გასწავლის არჩევანის ფარულ მექანიკას — რომ საბოლოოდ იცხოვრო ის ცხოვრება, რომელიც ნამდვილად გინდა.',
  },
  en: {
    title: 'Your life becomes yours again',
    subtitle: 'Nebiswera teaches you the hidden mechanics of choice — so you can finally live the life you actually want.',
  },
}

export function LifeBecomesYoursSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const ContentSection = () => (
    <div className="text-center max-w-4xl mx-auto">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
        {t.title}
      </h2>
      <p className="text-xl md:text-2xl text-text-secondary leading-relaxed">
        {t.subtitle}
      </p>
    </div>
  )

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
      <div className="max-w-6xl mx-auto">
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            <ContentSection />
          </motion.div>
        ) : (
          <ContentSection />
        )}
      </div>
    </section>
  )
}
