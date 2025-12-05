'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'
import { HeroVideoPlayer } from './HeroVideoPlayer'

const HERO_POSTER = 'https://vz-1693fee0-2ad.b-cdn.net/973721e6-63ae-4773-877f-021b677f08f7/thumbnail_8f42b11e.jpg'

const content: Record<Locale, {
  eyebrow: string
  titlePart1: string
  titlePart2: string
  titlePart2Bold: string
  titlePart2Regular: string
  titlePart2Emphasis: string
  subtitle: string
  ctaBold: string
  ctaRegular: string
  ctaAccent: string
  ctaAccentBold: string
  scrollButton: string
}> = {
  ka: {
    eyebrow: 'შენი არჩევანია',
    titlePart1: 'მზად ხარ?...',
    titlePart2: '...იცხოვრო ისე რომ -',
    titlePart2Bold: '',
    titlePart2Regular: '',
    titlePart2Emphasis: 'არაფერი გზღუდავდეს',
    subtitle: '...რომ ცხადად გააცნობიერო - შენი ნების ძალა?',
    ctaBold: 'გაინტერესებს მარტივი ფორმულა ->',
    ctaRegular: 'რომელიც შეცვლის შენს მომავალს? ->',
    ctaAccent: 'ისწავლე',
    ctaAccentBold: 'ნებისწერის საოცარი თეორემა!',
    scrollButton: 'გაიგე მეტი ნებისწერაზე',
  },
  en: {
    eyebrow: 'It\'s Your Choice',
    titlePart1: 'Are you ready?...',
    titlePart2: 'to make your life exactly as',
    titlePart2Bold: '',
    titlePart2Regular: '',
    titlePart2Emphasis: 'you would like it?',
    subtitle: 'Are you ready to reclaim the power that has never been taken from anyone?',
    ctaBold: 'Then you need to learn ->',
    ctaRegular: 'the Nebiswera theorem',
    ctaAccent: '',
    ctaAccentBold: '',
    scrollButton: 'Click if you are ready',
  },
}

export function TransformationPromiseSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const scrollToHero = () => {
    const heroSection = document.querySelector('.hero-section')
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const TitleOnly = () => (
    <div className="text-center mb-2 md:mb-6">
      <h2 className="leading-none">
        <span className="block font-bold text-[5.5rem] sm:text-8xl md:text-8xl lg:text-9xl text-primary-600">
          {t.titlePart1}
        </span>
      </h2>
    </div>
  )

  const SubheadlineOnly = () => (
    <div className="text-center mb-12 md:mb-16">
      <h3 className="leading-none text-[3rem] sm:text-6xl md:text-6xl lg:text-7xl text-text-primary">
        <span className="font-normal">{t.titlePart2}</span>{' '}
        <span className="font-bold">{t.titlePart2Bold}</span>{' '}
        <span className="font-normal text-primary-600">{t.titlePart2Emphasis}</span>
      </h3>
    </div>
  )

  const AfterImageContent = () => (
    <div className="text-center mt-12 md:mt-16">
      <p className="text-2xl md:text-3xl leading-tight mb-3 md:mb-6">
        <span className="font-bold text-text-primary">{t.ctaBold}</span>{' '}
        <span className="font-normal text-text-primary">{t.ctaRegular}</span>{' '}
        <span className="font-normal text-primary-600">{t.ctaAccent}</span>{' '}
        <span className="font-bold text-primary-600">{t.ctaAccentBold}</span>
      </p>
      <p className="text-lg md:text-xl text-text-primary">
        {t.subtitle}
      </p>
    </div>
  )

  const ImageContent = () => (
    <div className="mt-12 md:mt-16 flex justify-center">
      <div className="w-48 h-48 md:w-64 md:h-64 rounded-neu-lg overflow-hidden shadow-neu-lg">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/areyouready.jpg"
          alt="Are you ready?"
          width={400}
          height={400}
          className="w-full h-full object-cover"
          quality={75}
          sizes="(max-width: 768px) 192px, 256px"
        />
      </div>
    </div>
  )

  return (
    <section className="pt-16 pb-8 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-base to-neu-light relative overflow-hidden">
      {/* Background artwork - subtle */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/areyouready.jpg"
          alt=""
          width={400}
          height={400}
          className="w-full h-full object-cover"
          priority={false}
          quality={75}
          sizes="(max-width: 768px) 192px, 256px"
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {isMounted ? (
          <>
            {/* Title: მზად ხარ?... */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <TitleOnly />
            </motion.div>

            {/* Subheadline: ...იცხოვრო ისე რომ - არაფერი გზღუდავდეს */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <SubheadlineOnly />
            </motion.div>

            {/* Video Player */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
              className="flex justify-center"
            >
              <div className="w-full max-w-4xl rounded-neu-lg overflow-hidden shadow-neu-lg">
                <div className="relative aspect-video">
                  <img
                    src={HERO_POSTER}
                    alt=""
                    width={1920}
                    height={1080}
                    className="absolute inset-0 w-full h-full object-cover"
                    fetchPriority="high"
                  />
                  <HeroVideoPlayer locale={locale} />
                </div>
              </div>
            </motion.div>

            {/* Scroll to Hero Button */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
              className="flex justify-center mt-8 md:mt-12"
            >
              <button
                onClick={scrollToHero}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg md:text-xl px-8 md:px-12 py-4 md:py-5 rounded-neu-lg shadow-neu-lg hover:shadow-neu-hover active:shadow-neu-pressed transition-all"
              >
                {t.scrollButton}
              </button>
            </motion.div>

          </>
        ) : (
          <>
            <TitleOnly />
            <SubheadlineOnly />
            <ImageContent />
          </>
        )}
      </div>
    </section>
  )
}
