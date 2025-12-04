'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import {
  Brain,
  Globe,
  ArrowRightLeft,
  Construction,
  Lightbulb,
  Hammer
} from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  internalTitle: string
  internalDescription: string
  internalTraits: string[]
  externalTitle: string
  externalDescription: string
  externalTraits: string[]
  disconnectText: string
  bridgeTitle: string
  bridgeDescription: string
  fromLabel: string
  toLabel: string
  closing: string
}> = {
  ka: {
    eyebrow: 'რაში მდგომარეობს პრობლემა',
    title: 'შიგნიდან',
    titleAccent: 'გარეთ',
    subtitle: 'შენი პოტენციალი, იდეები და ჭეშმარიტი "მე" მხოლოდ თავში არსებობს. დროა გარეთ გამოიტანო.',
    internalTitle: 'შენი შინაგანი სამყარო',
    internalDescription: 'მდიდარი, ღრმა, სავსე კითხვებით და თვითშეცნობით',
    internalTraits: [
      'საკუთარ თავში ჩახედული',
      'შენი ღირებულებები იცი',
      'იდეები და ხედვები გაქვს',
      'პოტენციალს გრძნობ შიგნით',
    ],
    externalTitle: 'შენი გარეგანი რეალობა',
    externalDescription: 'გაჩერებული, განმეორებადი, გადავადებული',
    externalTraits: [
      'დახურულ წრეში ტრიალი',
      'გზაჯვარედინზე დგომა',
      'დაწყება ვერ ხერხდება',
      'ცხოვრება ელოდება',
    ],
    disconnectText: 'გაწყვეტა იმას შორის, ვინც გრძნობ რომ ხარ — და როგორ გამოიყურება შენი ცხოვრება',
    bridgeTitle: 'მექანიზმი გადასალახად',
    bridgeDescription: 'შეწყვიტე საკუთარი სირთულით პარალიზება. დაიწყე მისი გამოყენება ცხოვრების ასაშენებლად, რომელიც შენ აირჩიე.',
    fromLabel: 'ცხოვრებაზე ფიქრი',
    toLabel: 'ცხოვრების შენება',
    closing: 'თარგმნე შენი შინაგანი სამყარო გარეგან რეალობად.',
  },
  en: {
    eyebrow: 'The Core Problem',
    title: 'From Inside',
    titleAccent: 'To Outside',
    subtitle: 'Your potential, ideas, and true self exist only in your head. It\'s time to bring them out.',
    internalTitle: 'Your Internal World',
    internalDescription: 'Rich, deep, full of questions and self-awareness',
    internalTraits: [
      'You\'ve looked into yourself',
      'You know your values',
      'You have ideas and visions',
      'You feel potential inside',
    ],
    externalTitle: 'Your External Reality',
    externalDescription: 'Stagnant, repetitive, postponed',
    externalTraits: [
      'Spinning in circles',
      'Standing at crossroads',
      'Can\'t seem to start',
      'Life is waiting',
    ],
    disconnectText: 'The disconnect between who you feel you are — and what your life looks like',
    bridgeTitle: 'The Mechanism to Bridge It',
    bridgeDescription: 'Stop being paralyzed by your own complexity. Start using it to build the life you chose.',
    fromLabel: 'Thinking About Life',
    toLabel: 'Constructing Life',
    closing: 'Translate your internal world into external reality.',
  },
}

export function InternalToExternalSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
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

  const WorldsComparison = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
      {/* Internal World */}
      <div className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-neu-lg p-6 md:p-8 border border-primary-200/50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              {t.internalTitle}
            </h3>
            <p className="text-text-secondary text-sm">
              {t.internalDescription}
            </p>
          </div>
        </div>
        <ul className="space-y-3">
          {t.internalTraits.map((trait, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-text-primary">{trait}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* External World */}
      <div className="bg-neu-dark/5 rounded-neu-lg p-6 md:p-8 border border-text-secondary/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-text-secondary/20 flex items-center justify-center">
            <Globe className="w-7 h-7 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              {t.externalTitle}
            </h3>
            <p className="text-text-secondary text-sm">
              {t.externalDescription}
            </p>
          </div>
        </div>
        <ul className="space-y-3">
          {t.externalTraits.map((trait, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-text-secondary/50" />
              <span className="text-text-secondary">{trait}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  const DisconnectBanner = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="inline-flex items-center gap-4 bg-neu-base rounded-full px-6 py-4 shadow-neu">
        <ArrowRightLeft className="w-5 h-5 text-primary-500" />
        <p className="text-text-primary font-medium">
          {t.disconnectText}
        </p>
      </div>
    </div>
  )

  const BridgeBlock = () => (
    <div className="max-w-4xl mx-auto mb-12 md:mb-16">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-neu-lg p-8 md:p-10 shadow-lg">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {t.bridgeTitle}
          </h3>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            {t.bridgeDescription}
          </p>
        </div>

        {/* From -> To visual */}
        <div className="flex items-center justify-center gap-4 md:gap-8">
          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <p className="text-white/80 text-sm md:text-base font-medium">
              {t.fromLabel}
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="w-12 md:w-20 h-1 bg-white/40 rounded-full relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-white/60 border-y-4 border-y-transparent" />
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Hammer className="w-8 h-8 md:w-10 md:h-10 text-primary-600" />
            </div>
            <p className="text-white text-sm md:text-base font-bold">
              {t.toLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const ClosingStatement = () => (
    <div className="text-center">
      <div className="inline-flex items-center gap-4 bg-neu-base rounded-neu-lg px-8 py-6 shadow-neu border border-primary-200/30">
        <Construction className="w-7 h-7 text-primary-600" />
        <p className="text-xl md:text-2xl font-bold text-text-primary">
          {t.closing}
        </p>
      </div>
    </div>
  )

  const StaticContent = () => (
    <>
      <HeaderContent />
      <WorldsComparison />
      <DisconnectBanner />
      <BridgeBlock />
      <ClosingStatement />
    </>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base relative overflow-hidden">
      {/* Split background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-primary-500/[0.02] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-text-secondary/[0.02] to-transparent" />
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

            {/* Worlds Comparison */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <WorldsComparison />
            </motion.div>

            {/* Disconnect */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <DisconnectBanner />
            </motion.div>

            {/* Bridge */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <BridgeBlock />
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
          <StaticContent />
        )}
      </div>
    </section>
  )
}
