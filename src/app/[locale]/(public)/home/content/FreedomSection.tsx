'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Heart, Bird } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  condition: string
  equals: string
  conclusion: string
  subtitle: string
}> = {
  ka: {
    condition: 'თუკი შენი ნება შენს ხელშია',
    equals: '=',
    conclusion: 'შენ ხარ თავისუფალი!!!',
    subtitle: 'ნებისწერა არის ერთადერთი გზა - არა მხოლოდ გარეგანი, არამედ შინაგანი თავისუფლებისკენაც',
  },
  en: {
    condition: 'If your will is in your hands',
    equals: '=',
    conclusion: 'You are FREE!!!',
    subtitle: 'Nebiswera is the path to freedom - not just external, but internal freedom',
  },
}

export function FreedomSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const ContentBlock = () => (
    <div className="text-center max-w-4xl mx-auto">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Bird className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      {/* Equation-like layout */}
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
          {/* Condition */}
          <div className="bg-neu-base rounded-neu-lg px-6 py-4 md:px-8 md:py-6 shadow-neu">
            <p className="text-xl md:text-2xl lg:text-3xl text-text-primary font-semibold">
              {t.condition}
            </p>
          </div>

          {/* Equals sign */}
          <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary-100 shadow-neu-sm">
            <span className="text-2xl md:text-3xl font-bold text-primary-600">
              {t.equals}
            </span>
          </div>

          {/* Conclusion */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-neu-lg px-6 py-4 md:px-8 md:py-6 shadow-neu-md">
            <p className="text-2xl md:text-3xl lg:text-4xl text-white font-bold">
              {t.conclusion}
            </p>
          </div>
        </div>
      </div>

      {/* Heart icon */}
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary-100 shadow-neu-sm mb-6"
        animate={isMounted ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="w-8 h-8 md:w-10 md:h-10 text-secondary-600 fill-secondary-600" />
      </motion.div>

      {/* Subtitle */}
      <p className="text-lg md:text-xl lg:text-2xl text-text-secondary leading-relaxed max-w-3xl mx-auto">
        {t.subtitle}
      </p>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base relative overflow-hidden">
      {/* Background pattern - celebration theme */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #D946EF 2px, transparent 2px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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
