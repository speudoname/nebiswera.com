'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import {
  Heart,
  Briefcase,
  Sparkles,
  Wallet,
  Users,
  Target,
  Trophy
} from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, defaultViewport } from '@/lib/animations'

interface GoalItem {
  icon: React.ElementType
  title: string
}

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  goals: GoalItem[]
  closing: string
}> = {
  ka: {
    eyebrow: 'თუ გინდა',
    title: 'ნებისწერა მიზნების განხორციელებაში დაგეხმარება',
    subtitle: 'რა სფეროშიც არ უნდა გქონდეს მიზანი, ნებისწერა გასწავლის როგორ აირჩიო და შექმნა შენთვის სასურველი რეალობა',
    goals: [
      { icon: Heart, title: 'პირადი ურთიერთობები' },
      { icon: Sparkles, title: 'პიროვნული ზრდა' },
      { icon: Briefcase, title: 'კარიერული წინსვლა' },
      { icon: Target, title: 'თვითრეალიზაცია' },
      { icon: Wallet, title: 'კეთილდღეობა' },
      { icon: Users, title: 'ოჯახი და საზოგადოება' },
    ],
    closing: 'ყველა მიზანს ერთი საფუძველი აქვს — შენი ნება. ისწავლე როგორ გამოიყენო.',
  },
  en: {
    eyebrow: 'If You Want It',
    title: 'Nebiswera Will Help You Achieve Your Goals',
    subtitle: 'Whatever area of life you want to transform, Nebiswera teaches you how to choose and create the reality you desire',
    goals: [
      { icon: Heart, title: 'Personal Relationships' },
      { icon: Sparkles, title: 'Personal Growth' },
      { icon: Briefcase, title: 'Career Advancement' },
      { icon: Target, title: 'Self-Realization' },
      { icon: Wallet, title: 'Prosperity' },
      { icon: Users, title: 'Family & Community' },
    ],
    closing: 'Every goal has one foundation — your will. Learn how to use it.',
  },
}

export function AchieveYourGoalsSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const GoalItem = ({ goal }: { goal: GoalItem }) => {
    const Icon = goal.icon
    return (
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu-sm">
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <span className="text-sm md:text-lg font-semibold text-text-primary">
          {goal.title}
        </span>
      </div>
    )
  }

  const HeaderContent = () => (
    <div className="text-center mb-10 md:mb-12">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      <span className="inline-block text-primary-600 font-semibold text-lg md:text-xl mb-4 tracking-wide uppercase">
        {t.eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
        {t.title}
      </h2>
      <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
        {t.subtitle}
      </p>
    </div>
  )

  const GoalsList = () => (
    <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-10 md:mb-12">
      {t.goals.map((goal, index) => (
        <GoalItem key={index} goal={goal} />
      ))}
    </div>
  )

  const ClosingStatement = () => (
    <div className="text-center">
      <div className="inline-block bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-neu-lg px-8 py-6 shadow-neu">
        <p className="text-xl md:text-2xl font-semibold text-text-primary">
          {t.closing}
        </p>
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50/50 to-neu-base relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #8B5CF6 1px, transparent 1px)',
          backgroundSize: '40px 40px'
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

            {/* Goals List */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
            >
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-10 md:mb-12">
                {t.goals.map((goal, index) => (
                  <motion.div key={index} variants={fadeUpVariants}>
                    <GoalItem goal={goal} />
                  </motion.div>
                ))}
              </div>
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
          </>
        ) : (
          <>
            <HeaderContent />
            <GoalsList />
            <ClosingStatement />
          </>
        )}
      </div>
    </section>
  )
}
