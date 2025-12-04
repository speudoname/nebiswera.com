'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Cog, Wrench, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  hook: string
  title: string
  subtitle: string
  consumer: {
    label: string
    description: string
  }
  engineer: {
    label: string
    description: string
  }
  conclusion: string
}> = {
  ka: {
    hook: 'თუ გინდა შეგეძლოს მართო რეალობა...',
    title: 'გახდი ინჟინერი',
    subtitle: 'და არა მომხმარებელი',
    consumer: {
      label: 'მომხმარებელი',
      description: 'იყენებს სისტემას, იმის გარეშე რომ ესმოდეს როგორ მუშაობს. რეაგირებს გარემოებებზე. ელოდება ბედისწერას.',
    },
    engineer: {
      label: 'ინჟინერი',
      description: 'ესმის მექანიკა. ქმნის სისტემებს. აპროექტებს რეალობას იმისდა მიხედვით, თუ რა სურს.',
    },
    conclusion: 'ნებისწერა გასწავლის რეალობის შექმნის მექანიკას — რომ შენ აირჩიო, და არა გარემოებებმა.',
  },
  en: {
    hook: 'If you want to control your reality...',
    title: 'Become the Engineer',
    subtitle: 'Not the Consumer',
    consumer: {
      label: 'Consumer',
      description: 'Uses the system without understanding how it works. Reacts to circumstances. Waits for fate.',
    },
    engineer: {
      label: 'Engineer',
      description: 'Understands the mechanics. Creates systems. Designs reality according to their will.',
    },
    conclusion: 'Nebiswera teaches you the mechanics of reality creation — so you choose, not circumstances.',
  },
}

export function BecomeTheEngineerSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HookContent = () => (
    <div className="text-center mb-8">
      <p className="text-xl md:text-2xl text-primary-600 font-medium italic">
        {t.hook}
      </p>
    </div>
  )

  const TitleContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="flex items-center justify-center gap-4 mb-4">
        <Cog className="w-10 h-10 md:w-14 md:h-14 text-primary-600" />
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary">
            {t.title}
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-light text-text-secondary">
            {t.subtitle}
          </p>
        </div>
      </div>
    </div>
  )

  const ComparisonCards = () => (
    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
      {/* Consumer Card */}
      <div className="bg-neu-dark/30 rounded-neu-lg p-6 md:p-8 border-2 border-neu-dark/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-neu-dark/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-neu-dark/50 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-text-muted" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-text-muted">
              {t.consumer.label}
            </h3>
          </div>
          <p className="text-text-secondary text-base md:text-lg leading-relaxed">
            {t.consumer.description}
          </p>
        </div>
      </div>

      {/* Engineer Card */}
      <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/20 rounded-neu-lg p-6 md:p-8 border-2 border-primary-500/30 shadow-neu relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center shadow-neu-sm">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-primary-700">
              {t.engineer.label}
            </h3>
          </div>
          <p className="text-text-primary text-base md:text-lg leading-relaxed">
            {t.engineer.description}
          </p>
        </div>
      </div>
    </div>
  )

  const ConclusionBox = () => (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg text-center">
      <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
        {t.conclusion}
      </p>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
      <div className="max-w-5xl mx-auto">
        {isMounted ? (
          <>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <HookContent />
              <TitleContent />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
              className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16"
            >
              <motion.div
                className="bg-neu-dark/30 rounded-neu-lg p-6 md:p-8 border-2 border-neu-dark/50 relative overflow-hidden"
                variants={staggerItemVariants}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-neu-dark/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-neu-dark/50 flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-text-muted" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-text-muted">
                      {t.consumer.label}
                    </h3>
                  </div>
                  <p className="text-text-secondary text-base md:text-lg leading-relaxed">
                    {t.consumer.description}
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-primary-500/10 to-primary-600/20 rounded-neu-lg p-6 md:p-8 border-2 border-primary-500/30 shadow-neu relative overflow-hidden"
                variants={staggerItemVariants}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center shadow-neu-sm">
                      <Lightbulb className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-primary-700">
                      {t.engineer.label}
                    </h3>
                  </div>
                  <p className="text-text-primary text-base md:text-lg leading-relaxed">
                    {t.engineer.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <ConclusionBox />
            </motion.div>
          </>
        ) : (
          <>
            <HookContent />
            <TitleContent />
            <ComparisonCards />
            <ConclusionBox />
          </>
        )}
      </div>
    </section>
  )
}
