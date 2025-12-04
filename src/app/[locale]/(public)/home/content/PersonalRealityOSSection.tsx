'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Zap,
  Monitor
} from 'lucide-react'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccent: string
  subtitle: string
  bridgeLabel: string
  bridgeFrom: string
  bridgeFromLabel: string
  bridgeTo: string
  bridgeToLabel: string
  bridgeName: string
  closing: string
}> = {
  ka: {
    eyebrow: 'პრაქტიკული ტექნოლოგია',
    title: 'ოპერაციული სისტემა',
    titleAccent: 'პირადი რეალობის მართვისთვის',
    subtitle: 'ნებისწერა არის მექანიზმი ეგზისტენციალური ქაოსის სტრუქტურირებულ რეალობად გადაქცევისთვის',
    bridgeLabel: 'ხიდი',
    bridgeFrom: 'საკუთარი თავის შეცნობა',
    bridgeFromLabel: 'შეცნობა',
    bridgeTo: 'ცხოვრების შექმნა',
    bridgeToLabel: 'მოქმედება',
    bridgeName: 'ნებისწერა',
    closing: 'ნებისწერა — აზროვნების ტექნოლოგია რეალობის შესაქმნელად.',
  },
  en: {
    eyebrow: 'Practical Technology',
    title: 'Operating System',
    titleAccent: 'for Managing Personal Reality',
    subtitle: 'Nebiswera is a mechanism for converting existential chaos into structured reality',
    bridgeLabel: 'The Bridge',
    bridgeFrom: 'Knowing Yourself',
    bridgeFromLabel: 'Insight',
    bridgeTo: 'Creating Your Life',
    bridgeToLabel: 'Action',
    bridgeName: 'NEBISWERA',
    closing: 'Nebiswera — a technology of thinking to create your reality.',
  },
}

export function PersonalRealityOSSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Monitor className="w-8 h-8 md:w-10 md:h-10 text-white" />
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

  const BridgeDiagram = () => (
    <div className="max-w-4xl mx-auto mb-12 md:mb-16">
      <div className="relative flex items-center justify-center gap-4 md:gap-8">
        {/* Insight Box */}
        <div className="flex-1 max-w-xs">
          <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-neu-lg p-4 md:p-6 shadow-neu text-center">
            <Lightbulb className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="font-bold text-text-primary text-sm md:text-base">
              {t.bridgeFrom}
            </p>
            <p className="text-xs md:text-sm text-text-secondary mt-1">{t.bridgeFromLabel}</p>
          </div>
        </div>

        {/* Bridge Arrow */}
        <div className="flex flex-col items-center px-2 md:px-4">
          <span className="text-xs md:text-sm font-semibold text-primary-600 mb-2">
            {t.bridgeLabel}
          </span>
          <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-secondary-500 border-y-4 border-y-transparent" />
          </div>
          <div className="mt-2 px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full">
            <span className="text-white text-xs md:text-sm font-bold">{t.bridgeName}</span>
          </div>
        </div>

        {/* Action Box */}
        <div className="flex-1 max-w-xs">
          <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-neu-lg p-4 md:p-6 shadow-neu text-center">
            <Zap className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <p className="font-bold text-text-primary text-sm md:text-base">
              {t.bridgeTo}
            </p>
            <p className="text-xs md:text-sm text-text-secondary mt-1">{t.bridgeToLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const ClosingStatement = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="inline-block bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10 rounded-neu-lg px-8 py-6 shadow-neu border border-primary-200/30">
        <p className="text-xl md:text-2xl font-semibold text-text-primary">
          {t.closing}
        </p>
      </div>
    </div>
  )

  const BridgeImage = () => (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl rounded-neu-lg overflow-hidden shadow-neu-md">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/bridge.jpg"
          alt="Bridge"
          width={672}
          height={504}
          className="w-full h-auto"
          sizes="(max-width: 640px) 95vw, 672px"
        />
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50/50 to-neu-base relative overflow-hidden">
      {/* Subtle tech pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, #8B5CF6 1px, transparent 1px),
            linear-gradient(#8B5CF6 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
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

            {/* Bridge Diagram */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <BridgeDiagram />
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

            {/* Bridge Image */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <BridgeImage />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <BridgeDiagram />
            <ClosingStatement />
            <BridgeImage />
          </>
        )}
      </div>
    </section>
  )
}
