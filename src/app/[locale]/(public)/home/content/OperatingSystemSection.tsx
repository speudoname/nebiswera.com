'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Cpu, Layers, Code2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  tagline: string
  title: string
  subtitle: string
  description: string
  layers: {
    icon: 'surface' | 'middleware' | 'core'
    title: string
    description: string
  }[]
  conclusion: string
}> = {
  ka: {
    tagline: 'რეალობის მართვის',
    title: 'ოპერაციული სისტემა',
    subtitle: 'ნებისწერა არის საფუძველი, რომელზეც ყველაფერი დანარჩენი აშენებულია',
    description: 'როგორც კომპიუტერის ოპერაციული სისტემა მართავს ყველა პროგრამას, ასევე არსებობს კანონები, რომლებიც მართავს და ქმნის რეალობას. ნებისწერა გასწავლის ამ კანონებს.',
    layers: [
      {
        icon: 'surface',
        title: 'ზედაპირი',
        description: 'ყოველდღიური გამოცდილება, მოვლენები, გარემოებები — ის, რასაც ხედავ და განიცდი.',
      },
      {
        icon: 'middleware',
        title: 'შუალედური შრე',
        description: 'აზროვნება, რწმენები, ემოციები — ის, რაც აფორმებს შენს აღქმას.',
      },
      {
        icon: 'core',
        title: 'ბირთვი',
        description: 'ნება და არჩევანი — ფუნდამენტური კანონები, რომლებიც ქმნის რეალობას.',
      },
    ],
    conclusion: 'ნებისწერა მუშაობს ბირთვის დონეზე — სადაც რეალობა იქმნება.',
  },
  en: {
    tagline: 'The Operating System',
    title: 'For Reality',
    subtitle: 'Nebiswera is the foundation on which everything else is built',
    description: 'Just as a computer\'s operating system manages all programs, there are laws that govern and create reality. Nebiswera teaches you these laws.',
    layers: [
      {
        icon: 'surface',
        title: 'Surface',
        description: 'Daily experiences, events, circumstances — what you see and experience.',
      },
      {
        icon: 'middleware',
        title: 'Middleware',
        description: 'Thinking, beliefs, emotions — what shapes your perception.',
      },
      {
        icon: 'core',
        title: 'Core',
        description: 'Will and choice — the fundamental laws that create reality.',
      },
    ],
    conclusion: 'Nebiswera operates at the core level — where reality is created.',
  },
}

const iconMap = {
  surface: Sparkles,
  middleware: Code2,
  core: Cpu,
}

export function OperatingSystemSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="inline-flex items-center justify-center gap-4 mb-6">
        <Layers className="w-12 h-12 md:w-16 md:h-16 text-primary-600" />
      </div>
      <p className="text-lg md:text-xl text-primary-600 font-medium mb-2">
        {t.tagline}
      </p>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-4">
        {t.title}
      </h2>
      <p className="text-xl md:text-2xl text-text-secondary mb-6">
        {t.subtitle}
      </p>
      <p className="text-base md:text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed">
        {t.description}
      </p>
    </div>
  )

  const LayersVisualization = () => (
    <div className="relative max-w-2xl mx-auto mb-12 md:mb-16">
      {/* Layers stack */}
      <div className="space-y-4">
        {t.layers.map((layer, index) => {
          const Icon = iconMap[layer.icon]
          const isCore = layer.icon === 'core'

          return (
            <div
              key={index}
              className={`
                relative rounded-neu-lg p-5 md:p-6 transition-all
                ${isCore
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-neu-darkbg'
                  : 'bg-neu-light shadow-neu border border-neu-dark/20'
                }
              `}
              style={{
                marginLeft: `${(2 - index) * 20}px`,
                marginRight: `${(2 - index) * 20}px`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0
                  ${isCore ? 'bg-white/20' : 'bg-primary-100'}
                `}>
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isCore ? 'text-white' : 'text-primary-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg md:text-xl font-bold mb-1 ${isCore ? 'text-white' : 'text-text-primary'}`}>
                    {layer.title}
                  </h3>
                  <p className={`text-sm md:text-base ${isCore ? 'text-white/90' : 'text-text-secondary'}`}>
                    {layer.description}
                  </p>
                </div>
              </div>

              {/* Connection line */}
              {index < t.layers.length - 1 && (
                <div className="absolute left-1/2 -bottom-4 w-px h-4 bg-primary-300 -translate-x-1/2" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const ConclusionBox = () => (
    <div className="bg-neu-dark/10 rounded-neu-lg p-6 md:p-8 text-center border-2 border-primary-500/30">
      <p className="text-lg md:text-xl font-medium text-text-primary">
        {t.conclusion}
      </p>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-base to-neu-light">
      <div className="max-w-4xl mx-auto">
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
              className="relative max-w-2xl mx-auto mb-12 md:mb-16"
            >
              <div className="space-y-4">
                {t.layers.map((layer, index) => {
                  const Icon = iconMap[layer.icon]
                  const isCore = layer.icon === 'core'

                  return (
                    <motion.div
                      key={index}
                      variants={staggerItemVariants}
                      className={`
                        relative rounded-neu-lg p-5 md:p-6 transition-all
                        ${isCore
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-neu-darkbg'
                          : 'bg-neu-light shadow-neu border border-neu-dark/20'
                        }
                      `}
                      style={{
                        marginLeft: `${(2 - index) * 20}px`,
                        marginRight: `${(2 - index) * 20}px`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0
                          ${isCore ? 'bg-white/20' : 'bg-primary-100'}
                        `}>
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isCore ? 'text-white' : 'text-primary-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg md:text-xl font-bold mb-1 ${isCore ? 'text-white' : 'text-text-primary'}`}>
                            {layer.title}
                          </h3>
                          <p className={`text-sm md:text-base ${isCore ? 'text-white/90' : 'text-text-secondary'}`}>
                            {layer.description}
                          </p>
                        </div>
                      </div>

                      {index < t.layers.length - 1 && (
                        <div className="absolute left-1/2 -bottom-4 w-px h-4 bg-primary-300 -translate-x-1/2" />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <ConclusionBox />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <LayersVisualization />
            <ConclusionBox />
          </>
        )}
      </div>
    </section>
  )
}
