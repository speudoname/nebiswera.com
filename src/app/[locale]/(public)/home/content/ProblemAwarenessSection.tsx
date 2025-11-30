'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  description: string
  painPoints: string[]
}> = {
  ka: {
    eyebrow: 'იცნობ ამ შეგრძნებას?',
    title: 'შენი ცხოვრება ისეთი არაა, როგორიც გენდომებოდა?',
    description: 'მიუხედავად იმისა, რომ იცი, რომ ყველაფერი შენზეა დამოკიდებული...',
    painPoints: [
      'იცი რა გინდა, მაგრამ ვერ ახერხებ',
      'იწყებ, მაგრამ ვერ აგრძელებ',
      'გადაწყვეტილებები მიგიღია, მაგრამ ვერ ასრულებ',
      'გრძნობ რომ რაღაც გაჩერებს, მაგრამ ვერ ხვდები რა',
    ],
  },
  en: {
    eyebrow: 'Do you recognize this feeling?',
    title: 'Is your life not what you wanted it to be?',
    description: 'Even though you know everything depends on you...',
    painPoints: [
      'You know what you want, but can\'t make it happen',
      'You start, but can\'t continue',
      'You make decisions, but don\'t follow through',
      'You feel something is holding you back, but can\'t tell what',
    ],
  },
}

export function ProblemAwarenessSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-10 md:mb-12">
      <p className="eyebrow text-primary-600 mb-4">
        {t.eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4">
        {t.title}
      </h2>
      <p className="text-lg md:text-xl text-text-secondary">
        {t.description}
      </p>
    </div>
  )

  const GridContent = () => (
    <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
      {t.painPoints.map((point, index) => (
        <div
          key={index}
          className="bg-neu-light rounded-neu p-5 md:p-6 shadow-neu-inset flex items-start gap-3"
        >
          <div className="flex-shrink-0 mt-1">
            <AlertCircle className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-text-primary text-sm md:text-base">
            {point}
          </p>
        </div>
      ))}
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-base to-neu-light relative overflow-hidden">
      {/* Background artwork - subtle */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/frustration.jpg"
          alt=""
          width={640}
          height={640}
          className="w-full h-full object-cover"
          priority={false}
          quality={50}
          sizes="100vw"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
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
              className="grid sm:grid-cols-2 gap-4 md:gap-6"
            >
              {t.painPoints.map((point, index) => (
                <motion.div
                  key={index}
                  className="bg-neu-light rounded-neu p-5 md:p-6 shadow-neu-inset flex items-start gap-3"
                  variants={staggerItemVariants}
                >
                  <div className="flex-shrink-0 mt-1">
                    <AlertCircle className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="text-text-primary text-sm md:text-base">
                    {point}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <GridContent />
          </>
        )}
      </div>
    </section>
  )
}
