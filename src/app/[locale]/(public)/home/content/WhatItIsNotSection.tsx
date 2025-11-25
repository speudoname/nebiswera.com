'use client'

import { useLocale } from 'next-intl'
import { Brain } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  eyebrow: string
  title: string
  mainText: string[]
  whatItIsTitle: string
  whatItIsText: string
}> = {
  ka: {
    eyebrow: 'რა არ არის ნებისწერა',
    title: 'არ არის თერაპია, არც ქოუჩინგია და არც ზებუნებრივი იდეა',
    mainText: [
      'ნებისწერა არ არის თერაპია. ჩვენ არ ვკურნავთ ტრავმებს, რადგან არ გვჯერა რომ ტრავმები არსებობს ისე როგორც ჩვეულებრივ წარმოგიდგენიათ. ჩვენ არ გეპყრობით როგორც დაზიანებულს, როგორც ავადმყოფს, როგორც ვინმეს ვისაც განკურნება სჭირდება. თქვენ არ უნდა მოელოდეთ რომ გამოხატოთ საკუთარი თავი, გაიხსნათ ან განიკურნოთ. თქვენ ჯანმრთელი ხართ და არაფერი გიშლით — უბრალოდ ინსტრუმენტები გჭირდებათ. თუ კაცს ვთხოვთ ხე მოჭრას და ერთ-ერთს არ შეუძლია ამის გაკეთება იმიტომ რომ არ აქვს ხერხი, ეს არ ნიშნავს რომ ავადაა და მკურნალობა სჭირდება — უბრალოდ ინსტრუმენტი სჭირდება.',
      'ნებისწერა არც კოუჩინგია, არც ტრენინგი და არც დამრიგებლობა. ჩვენ არ გეუბნებით როგორ იცხოვროთ, რა გააკეთოთ, როგორ გააკეთოთ. არ გიზავთ, არ გადაგიზავთ, არ გიდგენთ გეგმას და არც მოგთხოვთ რომ იმოქმედოთ. ეს თქვენზეა დამოკიდებული — ჩვენ უბრალოდ ვასწავლით. ეს სასწავლო სესიაა, ისევე როგორც ხატვის შესწავლა, სადაც მასწავლებელი გასწავლით პერსპექტივის წესებს, ჩრდილებსა და შუქს, როგორ გამოიყენოთ ფანქარი და როგორ შეუხამოთ ფერები — ასევე ჩვენც ვასწავლით როგორ დაწეროთ ბედი ნებით.',
      'და ბოლოს, ნებისწერა არ არის ჯადოსნური წამალი, ეზოთერული იდეა ან მაგიური გამოსავალი. აქ არ არის მანტრები, ვიბრაციების აწევა ან რაიმე რიტუალები, სადაც უბრალოდ რაღაცას აკეთებ და შედეგი მოდის. ნებისწერა არის ლოგიკური და რაციონალური გზა იმისა, რომ ცხოვრებაზე შეხედო როგორც რაღაცაზე, რაც შენზეა დამოკიდებული. ეს პროცესია რომელიც გაძლიერებს, ხდები მთავარი — არა ჯადოსნური პროცედურა რომელსაც მიმართავ შედეგის მისაღებად, არამედ შენი არჩევანია რაც მნიშვნელობას იძენს და შედეგს იძლევა.',
    ],
    whatItIsTitle: 'რა არის მაშინ ნებისწერა?',
    whatItIsText: 'ნებისწერა არის სწავლება — როგორც ხატვის გაკვეთილი. როგორც ხატვის მასწავლებელი გასწავლით პერსპექტივის წესებს, ჩრდილებსა და შუქს, როგორ გამოიყენოთ ფანქარი და როგორ შეუხამოთ ფერები — ასევე ჩვენც ვასწავლით როგორ დაწეროთ ბედი ნებით. თქვენზეა დამოკიდებული რას აკეთებთ ამ ცოდნით.',
  },
  en: {
    eyebrow: 'What Nebiswera is NOT',
    title: 'Not Therapy, Not Coaching, Not a Magical Solution',
    mainText: [
      'Nebiswera is not therapy. We don\'t cure traumas because we don\'t believe traumas exist the way you typically imagine them. We don\'t treat you as damaged, as sick, as someone who needs healing. You should not expect to express yourself, open up, or be healed. You are healthy and nothing is wrong with you — you simply need tools. If we ask a man to cut down a tree and he cannot do it because he doesn\'t have a saw, it doesn\'t mean he is ill and needs treatment — he simply needs a tool.',
      'Nebiswera is not coaching, training, or tutoring either. We don\'t tell you how to live, what to do, or how to do it. We don\'t push you, guide you, create plans for you, or demand that you take action. That\'s up to you — we simply teach. This is a teaching session, much like learning to draw, where a teacher teaches you the rules of perspective, shadows and light, how to use a pencil and how to match colors — similarly, we teach you how to write fate with will.',
      'And finally, Nebiswera is not a magical potion, an esoteric idea, or a magical solution. There are no mantras, raising vibrations, or rituals where you simply do something and results arrive. Nebiswera is a logical and rational way of looking at life as something that depends on you. It\'s a process that empowers you, puts you in charge — not a magical procedure you can call upon to get results, but rather your choice is what matters and produces results.',
    ],
    whatItIsTitle: 'So What Is Nebiswera?',
    whatItIsText: 'Nebiswera is teaching — like a drawing lesson. Just as a drawing teacher teaches you the rules of perspective, shadows and light, how to use a pencil and how to match colors — we also teach you how to write fate with will. What you do with this knowledge is up to you.',
  },
}

export function WhatItIsNotSection() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neu-light to-neu-base overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="eyebrow text-primary-600 mb-4">
            {t.eyebrow}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-6">
            {t.title}
          </h2>
        </div>

        {/* Main Text - Book-like paragraphs */}
        <div className="bg-neu-base rounded-neu-lg p-8 md:p-10 shadow-neu mb-10 md:mb-12">
          <div className="space-y-6 md:space-y-8">
            {t.mainText.map((paragraph, index) => (
              <p
                key={index}
                className="text-base md:text-lg text-text-primary leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* What it IS - Highlighted section */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-neu-lg p-8 md:p-10 shadow-neu-md">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary-200 flex items-center justify-center shadow-neu-sm">
              <Brain className="w-6 h-6 md:w-7 md:h-7 text-primary-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-primary-600 pt-2">
              {t.whatItIsTitle}
            </h3>
          </div>
          <p className="text-base md:text-lg text-text-primary leading-relaxed">
            {t.whatItIsText}
          </p>
        </div>
      </div>
    </section>
  )
}
