'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  quote: string
  quoteAuthor: string
}> = {
  ka: {
    eyebrow: 'პირადი ტრანსფორმაციის მიღმა',
    title: 'ეგზისტენციალური',
    titleAccent: 'ნავიგაციის სისტემა',
    subtitle: 'ნებისწერა არ არის მხოლოდ საკუთარი თავის გაუმჯობესების ინსტრუმენტი — ეს არის გზამკვლევი არსებობის გასაგებად',
    quote: 'ნებისწერა არის რუკა იმ ტერიტორიისა, სადაც უკვე ცხოვრობ — მაგრამ არასდროს გინახავს.',
    quoteAuthor: '',
  },
  en: {
    eyebrow: 'Beyond Personal Transformation',
    title: 'An Existential',
    titleAccent: 'Navigation System',
    subtitle: 'Nebiswera is not just a self-improvement tool — it\'s a guide to understanding existence itself',
    quote: 'Nebiswera is a map of the territory you already live in — but have never seen.',
    quoteAuthor: '',
  },
}

export function ExistentialNavigationSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Compass className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      <span className="inline-block text-primary-600 font-semibold text-lg md:text-xl mb-4 tracking-wide uppercase">
        {t.eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-2 leading-tight">
        {t.title}
      </h2>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-600 mb-6 leading-tight">
        {t.titleAccent}
      </h2>
      <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
        {t.subtitle}
      </p>
    </div>
  )

  const MapImage = () => (
    <div className="flex justify-center mb-12 md:mb-16">
      <div className="w-full max-w-2xl rounded-neu-lg overflow-hidden shadow-neu-md">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/map.jpg"
          alt="Existential Navigation Map"
          width={672}
          height={504}
          className="w-full h-auto"
          sizes="(max-width: 640px) 95vw, 672px"
        />
      </div>
    </div>
  )

  const QuoteBlock = () => (
    <div className="relative max-w-3xl mx-auto">
      <div className="absolute -top-4 -left-4 text-8xl text-primary-200 font-serif leading-none select-none">
        "
      </div>
      <div className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-neu-lg p-8 md:p-10 shadow-neu border border-primary-200/30">
        <p className="text-xl md:text-2xl font-medium text-text-primary text-center leading-relaxed italic">
          {t.quote}
        </p>
        {t.quoteAuthor && (
          <p className="text-center text-text-secondary mt-4">
            — {t.quoteAuthor}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base relative overflow-hidden">
      {/* Subtle cosmic background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, #8B5CF6 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, #CC7EB8 0%, transparent 50%)
          `,
        }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
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

            {/* Map Image */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <MapImage />
            </motion.div>

            {/* Quote */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <QuoteBlock />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <MapImage />
            <QuoteBlock />
          </>
        )}
      </div>
    </section>
  )
}
