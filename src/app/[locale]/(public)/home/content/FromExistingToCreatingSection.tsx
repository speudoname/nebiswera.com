'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import {
  Cog,
  Brain,
  Focus,
  ArrowRight,
  Crosshair,
  Flame,
  Wand2
} from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, defaultViewport } from '@/lib/animations'

interface PillarItem {
  icon: React.ElementType
  title: string
  description: string
}

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  transitionFrom: string
  transitionTo: string
  pillars: PillarItem[]
  forWhom: string
  closing: string
}> = {
  ka: {
    eyebrow: 'გადასვლა',
    title: 'არსებობიდან',
    titleAccent: 'შექმნამდე',
    subtitle: 'ნებისწერა გაძლევს მექანიზმებს, აზროვნებას და სიცხადეს, რომელიც საჭიროა უბრალოდ "არსებობიდან" აქტიურად "შექმნაზე" გადასასვლელად',
    transitionFrom: 'უბრალოდ არსებობა',
    transitionTo: 'აქტიური შექმნა',
    pillars: [
      {
        icon: Cog,
        title: 'მექანიზმები',
        description: 'პრაქტიკული ინსტრუმენტები და სისტემები, რომლებიც რეალურად მუშაობს. არა თეორია — არამედ გამოყენებადი მეთოდები.',
      },
      {
        icon: Brain,
        title: 'აზროვნება',
        description: 'ახალი პერსპექტივა რეალობაზე. აზროვნების წესი, რომელიც გარდაქმნის შენს დამოკიდებულებას ცხოვრებისადმი.',
      },
      {
        icon: Focus,
        title: 'სიცხადე',
        description: 'ნათელი ხედვა იმისა, თუ ვინ ხარ, რა გინდა და როგორ მიაღწიო. არანაირი ბუნდოვანება.',
      },
    ],
    forWhom: 'მათთვის, ვინც მზად არის განსაზღვროს საკუთარი ნება და განახორციელოს ის სიზუსტით',
    closing: 'შეწყვიტე არსებობა. დაიწყე შექმნა.',
  },
  en: {
    eyebrow: 'The Transition',
    title: 'From Existing',
    titleAccent: 'To Creating',
    subtitle: 'Nebiswera provides the mechanisms, mindset, and clarity needed to transition from simply "existing" to actively "creating" your reality',
    transitionFrom: 'Simply Existing',
    transitionTo: 'Actively Creating',
    pillars: [
      {
        icon: Cog,
        title: 'Mechanisms',
        description: 'Practical tools and systems that actually work. Not theory — but applicable methods.',
      },
      {
        icon: Brain,
        title: 'Mindset',
        description: 'A new perspective on reality. A way of thinking that transforms your relationship with life.',
      },
      {
        icon: Focus,
        title: 'Clarity',
        description: 'Clear vision of who you are, what you want, and how to achieve it. No ambiguity.',
      },
    ],
    forWhom: 'For those who are ready to define their own Will and execute it with precision',
    closing: 'Stop existing. Start creating.',
  },
}

export function FromExistingToCreatingSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const PillarCard = ({ pillar }: { pillar: PillarItem }) => {
    const Icon = pillar.icon
    return (
      <div className="group bg-neu-base rounded-neu-lg p-8 shadow-neu hover:shadow-neu-md transition-all duration-300 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-6 shadow-neu-sm group-hover:scale-110 transition-transform">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-3">
          {pillar.title}
        </h3>
        <p className="text-text-secondary leading-relaxed">
          {pillar.description}
        </p>
      </div>
    )
  }

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Wand2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
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
      <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
        {t.subtitle}
      </p>
    </div>
  )

  const TransitionVisual = () => (
    <div className="max-w-3xl mx-auto mb-12 md:mb-16">
      <div className="flex items-center justify-center gap-4 md:gap-6">
        {/* From State */}
        <div className="flex-1 max-w-[200px]">
          <div className="bg-neu-dark/50 rounded-neu-lg p-4 md:p-6 text-center border border-text-secondary/20">
            <div className="w-12 h-12 rounded-full bg-text-secondary/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl opacity-50">😶</span>
            </div>
            <p className="font-semibold text-text-secondary text-sm md:text-base">
              {t.transitionFrom}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center">
          <div className="w-12 md:w-20 h-1 bg-gradient-to-r from-text-secondary/30 via-primary-500 to-secondary-500 rounded-full relative">
            <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-500" />
          </div>
        </div>

        {/* To State */}
        <div className="flex-1 max-w-[200px]">
          <div className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-neu-lg p-4 md:p-6 text-center border border-primary-300/50 shadow-neu">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-text-primary text-sm md:text-base">
              {t.transitionTo}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const PillarsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
      {t.pillars.map((pillar, index) => (
        <PillarCard key={index} pillar={pillar} />
      ))}
    </div>
  )

  const ForWhomBadge = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full px-6 py-3 shadow-neu-sm">
        <Crosshair className="w-5 h-5 text-primary-600" />
        <p className="text-text-primary font-medium">
          {t.forWhom}
        </p>
      </div>
    </div>
  )

  const ClosingStatement = () => (
    <div className="text-center">
      <div className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 rounded-neu-lg px-10 py-6 shadow-lg">
        <p className="text-2xl md:text-3xl font-bold text-white">
          {t.closing}
        </p>
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base relative overflow-hidden">
      {/* Subtle diagonal lines background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #8B5CF6,
            #8B5CF6 1px,
            transparent 1px,
            transparent 40px
          )`,
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

            {/* Transition Visual */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <TransitionVisual />
            </motion.div>

            {/* Pillars */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                {t.pillars.map((pillar, index) => (
                  <motion.div key={index} variants={fadeUpVariants}>
                    <PillarCard pillar={pillar} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* For Whom + Closing */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <ForWhomBadge />
              <ClosingStatement />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <TransitionVisual />
            <PillarsGrid />
            <ForWhomBadge />
            <ClosingStatement />
          </>
        )}
      </div>
    </section>
  )
}
