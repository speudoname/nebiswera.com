'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { BunnyImage } from '@/components/ui/BunnyImage'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  secretBox: {
    title: string
    description: string
  }
}> = {
  ka: {
    eyebrow: 'საიდუმლო',
    title: 'ნებისწერა არის საიდუმლო',
    subtitle: 'არა იმიტომ რომ ვინმე მალავს, არამედ იმიტომ რომ ვერავინ ხედავს',
    secretBox: {
      title: 'ნებისწერა არის შინაგანი უნარი და ძალა',
      description: '99% ადამიანს ვერ ამჩნევს. ეს ძალა ყოველთვის შენთანაა, მაგრამ უმეტესობამ არ იცის როგორ გამოიყენოს.',
    },
  },
  en: {
    eyebrow: 'The Secret',
    title: 'Nebiswera is a Secret',
    subtitle: 'Not because someone hides it, but because no one sees it',
    secretBox: {
      title: 'Nebiswera is an Inner Ability and Power',
      description: '99% of people don\'t notice it. This power is always with you, but most don\'t know how to use it.',
    },
  },
}

export function SecretRevealSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center">
      <p className="eyebrow text-primary-600 mb-3">
        {t.eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
        {t.title}
      </h2>
      <p className="text-lg md:text-xl text-text-secondary italic">
        {t.subtitle}
      </p>
    </div>
  )

  const TextContent = () => (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md">
      <h3 className="text-xl md:text-2xl font-bold text-primary-600 mb-4">
        {t.secretBox.title}
      </h3>
      <p className="text-base md:text-lg text-text-primary leading-relaxed">
        {t.secretBox.description}
      </p>
    </div>
  )

  const ImageContent = () => (
    <div className="rounded-neu-lg overflow-hidden shadow-neu-lg bg-gradient-to-br from-amber-50 to-amber-100 p-4 max-w-md">
      <BunnyImage
        src="https://nebiswera-cdn.b-cdn.net/images/door.jpg"
        alt="Secret artwork - figure at doorway"
        width={640}
        height={960}
        className="w-full h-auto"
        priority
        quality={75}
        sizes="(max-width: 768px) 90vw, 448px"
      />
    </div>
  )

  return (
    <section id="learn-more" className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50/50 to-neu-base relative overflow-hidden">
      {/* Background artwork - subtle */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/door.jpg"
          alt=""
          width={640}
          height={960}
          className="w-full h-full object-cover"
          priority={false}
          quality={75}
          sizes="(max-width: 768px) 90vw, 448px"
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Two columns side by side, vertically centered */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center min-h-[600px]">
          {/* Left Column - Content */}
          <div className="w-full md:w-1/2 flex items-center order-1">
            {isMounted ? (
              <div className="w-full space-y-6">
                {/* Header */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={defaultViewport}
                  variants={fadeUpVariants}
                >
                  <HeaderContent />
                </motion.div>

                {/* Content box */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={defaultViewport}
                  variants={fadeUpVariants}
                >
                  <TextContent />
                </motion.div>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <HeaderContent />
                <TextContent />
              </div>
            )}
          </div>

          {/* Right Column - Artwork */}
          <div className="w-full md:w-1/2 flex items-center justify-center order-2">
            {isMounted ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={defaultViewport}
                variants={scaleUpVariants}
              >
                <ImageContent />
              </motion.div>
            ) : (
              <ImageContent />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
