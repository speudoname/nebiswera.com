'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Brain, Target, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmailCaptureForm } from '@/components/ui'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  pillarsTitle: string
  pillars: Array<{
    icon: 'brain' | 'target' | 'heart'
    title: string
    description: string
  }>
  transformationTitle: string
  transformationText: string
  cta: string
}> = {
  ka: {
    pillarsTitle: 'სამი რამ რაც ხდება ვორქშოფის დროს',
    pillars: [
      {
        icon: 'brain',
        title: 'ნებისწერის თეორემის შესწავლა',
        description: 'სწავლობთ ნებისწერის თეორემას, ყველა ფორმულას და ინსტრუმენტს. 81 კონცეფტი და 18+ ვარჯიში რომლებიც პრაქტიკულად გამოიყენებ.',
      },
      {
        icon: 'target',
        title: 'საკუთარ თავში ჩაღრმავება და გამორკვევა',
        description: 'ღრმად იმუშავებთ საკუთარ თავზე, აღმოაჩენთ 45 რამეს საკუთარ თავთან დაკავშირებით, გაიგებთ რა გაკავებთ და რა გაძლიერებთ.',
      },
      {
        icon: 'heart',
        title: 'გამოცდილებითი პროცესები',
        description: 'მედიტაციები, ტრანსი, თვითშემეცნების პროცესები და სხვა გამოცდილებითი პრაქტიკები რომლებიც ცვლის შენს ცნობიერებას.',
      },
    ],
    transformationTitle: 'შედეგი',
    transformationText: 'პარასკევს შემოდიხართ ერთი სამყაროდან, ორშაბათს უკვე სხვაში ხართ. თქვენი ცნობიერება ირთვება, ყურადღება მაღლა არის, სავსე ხართ ინსაიტებით, თვითრწმენით და ძალით შეცვალოთ თქვენი ცხოვრება.',
    cta: 'გამოცხადება',
  },
  en: {
    pillarsTitle: 'Three Things That Happen During the Workshop',
    pillars: [
      {
        icon: 'brain',
        title: 'Learning Nebiswera Theorem',
        description: 'You learn the Nebiswera theorem, all formulas and tools. 81 concepts and 18+ exercises you\'ll use practically.',
      },
      {
        icon: 'target',
        title: 'Deep Dive Into Yourself',
        description: 'You work deeply on yourself, discover 45 things about yourself, understand what holds you back and what empowers you.',
      },
      {
        icon: 'heart',
        title: 'Experiential Processes',
        description: 'Meditations, trance, self-exploration processes and other experiential practices that transform your consciousness.',
      },
    ],
    transformationTitle: 'The Transformation',
    transformationText: 'You enter Friday from one world, by Monday you\'re in another. Your consciousness turns on, attention sharpens, you\'re full of insights, self-confidence, and power to change your life.',
    cta: 'Apply for Next Workshop',
  },
}

const iconMap = {
  brain: Brain,
  target: Target,
  heart: Heart,
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as any, // Smooth easing
    },
  },
}

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as any,
    },
  },
}

export function WorkshopThreeThings() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 pointer-events-none">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/nebiswera6.jpg"
          alt=""
          width={640}
          height={640}
          className="w-full h-full object-cover"
          priority={false}
          quality={50}
          sizes="100vw"
        />
      </div>
      {/* Primary color overlay */}
      <div className="absolute inset-0 bg-primary-50 opacity-65 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Three Pillars */}
        <div className="mb-12 md:mb-16">
          {isMounted ? (
            <motion.h3
              className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-8 md:mb-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={titleVariants}
            >
              {t.pillarsTitle}
            </motion.h3>
          ) : (
            <h3 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-8 md:mb-10">
              {t.pillarsTitle}
            </h3>
          )}
          {isMounted ? (
            <motion.div
              className="grid md:grid-cols-3 gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              {t.pillars.map((pillar, index) => {
                const Icon = iconMap[pillar.icon]
                return (
                  <motion.div
                    key={index}
                    className="bg-neu-base rounded-neu-md p-6 md:p-8 text-center"
                    style={{ boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.1)' }}
                    variants={itemVariants}
                  >
                  <div className="w-16 h-16 mx-auto mb-4 md:mb-6 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                    <Icon className="w-8 h-8 text-primary-600" />
                  </div>
                  <h4 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                    {pillar.title}
                  </h4>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                      {pillar.description}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {t.pillars.map((pillar, index) => {
                const Icon = iconMap[pillar.icon]
                return (
                  <div
                    key={index}
                    className="bg-neu-base rounded-neu-md p-6 md:p-8 text-center"
                    style={{ boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.1)' }}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 md:mb-6 rounded-full bg-primary-100 flex items-center justify-center shadow-neu-sm">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h4 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                      {pillar.title}
                    </h4>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Transformation Box */}
        {isMounted ? (
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg mb-8 md:mb-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={itemVariants}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {t.transformationTitle}
            </h3>
            <p className="text-base md:text-lg text-white/95 leading-relaxed max-w-3xl mx-auto">
              {t.transformationText}
            </p>
          </motion.div>
        ) : (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg mb-8 md:mb-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {t.transformationTitle}
            </h3>
            <p className="text-base md:text-lg text-white/95 leading-relaxed max-w-3xl mx-auto">
              {t.transformationText}
            </p>
          </div>
        )}

        {/* CTA */}
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={itemVariants}
          >
            <EmailCaptureForm variant="inline" />
          </motion.div>
        ) : (
          <EmailCaptureForm variant="inline" />
        )}
      </div>
    </section>
  )
}
