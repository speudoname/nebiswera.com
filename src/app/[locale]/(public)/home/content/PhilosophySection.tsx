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
    title: 'შენი ცხოვრება შენზე უნდა იყოს დამოკიდებული',
    subtitle: 'და შენი მომავალი ზუსტად ისეთი იქნება როგორიც მოგეწონებოდა',
  },
  en: {
    title: 'Your Life Should Depend on You',
    subtitle: 'And your future will be exactly as you would like it',
  },
}

export function PhilosophySection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4 leading-tight">
        {t.title}
      </h2>
      <p className="text-xl md:text-2xl text-text-secondary">
        {t.subtitle}
      </p>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
      <div className="max-w-4xl mx-auto">
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            <HeaderContent />
          </motion.div>
        ) : (
          <HeaderContent />
        )}
      </div>
    </section>
  )
}
