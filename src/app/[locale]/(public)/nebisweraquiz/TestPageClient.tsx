'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, CheckCircle, Target, Compass, Sparkles } from 'lucide-react'
import type { Locale } from '@/i18n/config'

interface Question {
  id: number
  question: string
  options: {
    text: string
    score: number
  }[]
}

const content: Record<Locale, {
  title: string
  subtitle: string
  startButton: string
  nextButton: string
  prevButton: string
  submitButton: string
  questionOf: string
  resultsTitle: string
  resultsSubtitle: string
  scoreLabels: {
    high: { title: string; description: string }
    medium: { title: string; description: string }
    low: { title: string; description: string }
  }
  ctaTitle: string
  ctaButton: string
  questions: Question[]
}> = {
  ka: {
    title: 'ნებისწერის ქვიზი',
    subtitle: 'გაიგე რამდენად შენს ხელშია შენი ბედი',
    startButton: 'დაწყება',
    nextButton: 'შემდეგი',
    prevButton: 'წინა',
    submitButton: 'შედეგის ნახვა',
    questionOf: 'კითხვა',
    resultsTitle: 'შენი შედეგი',
    resultsSubtitle: 'აი რას ამბობს შენი პასუხები შენზე',
    scoreLabels: {
      high: {
        title: 'შენ უკვე ახლოს ხარ!',
        description: 'შენ უკვე გაქვს ბევრი რესურსი საკუთარი ცხოვრების მართვისთვის. ნებისწერა დაგეხმარება დარჩენილი ბარიერების გადალახვაში და შენი პოტენციალის სრულად რეალიზებაში.',
      },
      medium: {
        title: 'შენ გზაზე ხარ',
        description: 'შენ გაქვს პოტენციალი, მაგრამ რაღაც გაბრკოლებს. ნებისწერა მოგცემს კონკრეტულ ინსტრუმენტებს და ტექნიკას, რომ გარდაქმნა შენი ცხოვრება ისეთად, როგორიც გინდა.',
      },
      low: {
        title: 'ნებისწერა შენთვის არის',
        description: 'შენ გრძნობ რომ რაღაც უნდა შეიცვალოს, მაგრამ არ იცი საიდან დაიწყო. ნებისწერა სწორედ შენთვის შეიქმნა — გასწავლის როგორ გაიგო რა გინდა და როგორ მიაღწიო მას.',
      },
    },
    ctaTitle: 'მზად ხარ პირველი ნაბიჯისთვის?',
    ctaButton: 'გაიგე მეტი ნებისწერაზე',
    questions: [
      {
        id: 1,
        question: 'რამდენად ნათლად იცი რა გინდა ცხოვრებაში?',
        options: [
          { text: 'ძალიან ნათლად ვიცი — მაქვს კონკრეტული მიზნები', score: 5 },
          { text: 'ზოგადად ვიცი, მაგრამ დეტალები ბუნდოვანია', score: 3 },
          { text: 'ხშირად ვიბნევი და არ ვიცი რა მინდა', score: 1 },
        ],
      },
      {
        id: 2,
        question: 'როცა გადაწყვეტილებას იღებ, რამდენად ენდობი საკუთარ თავს?',
        options: [
          { text: 'სრულად ვენდობი — ვიცი რომ სწორ არჩევანს გავაკეთებ', score: 5 },
          { text: 'ზოგჯერ ვეჭვიანობ, მაგრამ საბოლოოდ ვიღებ გადაწყვეტილებას', score: 3 },
          { text: 'ხშირად ვეჭვიანობ და სხვების აზრს ვეძებ', score: 1 },
        ],
      },
      {
        id: 3,
        question: 'რამდენად გრძნობ რომ შენი ცხოვრება შენს კონტროლშია?',
        options: [
          { text: 'სრულად — მე ვქმნი ჩემს რეალობას', score: 5 },
          { text: 'ნაწილობრივ — ზოგი რამ ჩემს ხელშია, ზოგი არა', score: 3 },
          { text: 'იშვიათად — გარემოებები მართავენ ჩემს ცხოვრებას', score: 1 },
        ],
      },
      {
        id: 4,
        question: 'როცა წინააღმდეგობას აწყდები, როგორ რეაგირებ?',
        options: [
          { text: 'ვეძებ გზას გარშემო — ყოველთვის არის გამოსავალი', score: 5 },
          { text: 'ვცდილობ, მაგრამ ზოგჯერ ვნებდები', score: 3 },
          { text: 'ხშირად ვთმობ ან ვიწყებ ეჭვის', score: 1 },
        ],
      },
      {
        id: 5,
        question: 'რამდენად კმაყოფილი ხარ შენი ცხოვრების მიმართულებით?',
        options: [
          { text: 'ძალიან — სწორ გზაზე ვარ', score: 5 },
          { text: 'ნაწილობრივ — რაღაც უნდა შეიცვალოს', score: 3 },
          { text: 'არ ვარ კმაყოფილი — გრძნობ რომ დაბნეული ვარ', score: 1 },
        ],
      },
      {
        id: 6,
        question: 'რამდენად ხშირად აკეთებ იმას რაც ნამდვილად გინდა (და არა იმას რაც "უნდა")?',
        options: [
          { text: 'თითქმის ყოველთვის — ჩემი არჩევანი ჩემზეა დამოკიდებული', score: 5 },
          { text: 'ზოგჯერ — ბალანსს ვცდილობ', score: 3 },
          { text: 'იშვიათად — ვალდებულებები მართავენ ჩემს დროს', score: 1 },
        ],
      },
      {
        id: 7,
        question: 'როცა წარუმატებლობას განიცდი, როგორ აღიქვამ?',
        options: [
          { text: 'როგორც გაკვეთილს — ვსწავლობ და ვაგრძელებ', score: 5 },
          { text: 'მტკივნეულია, მაგრამ ვცდილობ წინ წავიდე', score: 3 },
          { text: 'ძალიან მტკივნეულია — ხშირად ვთმობ', score: 1 },
        ],
      },
      {
        id: 8,
        question: 'რამდენად გჯერა რომ შეგიძლია შეცვალო შენი ცხოვრება?',
        options: [
          { text: 'სრულად — ყველაფერი შესაძლებელია', score: 5 },
          { text: 'ნაწილობრივ — ზოგი რამ შეიძლება შეიცვალოს', score: 3 },
          { text: 'ძნელია — ბევრი რამ ჩემს კონტროლს მიღმაა', score: 1 },
        ],
      },
      {
        id: 9,
        question: 'როგორ გრძნობ თავს, როცა მომავალზე ფიქრობ?',
        options: [
          { text: 'აღფრთოვანებული — ვხედავ შესაძლებლობებს', score: 5 },
          { text: 'ნეიტრალური — არც შიში, არც აღფრთოვანება', score: 3 },
          { text: 'შეშფოთებული — გაურკვევლობა მაწუხებს', score: 1 },
        ],
      },
    ],
  },
  en: {
    title: 'Nebiswera Quiz',
    subtitle: 'Discover how much your destiny is in your hands',
    startButton: 'Start',
    nextButton: 'Next',
    prevButton: 'Previous',
    submitButton: 'See Results',
    questionOf: 'Question',
    resultsTitle: 'Your Results',
    resultsSubtitle: 'Here\'s what your answers reveal about you',
    scoreLabels: {
      high: {
        title: 'You\'re Already Close!',
        description: 'You already have many resources for managing your own life. Nebiswera will help you overcome remaining barriers and fully realize your potential.',
      },
      medium: {
        title: 'You\'re On Your Way',
        description: 'You have potential, but something is holding you back. Nebiswera will give you specific tools and techniques to transform your life into what you want it to be.',
      },
      low: {
        title: 'Nebiswera Is For You',
        description: 'You feel that something needs to change, but don\'t know where to start. Nebiswera was created exactly for you — it will teach you how to understand what you want and how to achieve it.',
      },
    },
    ctaTitle: 'Ready for the first step?',
    ctaButton: 'Learn more about Nebiswera',
    questions: [
      {
        id: 1,
        question: 'How clearly do you know what you want in life?',
        options: [
          { text: 'Very clearly — I have specific goals', score: 5 },
          { text: 'Generally I know, but details are vague', score: 3 },
          { text: 'I often get confused and don\'t know what I want', score: 1 },
        ],
      },
      {
        id: 2,
        question: 'When making decisions, how much do you trust yourself?',
        options: [
          { text: 'Completely — I know I\'ll make the right choice', score: 5 },
          { text: 'Sometimes I doubt, but eventually I decide', score: 3 },
          { text: 'I often doubt and seek others\' opinions', score: 1 },
        ],
      },
      {
        id: 3,
        question: 'How much do you feel your life is in your control?',
        options: [
          { text: 'Completely — I create my own reality', score: 5 },
          { text: 'Partially — some things are in my hands, some aren\'t', score: 3 },
          { text: 'Rarely — circumstances control my life', score: 1 },
        ],
      },
      {
        id: 4,
        question: 'When you face obstacles, how do you react?',
        options: [
          { text: 'I look for a way around — there\'s always a solution', score: 5 },
          { text: 'I try, but sometimes I give up', score: 3 },
          { text: 'I often give up or start doubting', score: 1 },
        ],
      },
      {
        id: 5,
        question: 'How satisfied are you with your life\'s direction?',
        options: [
          { text: 'Very — I\'m on the right path', score: 5 },
          { text: 'Partially — something needs to change', score: 3 },
          { text: 'Not satisfied — I feel lost', score: 1 },
        ],
      },
      {
        id: 6,
        question: 'How often do you do what you truly want (vs what you "should")?',
        options: [
          { text: 'Almost always — my choices are my own', score: 5 },
          { text: 'Sometimes — I try to balance', score: 3 },
          { text: 'Rarely — obligations control my time', score: 1 },
        ],
      },
      {
        id: 7,
        question: 'When you experience failure, how do you perceive it?',
        options: [
          { text: 'As a lesson — I learn and continue', score: 5 },
          { text: 'It\'s painful, but I try to move forward', score: 3 },
          { text: 'Very painful — I often give up', score: 1 },
        ],
      },
      {
        id: 8,
        question: 'How much do you believe you can change your life?',
        options: [
          { text: 'Completely — everything is possible', score: 5 },
          { text: 'Partially — some things can change', score: 3 },
          { text: 'It\'s hard — much is beyond my control', score: 1 },
        ],
      },
      {
        id: 9,
        question: 'How do you feel when thinking about the future?',
        options: [
          { text: 'Excited — I see possibilities', score: 5 },
          { text: 'Neutral — neither fear nor excitement', score: 3 },
          { text: 'Worried — uncertainty troubles me', score: 1 },
        ],
      },
    ],
  },
}

interface TestPageClientProps {
  locale: string
  initialEmail?: string
}

export function TestPageClient({ locale, initialEmail }: TestPageClientProps) {
  const t = content[locale as Locale] || content.ka
  const [started, setStarted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [totalScore, setTotalScore] = useState(0)

  const handleAnswer = (questionId: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }))
  }

  const handleNext = () => {
    if (currentQuestion < t.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    const score = Object.values(answers).reduce((sum, val) => sum + val, 0)
    setTotalScore(score)
    setShowResults(true)

    // Track test completion
    if (initialEmail) {
      try {
        await fetch('/api/contacts/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: initialEmail,
            source: 'test_completed',
            metadata: { testScore: score },
          }),
        })
      } catch (error) {
        console.error('Failed to track test completion:', error)
      }
    }
  }

  const getScoreCategory = () => {
    const maxScore = t.questions.length * 5
    const percentage = (totalScore / maxScore) * 100

    if (percentage >= 70) return 'high'
    if (percentage >= 40) return 'medium'
    return 'low'
  }

  const currentQ = t.questions[currentQuestion]
  const isAnswered = answers[currentQ?.id] !== undefined
  const allAnswered = Object.keys(answers).length === t.questions.length

  // Intro screen
  if (!started) {
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            {t.subtitle}
          </p>
          <button
            onClick={() => setStarted(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-neu-lg shadow-neu text-xl transition-all"
          >
            {t.startButton}
          </button>
        </motion.div>
      </div>
    )
  }

  // Results screen
  if (showResults) {
    const category = getScoreCategory()
    const result = t.scoreLabels[category]
    const maxScore = t.questions.length * 5
    const percentage = Math.round((totalScore / maxScore) * 100)

    return (
      <div className="min-h-screen bg-neu-base px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-neu">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              {t.resultsTitle}
            </h1>
            <p className="text-text-secondary">
              {t.resultsSubtitle}
            </p>
          </div>

          {/* Score display */}
          <div className="bg-white rounded-neu-lg p-8 shadow-neu mb-8">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-primary-600 mb-2">
                {percentage}%
              </div>
              <div className="text-text-secondary">
                {totalScore} / {maxScore}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  category === 'high'
                    ? 'bg-green-500'
                    : category === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-primary-500'
                }`}
              />
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-4">
              {result.title}
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              {result.description}
            </p>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-neu-lg p-8 text-center shadow-neu">
            <Sparkles className="w-10 h-10 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              {t.ctaTitle}
            </h3>
            <a
              href={`/${locale}`}
              className="inline-block bg-white text-primary-600 font-bold px-8 py-4 rounded-neu-lg shadow-neu hover:bg-gray-50 transition-all"
            >
              {t.ctaButton}
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  // Question screen
  return (
    <div className="min-h-screen bg-neu-base px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-secondary">
              {t.questionOf} {currentQuestion + 1} / {t.questions.length}
            </span>
            <span className="text-sm text-primary-600 font-semibold">
              {Math.round(((currentQuestion + 1) / t.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / t.questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-neu-lg p-8 shadow-neu"
          >
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-text-primary">
                {currentQ.question}
              </h2>
            </div>

            <div className="space-y-4">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(currentQ.id, option.score)}
                  className={`w-full text-left p-4 rounded-neu-lg border-2 transition-all ${
                    answers[currentQ.id] === option.score
                      ? 'border-primary-500 bg-primary-50 shadow-neu'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base md:text-lg text-text-primary">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-neu-lg bg-gray-100 text-text-secondary hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            {t.prevButton}
          </button>

          {currentQuestion === t.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="flex items-center gap-2 px-6 py-3 rounded-neu-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.submitButton}
              <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="flex items-center gap-2 px-6 py-3 rounded-neu-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.nextButton}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
