'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { Bird, KeyRound, Unlock } from 'lucide-react'
import { BunnyImage } from '@/components/ui/BunnyImage'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, scaleUpVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  eyebrow: string
  title: string
  titleAccentBold: string
  titleAccentNormal: string
  keyInsight: string
  keyInsightDescription: string
  closing: string
}> = {
  ka: {
    eyebrow: 'თუ შეძლებ ფლობდე რეალობას და იცოდე მისი მართვის მექანიზმები',
    title: 'იქნები შინაგანად თავისუფალი',
    titleAccentBold: 'და შეძლებ შენი',
    titleAccentNormal: 'პოტენციალის სრულად რეალიზებას.',
    keyInsight: 'გასაღები',
    keyInsightDescription: 'რეალობის მექანიზმების გაგება გათავისუფლებს პარალიზისგან. როცა იცი როგორ მუშაობს — აღარ გეშინია. როცა აღარ გეშინია — მოძრაობ.',
    closing: 'იგრძენი თავი რეალურად. იგრძენი თავი თავისუფლად.',
  },
  en: {
    eyebrow: 'If you can own reality and know its mechanisms',
    title: 'You will be internally free',
    titleAccentBold: 'and able to fully',
    titleAccentNormal: 'realize your potential.',
    keyInsight: 'The Key',
    keyInsightDescription: 'Understanding how reality works frees you from paralysis. When you know how it works — you\'re no longer afraid. When you\'re no longer afraid — you move.',
    closing: 'Feel real. Feel free.',
  },
}

export function InnerFreedomSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
        <Bird className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      <span className="inline-block text-primary-600 font-semibold text-lg md:text-xl mb-4 tracking-wide uppercase">
        {t.eyebrow}
      </span>
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-1 leading-none">
        {t.title}
      </h2>
      <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-primary-600 mb-8 leading-none">
        <span className="font-bold">{t.titleAccentBold}</span>{' '}
        <span className="font-normal">{t.titleAccentNormal}</span>
      </h2>
    </div>
  )

  const KeyInsightBlock = () => (
    <div className="max-w-3xl mx-auto mb-12 md:mb-16">
      <div className="relative bg-gradient-to-br from-primary-600 to-secondary-600 rounded-neu-lg p-8 md:p-10 shadow-lg overflow-hidden">
        {/* Decorative unlock icon */}
        <div className="absolute -right-4 -top-4 opacity-10">
          <Unlock className="w-32 h-32 text-white" />
        </div>

        <div className="relative z-10 flex items-start gap-4 md:gap-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              {t.keyInsight}
            </h3>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.keyInsightDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const ClosingStatement = () => (
    <div className="text-center mb-12 md:mb-16">
      <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
        {t.closing}
      </p>
    </div>
  )

  const KeyImage = () => (
    <div className="flex justify-center">
      <div className="max-w-sm rounded-neu-lg overflow-hidden shadow-neu-md">
        <BunnyImage
          src="https://nebiswera-cdn.b-cdn.net/images/key.jpg"
          alt="The Key to Inner Freedom"
          width={400}
          height={400}
          className="w-full h-auto"
          sizes="(max-width: 640px) 280px, 384px"
        />
      </div>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-white relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary-500/5 to-secondary-500/5 blur-3xl" />
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

            {/* Key Insight */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <KeyInsightBlock />
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

            {/* Key Image */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={scaleUpVariants}
            >
              <KeyImage />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <KeyInsightBlock />
            <ClosingStatement />
            <KeyImage />
          </>
        )}
      </div>
    </section>
  )
}
