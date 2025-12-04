'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Cog, Wrench, Lightbulb, Shield, Users, Brain, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  headline: string
  subheadline: string
  consumer: {
    label: string
    description: string
  }
  engineer: {
    label: string
    description: string
  }
  independenceTitle: string
  independenceItems: Array<{
    label: string
    text: string
  }>
  conclusion: string
}> = {
  ka: {
    headline: 'თუ გინდა შეგეძლოს მართო რეალობა',
    subheadline: 'გახდი რეალობის ინჟინერი და არა მოცემულობის მომხმარებელი',
    consumer: {
      label: 'მომხმარებელი',
      description: 'იყენებს სისტემას, იმის გარეშე რომ ესმოდეს როგორ მუშაობს. რეაგირებს გარემოებებზე. ელოდება ბედისწერას.',
    },
    engineer: {
      label: 'ინჟინერი',
      description: 'ესმის მექანიკა. ქმნის სისტემებს. აპროექტებს რეალობას იმისდა მიხედვით, თუ რა სურს.',
    },
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
    conclusion: 'ნებისწერა გასწავლის რეალობის შექმნის მექანიკას — რომ შენ აირჩიო, და არა გარემოებებმა.',
  },
  en: {
    headline: 'If You Want to Control Your Reality',
    subheadline: 'Become the Engineer, Not the Consumer',
    consumer: {
      label: 'Consumer',
      description: 'Uses the system without understanding how it works. Reacts to circumstances. Waits for fate.',
    },
    engineer: {
      label: 'Engineer',
      description: 'Understands the mechanics. Creates systems. Designs reality according to their will.',
    },
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
    conclusion: 'Nebiswera teaches you the mechanics of reality creation — so you choose, not circumstances.',
  },
}

const independenceIcons = [Shield, Users, Brain]

export function BecomeTheEngineerSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Cog className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4 leading-tight">
        {t.headline}
      </h2>
      <p className="text-xl sm:text-2xl md:text-3xl text-primary-600 font-medium">
        {t.subheadline}
      </p>
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

  const IndependenceContent = () => (
    <div className="bg-neu-base rounded-neu-lg p-8 md:p-10 shadow-neu mb-12 md:mb-16">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <Sparkles className="w-8 h-8 text-primary-600" />
        <h3 className="text-2xl md:text-3xl font-bold text-primary-600">
          {t.independenceTitle}
        </h3>
      </div>
      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {t.independenceItems.map((item, index) => {
          const Icon = independenceIcons[index]
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

  const ConclusionBox = () => (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg text-center mb-12 md:mb-16">
      <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
        {t.conclusion}
      </p>
    </div>
  )

  const AuthorImage = () => (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl rounded-neu-lg overflow-hidden shadow-neu-md">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/author.jpg"
          alt="Author - Reality Engineer"
          width={672}
          height={336}
          className="w-full h-auto"
          sizes="(max-width: 640px) 95vw, 672px"
        />
      </div>
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
              <HeaderContent />
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
              <IndependenceContent />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <ConclusionBox />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <AuthorImage />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <ComparisonCards />
            <IndependenceContent />
            <ConclusionBox />
            <AuthorImage />
          </>
        )}
      </div>
    </section>
  )
}
