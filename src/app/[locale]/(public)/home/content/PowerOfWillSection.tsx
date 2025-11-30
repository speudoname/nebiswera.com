'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  titlePart1: string
  titlePart2a: string
  titlePart2b: string
  titlePart3: string
  titlePart4: string
  subtitle1: string
  subtitle2: string
}> = {
  ka: {
    titlePart1: 'თუკი ათავისუფლებ',
    titlePart2a: 'შენში',
    titlePart2b: 'ნების ძალას,',
    titlePart3: 'შეძლებ მოახდინო',
    titlePart4: 'ცვლილებები',
    subtitle1: 'თუკი გეცოდინება - ყველაფერი გამოგივა',
    subtitle2: 'ნებისწერის თეორემა გასწავლის ყველა იმ კანონზომიერებას რომელზედაც დამოკიდებულია შენი ნება',
  },
  en: {
    titlePart1: 'If you liberate',
    titlePart2a: 'within you',
    titlePart2b: 'the power of your will,',
    titlePart3: 'you can make',
    titlePart4: 'changes',
    subtitle1: 'If you know - everything will work out',
    subtitle2: 'The Nebiswera theorem teaches all the patterns on which your will depends',
  },
}

export function PowerOfWillSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const FeaturedImageCard = () => (
    <div className="flex justify-center mb-8">
      <div className="w-40 h-40 md:w-48 md:h-48 rounded-neu overflow-hidden shadow-neu-md">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/areyouready.jpg"
          alt="Are you ready?"
          width={256}
          height={256}
          className="w-full h-full object-cover"
          quality={75}
          sizes="(max-width: 768px) 160px, 192px"
        />
      </div>
    </div>
  )

  const ContentOnly = () => (
    <div className="text-center">
      <h2 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl text-text-primary mb-6 md:mb-8 leading-none">
        <span className="font-normal">{t.titlePart1} </span>
        <span className="font-bold underline">{t.titlePart2a}</span>
        <span className="font-bold"> {t.titlePart2b} </span>
        <span className="font-bold text-primary-600">{t.titlePart3} </span>
        <span className="font-normal text-primary-600">{t.titlePart4}</span>
      </h2>
      <div className="space-y-3 md:space-y-4">
        <p className="text-2xl md:text-3xl lg:text-4xl text-text-primary font-semibold leading-tight">
          {t.subtitle1}
        </p>
        <p className="text-xl md:text-2xl lg:text-3xl text-text-secondary font-normal leading-tight">
          {t.subtitle2}
        </p>
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base relative overflow-hidden">
      {/* Background artwork - subtle */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <img
          src="https://nebiswera-cdn.b-cdn.net/images/nebiswera3.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {isMounted ? (
          <>
            {/* Small card image on top */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <FeaturedImageCard />
            </motion.div>

            {/* Main content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <ContentOnly />
            </motion.div>
          </>
        ) : (
          <>
            <FeaturedImageCard />
            <ContentOnly />
          </>
        )}
      </div>
    </section>
  )
}
