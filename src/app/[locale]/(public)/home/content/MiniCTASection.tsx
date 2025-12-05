'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { EmailCaptureForm } from '@/components/ui'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, defaultViewport } from '@/lib/animations'

const variants: Record<'discover' | 'test', Record<Locale, {
  title: string
  subtitle: string
}>> = {
  discover: {
    ka: {
      title: 'დაიწყე საკუთარი თავის აღმოჩენით',
      subtitle: 'შეიყვანე ელფოსტა და მიიღე პირველი ნაბიჯი',
    },
    en: {
      title: 'Start by Discovering Yourself',
      subtitle: 'Enter your email and take the first step',
    },
  },
  test: {
    ka: {
      title: 'გაიგე შენთვის არის თუ არა',
      subtitle: 'გაიარე მოკლე ტესტი და მიიღე პასუხი',
    },
    en: {
      title: 'Find Out If This Is For You',
      subtitle: 'Take a quick test and get your answer',
    },
  },
}

interface MiniCTASectionProps {
  variant?: 'discover' | 'test'
}

export function MiniCTASection({ variant = 'discover' }: MiniCTASectionProps) {
  const locale = useLocale() as Locale
  const t = variants[variant][locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const Content = () => (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
      <div className="text-center md:text-left">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
          {t.title}
        </h3>
        <p className="text-sm md:text-base text-white/80">
          {t.subtitle}
        </p>
      </div>
      <div className="w-full md:w-auto md:min-w-[320px]">
        <EmailCaptureForm variant="inline" />
      </div>
    </div>
  )

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-primary-600 to-primary-700">
      <div className="max-w-5xl mx-auto">
        {isMounted ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeUpVariants}
          >
            <Content />
          </motion.div>
        ) : (
          <Content />
        )}
      </div>
    </section>
  )
}
