'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Focus } from 'lucide-react'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  closing: string
}> = {
  ka: {
    eyebrow: 'რაც ნამდვილად გჭირდება',
    title: 'ცხადი',
    titleAccent: 'რეალობა',
    subtitle: 'შენ იცი რომ რაღაც უნდა შეიცვალოს. მაგრამ გაუგებრობა იმდენია, რომ შინაარსს ვერ არჩევ. ნებისწერა გაძლევს სიცხადეს.',
    closing: 'გაუგებრობიდან — შინაარსამდე. ქაოსიდან — სიცხადემდე.',
  },
  en: {
    eyebrow: 'What You Really Need',
    title: 'Clear',
    titleAccent: 'Reality',
    subtitle: 'You know something needs to change. But there\'s so much confusion you can\'t find the meaning. Nebiswera gives you clarity.',
    closing: 'From confusion — to meaning. From chaos — to clarity.',
  },
}

export function ClaritySection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Focus className="w-8 h-8 md:w-10 md:h-10 text-white" />
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

  const ClosingStatement = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="inline-block bg-neu-dark rounded-neu-lg px-8 py-6 shadow-neu">
        <p className="text-xl md:text-2xl font-bold text-primary-300">
          {t.closing}
        </p>
      </div>
    </div>
  )

  const ClarityImage = () => (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl rounded-neu-lg overflow-hidden shadow-neu-md">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/clarity.jpg"
          alt="From confusion to clarity"
          width={672}
          height={336}
          className="w-full h-auto"
          sizes="(max-width: 640px) 95vw, 672px"
        />
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base relative overflow-hidden">
      {/* Noise to signal background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1/3 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(180deg, #8B5CF6 0%, #CC7EB8 100%)',
        }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
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

            {/* Closing */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <ClosingStatement />
            </motion.div>

            {/* Clarity Image */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <ClarityImage />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <ClosingStatement />
            <ClarityImage />
          </>
        )}
      </div>
    </section>
  )
}
