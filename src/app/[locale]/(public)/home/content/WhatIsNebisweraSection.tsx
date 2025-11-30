'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Locale } from '@/i18n/config'
import { fadeUpVariants, staggerContainerVariants, staggerItemVariants, defaultViewport } from '@/lib/animations'

const content: Record<Locale, {
  title: string
  description: string
  questions: string[]
  answer: string
}> = {
  ka: {
    title: 'რა არის ნებისწერა?',
    description: 'ნებისწერა არის 3-დღიანი ვორქშოფი, რომელიც გასწავლის როგორ შეგნებულად აირჩიო შენი ცხოვრების მიმართულება, იმის გაგებით რა არის შენი გადაწყვეტილებების მიღმა.',
    questions: [
      'ფილოსოფია?',
      'მეთოდი?',
      'ფორმულა?',
      'ჩარჩო?',
      'ტრენინგი გადაწყვეტილებების მიღებაზე?',
      'ვორქშოფი თვითშემეცნებაზე?',
      'სრულიად სხვა რამ?',
    ],
    answer: 'ეს ყველაფერია ერთდროულად — და რაღაც მეტი.',
  },
  en: {
    title: 'What exactly is Nebiswera?',
    description: 'Nebiswera is a 3-day workshop that teaches you how to consciously choose your life\'s direction by understanding the hidden mechanics behind your decisions.',
    questions: [
      'A philosophy?',
      'A method?',
      'A formula?',
      'A framework?',
      'A training on how to make decisions?',
      'A workshop on self-awareness?',
      'Or something completely different?',
    ],
    answer: 'It\'s all of these — and something more.',
  },
}

export function WhatIsNebisweraSection() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const HeaderContent = () => (
    <div className="text-center mb-12 md:mb-16">
      <div className="inline-flex items-center gap-3 mb-6">
        <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-primary-600" />
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary">
          {t.title}
        </h2>
      </div>
      <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
        {t.description}
      </p>
    </div>
  )

  const QuestionsGrid = () => (
    <div className="grid sm:grid-cols-2 gap-4 md:gap-5 mb-12">
      {t.questions.map((question, index) => (
        <div
          key={index}
          className="bg-neu-light rounded-neu-md p-5 md:p-6 shadow-neu-sm flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
          <p className="text-text-primary text-base md:text-lg">
            {question}
          </p>
        </div>
      ))}
    </div>
  )

  const AnswerBox = () => (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-neu-lg p-8 md:p-10 shadow-neu-darkbg text-center">
      <p className="text-2xl md:text-3xl font-bold text-white">
        {t.answer}
      </p>
    </div>
  )

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base">
      <div className="max-w-5xl mx-auto">
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
              className="grid sm:grid-cols-2 gap-4 md:gap-5 mb-12"
            >
              {t.questions.map((question, index) => (
                <motion.div
                  key={index}
                  className="bg-neu-light rounded-neu-md p-5 md:p-6 shadow-neu-sm flex items-center gap-3"
                  variants={staggerItemVariants}
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                  <p className="text-text-primary text-base md:text-lg">
                    {question}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={defaultViewport}
              variants={fadeUpVariants}
            >
              <AnswerBox />
            </motion.div>
          </>
        ) : (
          <>
            <HeaderContent />
            <QuestionsGrid />
            <AnswerBox />
          </>
        )}
      </div>
    </section>
  )
}
