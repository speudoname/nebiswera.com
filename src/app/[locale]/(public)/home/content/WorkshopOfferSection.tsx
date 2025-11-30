'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Calendar, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  scheduleTitle: string
  schedule: Array<{ day: string, time: string }>
  followUp: string
  stats: Array<{ number: string, label: string }>
}> = {
  ka: {
    eyebrow: '3-დღიანი ვორქშოპი',
    title: '29 საათი, რომელიც შეცვლის შენს ცხოვრებას',
    subtitle: 'ინტენსიური პროგრამა, სადაც მთელი მაგია ხდება',
    scheduleTitle: 'განრიგი',
    schedule: [
      { day: 'პარასკევი', time: '19:00 - 23:30' },
      { day: 'შაბათი', time: '11:00 - 23:00' },
      { day: 'კვირა', time: '11:00 - 23:00' },
    ],
    followUp: 'ოთხშაბათს შემაჯამებელი შეხვედრა',
    stats: [
      { number: '29', label: 'საათი' },
      { number: '18+', label: 'ვარჯიში' },
      { number: '81', label: 'კონცეფტი' },
      { number: '45', label: 'აღმოჩენა' },
    ],
  },
  en: {
    eyebrow: '3-Day Workshop',
    title: '29 Hours That Will Change Your Life',
    subtitle: 'Intensive program where all the magic happens',
    scheduleTitle: 'Schedule',
    schedule: [
      { day: 'Friday', time: '19:00 - 23:30' },
      { day: 'Saturday', time: '11:00 - 23:00' },
      { day: 'Sunday', time: '11:00 - 23:00' },
    ],
    followUp: 'Follow-up meeting on Wednesday',
    stats: [
      { number: '29', label: 'Hours' },
      { number: '18+', label: 'Exercises' },
      { number: '81', label: 'Concepts' },
      { number: '45', label: 'Discoveries' },
    ],
  },
}

export function WorkshopOfferSection() {
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

  const ScheduleContent = () => (
    <div className="bg-neu-base rounded-neu-lg p-6 md:p-8 shadow-neu mb-8 md:mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-neu bg-primary-100 flex items-center justify-center shadow-neu-sm">
          <Calendar className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-text-primary">
          {t.scheduleTitle}
        </h3>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {t.schedule.map((day, index) => (
          <div key={index} className="bg-neu-light rounded-neu p-4 shadow-neu-inset text-center">
            <div className="font-semibold text-primary-600 mb-1">{day.day}</div>
            <div className="text-text-secondary text-sm flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{day.time}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-text-secondary italic">
        + {t.followUp}
      </p>
    </div>
  )

  const StatsContent = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
      {t.stats.map((stat, index) => (
        <div key={index} className="bg-neu-base rounded-neu p-6 shadow-neu text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
            {stat.number}
          </div>
          <div className="text-sm md:text-base text-text-secondary">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-primary-50 via-neu-base to-primary-50">
      <div className="max-w-6xl mx-auto">
        {isMounted ? (
          <>
            {/* Header - animated */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <HeaderContent />
            </motion.div>

            {/* Schedule Card - animated */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <ScheduleContent />
            </motion.div>

            {/* Stats Grid - staggered animation */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={staggerContainerVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6"
            >
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="bg-neu-base rounded-neu p-6 shadow-neu text-center"
                  variants={staggerItemVariants}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base text-text-secondary">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <ScheduleContent />
            <StatsContent />
          </>
        )}
      </div>
    </section>
  )
}
