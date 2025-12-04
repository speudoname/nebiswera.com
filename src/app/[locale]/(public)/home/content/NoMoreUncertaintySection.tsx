'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Compass, Eye, Shield, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  condition: string
  result: string
  principles: {
    icon: 'compass' | 'eye' | 'shield'
    title: string
    description: string
  }[]
  conclusion: string
}> = {
  ka: {
    condition: 'თუ გაერკვევი რეალობის მართვის მთავარ პრინციპებში...',
    result: 'შენი მომავალი აღარ იქნება მოულოდნელი და უკონტროლო',
    principles: [
      {
        icon: 'compass',
        title: 'მიმართულება',
        description: 'იცი სად მიდიხარ და რატომ. არჩევანები აღარ არის შემთხვევითი.',
      },
      {
        icon: 'eye',
        title: 'სიცხადე',
        description: 'ხედავ როგორ მუშაობს რეალობა. აღარ ხარ ბნელში.',
      },
      {
        icon: 'shield',
        title: 'კონტროლი',
        description: 'შენ ქმნი გარემოებებს, და არა გარემოებები — შენ.',
      },
    ],
    conclusion: 'ნებისწერა გაძლევს პრინციპებს, რომლებიც მომავალს პროგნოზირებადს ხდის.',
  },
  en: {
    condition: 'If you understand the main principles of reality management...',
    result: 'Your future will no longer be unexpected and uncontrollable',
    principles: [
      {
        icon: 'compass',
        title: 'Direction',
        description: 'You know where you\'re going and why. Choices are no longer random.',
      },
      {
        icon: 'eye',
        title: 'Clarity',
        description: 'You see how reality works. You\'re no longer in the dark.',
      },
      {
        icon: 'shield',
        title: 'Control',
        description: 'You create circumstances, not circumstances — you.',
      },
    ],
    conclusion: 'Nebiswera gives you the principles that make your future predictable.',
  },
}

const iconMap = {
  compass: Compass,
  eye: Eye,
  shield: Shield,
}

export function NoMoreUncertaintySection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      <p className="text-xl md:text-2xl text-primary-600 font-medium italic mb-4">
        {t.condition}
      </p>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary leading-tight">
        {t.result}
      </h2>
    </div>
  )

  const PrinciplesGrid = () => (
    <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
      {t.principles.map((principle, index) => {
        const Icon = iconMap[principle.icon]
        return (
          <div
            key={index}
            className="bg-neu-light rounded-neu-lg p-6 md:p-8 shadow-neu border border-neu-dark/10 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-neu-sm">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
              {principle.title}
            </h3>
            <p className="text-text-secondary text-base md:text-lg leading-relaxed">
              {principle.description}
            </p>
          </div>
        )
      })}
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
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50/50 to-neu-base relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #8B5CF6 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>
      <div className="max-w-5xl mx-auto relative z-10">
        {isMounted ? (
          <>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <HeaderContent />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
              className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16"
            >
              {t.principles.map((principle, index) => {
                const Icon = iconMap[principle.icon]
                return (
                  <motion.div
                    key={index}
                    variants={staggerItemVariants}
                    className="bg-neu-light rounded-neu-lg p-6 md:p-8 shadow-neu border border-neu-dark/10 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-neu-sm">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-text-secondary text-base md:text-lg leading-relaxed">
                      {principle.description}
                    </p>
                  </motion.div>
                )
              })}
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
            <HeaderContent />
            <PrinciplesGrid />
            <ConclusionBox />
          </>
        )}
      </div>
    </section>
  )
}
