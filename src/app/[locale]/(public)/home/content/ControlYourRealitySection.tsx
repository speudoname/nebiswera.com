'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Shield, Users, Brain, Sparkles } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  mainTitle: string
  subtitle: string
  independenceTitle: string
  independenceItems: Array<{
    label: string
    text: string
  }>
}> = {
  ka: {
    mainTitle: 'გინდა აკონტროლებდე შენს რეალობას',
    subtitle: 'რომ აკონტროლებდე რა მოხდება შენს ცხოვრებაში',
    independenceTitle: 'არ იყო დამოკიდებული',
    independenceItems: [
      {
        label: 'არც გარემოზე',
        text: 'შენი რეალობა არ არის დამოკიდებული გარე ვითარებებზე'
      },
      {
        label: 'არც სხვა ადამიანებზე',
        text: 'შენი ცხოვრება არ არის დამოკიდებული სხვების გადაწყვეტილებებზე'
      },
      {
        label: 'არც რწმენებზე',
        text: 'შენი მომავალი არ არის შეზღუდული საკუთარი რწმენებით'
      },
    ],
  },
  en: {
    mainTitle: 'Want to Control Your Reality',
    subtitle: 'Control what happens in your life',
    independenceTitle: 'Don\'t Be Dependent',
    independenceItems: [
      {
        label: 'Not on environment',
        text: 'Your reality is not dependent on external circumstances'
      },
      {
        label: 'Not on other people',
        text: 'Your life is not dependent on others\' decisions'
      },
      {
        label: 'Not on beliefs',
        text: 'Your future is not limited by your own beliefs'
      },
    ],
  },
}

const icons = [Shield, Users, Brain]

export function ControlYourRealitySection() {
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
      <p className="text-xl md:text-2xl text-text-secondary">
        {t.subtitle}
      </p>
    </div>
  )

  const IndependenceContent = () => (
    <div className="bg-neu-base rounded-neu-lg p-8 md:p-10 shadow-neu">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <Sparkles className="w-8 h-8 text-primary-600" />
        <h3 className="text-2xl md:text-3xl font-bold text-primary-600">
          {t.independenceTitle}
        </h3>
      </div>
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {t.independenceItems.map((item, index) => {
          const Icon = icons[index]
          return (
            <div
              key={index}
              className="bg-neu-light rounded-neu p-6 shadow-neu-inset text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                <Icon className="w-8 h-8 text-primary-600" />
              </div>
              <h4 className="text-lg md:text-xl font-bold text-text-primary mb-3">
                {item.label}
              </h4>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                {item.text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #8B5CF6 2px, transparent 2px)',
          backgroundSize: '60px 60px'
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
              variants={fadeUpVariants}
            >
              <IndependenceContent />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <IndependenceContent />
          </>
        )}
      </div>
    </section>
  )
}
