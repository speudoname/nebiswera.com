'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  ctaBold: string
  ctaRegular: string
  ctaAccentBold: string
  subtitle: string
}> = {
  ka: {
    ctaBold: 'გაინტერესებს მარტივი ფორმულა ->',
    ctaRegular: 'რომელიც შეცვლის შენს მომავალს? ->',
    ctaAccentBold: 'ნებისწერის საოცარი თეორემა!',
    subtitle: '...რომ ცხადად გააცნობიერო - შენი ნების ძალა?',
  },
  en: {
    ctaBold: 'Then you need to learn ->',
    ctaRegular: 'the Nebiswera theorem',
    ctaAccentBold: '',
    subtitle: 'Are you ready to reclaim the power that has never been taken from anyone?',
  },
}

export function NebisweraCallToActionSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const ContentOnly = () => (
    <div className="text-center">
      <p className="text-2xl md:text-3xl leading-tight mb-3 md:mb-6">
        <span className="font-bold text-text-primary">{t.ctaBold}</span>{' '}
        <span className="font-normal text-text-primary">{t.ctaRegular}</span>{' '}
        <span className="font-bold text-primary-600">{t.ctaAccentBold}</span>
      </p>
      <p className="text-lg md:text-xl text-text-primary">
        {t.subtitle}
      </p>
    </div>
  )

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 md:px-8" style={{ background: 'linear-gradient(to bottom, #E8E0F0, #F0EBF8)' }}>
      <div className="max-w-4xl mx-auto">
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            <ContentOnly />
          </motion.div>
        ) : (
          <ContentOnly />
        )}
      </div>
    </section>
  )
}
