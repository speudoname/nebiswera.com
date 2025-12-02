'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Target, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  mainTitle: string
  subtitle: string
  keyPoint: string
  description: string
}> = {
  ka: {
    mainTitle: 'თუ გინდა რომ იყო, აკეთო და გქონდეს რაც გინდა',
    subtitle: 'უნდა იცოდე რა გინდა!',
    keyPoint: 'ყველაფერი იწყება ერთით - უნდა იცოდე რა გინდა',
    description: 'ეს არის პირველი ნაბიჯი ნებისწერისკენ. ვერ მიაღწევ იმას, რაც არ იცი რა არის. ვერ შექმნი რეალობას, რომელიც არ გაქვს ნათლად წარმოდგენილი. ნებისწერა გეხმარება გაიგო რა გინდა სინამდვილეში - არა ის რაც სხვებს სურთ შენთვის, არამედ ის რაც შენ გინდა საკუთარი თავისთვის.',
  },
  en: {
    mainTitle: 'If You Want to Be, Do, and Have What You Want',
    subtitle: 'You Need to Know What You Want!',
    keyPoint: 'Everything starts with one thing - knowing what you want',
    description: 'This is the first step toward Nebiswera. You cannot achieve what you don\'t know. You cannot create a reality you haven\'t clearly envisioned. Nebiswera helps you understand what you truly want - not what others want for you, but what you want for yourself.',
  },
}

export function KnowWhatYouWantSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4 leading-tight">
        {t.mainTitle}
      </h2>
      <div className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 rounded-neu px-8 py-4 shadow-neu-md">
        <p className="text-2xl md:text-3xl font-bold text-white">
          {t.subtitle}
        </p>
      </div>
    </div>
  )

  const MainContent = () => (
    <div className="bg-neu-base rounded-neu-lg p-8 md:p-10 shadow-neu">
      <div className="flex items-start gap-6 mb-8">
        <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu-md">
          <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl md:text-2xl font-bold text-primary-600 mb-4">
            {t.keyPoint}
          </h3>
          <p className="text-base md:text-lg text-text-primary leading-relaxed">
            {t.description}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #8B5CF6 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {isMounted ? (
          <>
            {/* Header */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <HeaderContent />
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <MainContent />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <MainContent />
          </>
        )}
      </div>
    </section>
  )
}
