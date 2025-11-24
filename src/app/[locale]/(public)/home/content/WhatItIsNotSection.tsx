'use client'

import { useLocale } from 'next-intl'
import { XCircle, Wrench, BookOpen, Brain } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  subtitle: string
  notItems: Array<{
    icon: 'xCircle'
    title: string
    description: string
  }>
  isItem: {
    icon: 'brain'
    title: string
    description: string
  }
  analogies: Array<{
    icon: 'wrench' | 'book'
    text: string
  }>
}> = {
  ka: {
    eyebrow: 'რა არ არის ნებისწერა',
    title: 'არ არის თერაპია, არც ქოუჩინგია და არც ზებუნებრივი იდეა',
    subtitle: 'ნებისწერა არის სწავლება — როგორც ხელობის შესწავლა',
    notItems: [
      {
        icon: 'xCircle',
        title: 'არა თერაპია',
        description: 'არ ვკურნავთ ტრავმებს და არ გვჯერა რომ ტრავმები არსებობს. ჩვენ არ გეპყრობით როგორც დაზიანებულს ან ავადმყოფს. თქვენ ჯანმრთელი ხართ და არ გჭირდებათ "განკურნება" — უბრალოდ ინსტრუმენტები გჭირდებათ.',
      },
      {
        icon: 'xCircle',
        title: 'არა კოუჩინგი',
        description: 'არ გეუბნებით როგორ უნდა იცხოვროთ, არ გიზავთ, არ გადაგიზავთ და არ გიდგენთ გეგმას. ჩვენ ვასწავლით პრინციპებს და ფორმულებს — თქვენ თავად წყვეტთ როგორ გამოიყენოთ ისინი.',
      },
      {
        icon: 'xCircle',
        title: 'არა ზებუნებრივი',
        description: 'არა მანტრები, არა ვიბრაციები, არა ეზოთერული პრაქტიკები. ნებისწერა არის ლოგიკური და რაციონალური მიდგომა — თქვენ აძლევთ ძალას საკუთარ თავს, არა გარეგანი "ჯადოსნური" პროცედურები.',
      },
    ],
    isItem: {
      icon: 'brain',
      title: 'რა არის მაშინ ნებისწერა?',
      description: 'ნებისწერა არის სწავლება — როგორც ხატვის გაკვეთილი. როგორც ხატვის მასწავლებელი გასწავლით პერსპექტივის წესებს, ჩრდილებსა და შუქს, როგორ გამოიყენოთ ფანქარი და როგორ შეუხამოთ ფერები — ასევე ჩვენც ვასწავლით როგორ დაწეროთ ბედი ნებით. თქვენზეა დამოკიდებული რას აკეთებთ ამ ცოდნით.',
    },
    analogies: [
      {
        icon: 'wrench',
        text: 'თუ კაცს არ შეუძლია ხის მოჭრა იმიტომ რომ არ აქვს ხერხი, ეს არ ნიშნავს რომ ავადაა და მკურნალობა სჭირდება — უბრალოდ ინსტრუმენტი სჭირდება.',
      },
      {
        icon: 'book',
        text: 'ჩვენ ვასწავლით კანონებს, ფორმულებს და მეთოდებს. რას აირჩევთ მათთან — მხოლოდ თქვენზეა დამოკიდებული. ყველაფერი თქვენს ხელშია.',
      },
    ],
  },
  en: {
    eyebrow: 'What Nebiswera is NOT',
    title: 'Nebiswera is Teaching, Not Therapy, Coaching, or Magic',
    subtitle: 'We teach you how to use your inner power',
    notItems: [
      {
        icon: 'xCircle',
        title: 'Not Therapy',
        description: 'We don\'t treat traumas, we don\'t believe traumas exist. You are healthy.',
      },
      {
        icon: 'xCircle',
        title: 'Not Coaching',
        description: 'We don\'t tell you how to live, don\'t push you, don\'t make plans for you.',
      },
      {
        icon: 'xCircle',
        title: 'Not Magic',
        description: 'No mantras, no vibrations, no esoteric practices.',
      },
    ],
    isItem: {
      icon: 'brain',
      title: 'So What Is It?',
      description: 'Nebiswera is logical and rational teaching. Like a drawing lesson teaches perspective and shadows — we teach how to write fate with will.',
    },
    analogies: [
      {
        icon: 'wrench',
        text: 'If a man can\'t cut a tree without a saw, it doesn\'t mean he\'s ill. He needs a tool.',
      },
      {
        icon: 'book',
        text: 'Like a drawing teacher teaches the rules — we teach formulas and methods. What you choose to do with them is up to you.',
      },
    ],
  },
}

const iconMap = {
  xCircle: XCircle,
  wrench: Wrench,
  book: BookOpen,
  brain: Brain,
}

export function WhatItIsNotSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <p className="eyebrow text-primary-600 mb-3">
            {t.eyebrow}
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-3">
            {t.title}
          </h2>
          <p className="text-base md:text-lg text-text-secondary">
            {t.subtitle}
          </p>
        </div>

        {/* What it's NOT - Detailed Cards */}
        <div className="space-y-4 md:space-y-5 mb-10 md:mb-12">
          {t.notItems.map((item, index) => (
            <div
              key={index}
              className="bg-neu-light rounded-neu-md p-5 md:p-6 shadow-neu-inset"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-0.5">
                  <XCircle className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What it IS */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-6 md:p-8 shadow-neu-md mb-6 md:mb-8">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-200 flex items-center justify-center shadow-neu-sm">
              <Brain className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-primary-600 mb-2">
                {t.isItem.title}
              </h3>
              <p className="text-sm md:text-base text-text-primary leading-relaxed">
                {t.isItem.description}
              </p>
            </div>
          </div>
        </div>

        {/* Analogies - Compact */}
        <div className="space-y-3 md:space-y-4">
          {t.analogies.map((analogy, index) => {
            const Icon = iconMap[analogy.icon]
            return (
              <div
                key={index}
                className="bg-neu-base rounded-neu p-4 md:p-5 shadow-neu flex items-start gap-3"
              >
                <div className="flex-shrink-0">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                </div>
                <p className="text-sm md:text-base text-text-secondary italic leading-relaxed flex-1 min-w-0">
                  {analogy.text}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
