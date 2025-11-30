'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Heart, ArrowRight, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  stats: Array<{
    number: string
    label: string
  }>
  cta: string
  viewAll: string
}> = {
  ka: {
    eyebrow: 'შედეგები',
    title: 'ადამიანები რომლებმაც აღმოაჩინეს თავიანთი ძალა',
    subtitle: 'რეალური ისტორიები რეალური ადამიანებისგან',
    stats: [
      { number: '500+', label: 'მოსწავლე' },
      { number: '4.9/5', label: 'შეფასება' },
      { number: '95%', label: 'გირჩევენ' },
    ],
    cta: 'ნახე ყველა ისტორია',
    viewAll: 'ყველა შედეგის ნახვა',
  },
  en: {
    eyebrow: 'Results',
    title: 'People Who Have Discovered Their Power',
    subtitle: 'Real stories from real people',
    stats: [
      { number: '500+', label: 'Students' },
      { number: '4.9/5', label: 'Rating' },
      { number: '95%', label: 'Recommend' },
    ],
    cta: 'See All Stories',
    viewAll: 'View All Results',
  },
}

export function SocialProofSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <p className="eyebrow text-primary-600 mb-4">
        {t.eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3">
        {t.title}
      </h2>
      <p className="text-lg md:text-xl text-text-secondary">
        {t.subtitle}
      </p>
    </div>
  )

  const StatsContent = () => (
    <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
      {t.stats.map((stat, index) => (
        <div
          key={index}
          className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu text-center"
        >
          <div className="flex justify-center mb-3">
            <Star className="w-8 h-8 md:w-10 md:h-10 text-primary-600 fill-primary-600" />
          </div>
          <div className="text-2xl md:text-4xl font-bold text-primary-600 mb-2">
            {stat.number}
          </div>
          <div className="text-sm md:text-base text-text-secondary">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )

  const TestimonialCard = () => (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md text-center mb-8">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-200 flex items-center justify-center shadow-neu-sm">
          <Heart className="w-8 h-8 md:w-10 md:h-10 text-primary-600 fill-primary-600" />
        </div>
      </div>
      <p className="text-lg md:text-xl text-text-primary leading-relaxed max-w-2xl mx-auto mb-4">
        {locale === 'ka'
          ? 'აღმოაჩინე როგორ შეცვალეს ადამიანებმა თავიანთი ცხოვრება ნებისწერის დახმარებით. მათი ისტორიები შთაგონებას მოგცემს შენი გზის დასაწყებად.'
          : 'Discover how people have changed their lives with the help of Nebiswera. Their stories will inspire you to start your own journey.'}
      </p>
    </div>
  )

  const CTAContent = () => (
    <div className="text-center">
      <Link href={`/${locale}/love`}>
        <Button size="lg" rightIcon={ArrowRight} variant="primary">
          {t.viewAll}
        </Button>
      </Link>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-base to-neu-light">
      <div className="max-w-5xl mx-auto">
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

            {/* Stats Grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
              className="grid grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16"
            >
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-neu-base rounded-neu-md p-6 md:p-8 shadow-neu text-center"
                  variants={staggerItemVariants}
                >
                  <div className="flex justify-center mb-3">
                    <Star className="w-8 h-8 md:w-10 md:h-10 text-primary-600 fill-primary-600" />
                  </div>
                  <div className="text-2xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base text-text-secondary">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Testimonials Preview Card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <TestimonialCard />
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <CTAContent />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <StatsContent />
            <TestimonialCard />
            <CTAContent />
          </>
        )}
      </div>
    </section>
  )
}
