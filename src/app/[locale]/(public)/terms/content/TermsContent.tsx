'use client'

import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  title: string
  lastUpdated: string
  intro: string
  sections: Array<{
    title: string
    content: string | string[]
  }>
}> = {
  ka: {
    title: 'წესები და პირობები',
    lastUpdated: 'ბოლო განახლება: 2024 წლის 25 ნოემბერი',
    intro: 'წინამდებარე ვებ-გვერდის და შემოთავაზებულ სასწავლო კურსზე რეგისტრაცია და დასწრება რეგულირდება წინამდებარე წესებითა და პირობებით.',
    sections: [
      {
        title: '1. მომსახურების მიმწოდებელი',
        content: [
          'მომსახურების მიმწოდებელი: მცირე მეწარმე "ლევან ბახია"',
          'პირადი ნომერი: 01031000466',
          'ტელეფონი: +995 99 789 229',
          'ელ-ფოსტა: hello@nebiswera.ge'
        ]
      },
      {
        title: '2. მომხმარებლის განმარტება',
        content: 'მომხმარებელი არის ნებისმიერი პირი, რომელიც რეგისტრირდება კურსებზე და იყენებს პლატფორმის სერვისებს.'
      },
      {
        title: '3. პირობებზე თანხმობა',
        content: 'რეგისტრაცია გულისხმობს ყველა პირობის მიღებას და იმის აღიარებას, რომ პერიოდულად შესაძლოა განხორციელდეს ცვლილებები.'
      },
      {
        title: '4. უფლებამოსილება',
        content: 'მცირე მეწარმე "ლევან ბახია" უფლებამოსილია ცალმხრივად შეცვალოს წესები და პირობები, რომლებიც ძალაში შედის მათი გამოქვეყნებისთანავე.'
      },
      {
        title: '5. მომსახურების აღწერა',
        content: 'მომსახურება მოიცავს კურსების მიწოდებას ვიდეო, ტექსტური და ვიზუალური მასალების საშუალებით, ასევე ვორქშოპებსა და სემინარებს ონლაინ და ფიზიკურ ფორმატში ორმხრივად შეთანხმებული გრაფიკით.'
      },
      {
        title: '6. გადახდა და თანხის დაბრუნება',
        content: 'გადახდილი კურსის საფასური არ ექვემდებარება დაბრუნებას, გარდა ფორსმაჟორული სიტუაციებისა, რომელიც დამტკიცებულია დირექტორების მიერ.'
      },
      {
        title: '7. კონტენტის შეზღუდვები',
        content: 'მომხმარებლებს არ შეუძლიათ ლექციების ვიდეოების გაზიარება, გავრცელება ან ხელახალი გამოქვეყნება კომპანიის წინასწარი თანხმობის გარეშე.'
      },
      {
        title: '8. ინტელექტუალური საკუთრება',
        content: 'ლექციები წარმოადგენს მცირე მეწარმე "ლევან ბახია"-ს საავტორო უფლებას; მომხმარებლებს არ შეუძლიათ მასალების გადამუშავება, გამოქვეყნება ან კომერციული გამოყენება.'
      },
      {
        title: '9. პასუხისმგებლობის შეზღუდვა',
        content: 'მცირე მეწარმე "ლევან ბახია" არ არის პასუხისმგებელი პირდაპირ/ირიბ ზიანზე ინფორმაციის არასწორად გამოყენებისგან.'
      },
      {
        title: '10. მონაცემთა კონფიდენციალურობა',
        content: 'პირადი მონაცემები ინახება მომსახურების მიწოდებისთვის; მომხმარებლებს შეუძლიათ მოითხოვონ ინფორმაციის გამჟღავნება ან წაშლა.'
      },
      {
        title: '11. მარეგულირებელი კანონმდებლობა',
        content: 'მოქმედებს საქართველოს კანონმდებლობა; დავებს განიხილავს თბილისის საქალაქო სასამართლო.'
      }
    ]
  },
  en: {
    title: 'Terms and Conditions',
    lastUpdated: 'Last updated: November 25, 2024',
    intro: 'Registration and attendance on this website and offered educational courses are governed by these terms and conditions.',
    sections: [
      {
        title: '1. Service Provider',
        content: [
          'Service Provider: Individual Entrepreneur "Levan Bakhia"',
          'Personal ID: 01031000466',
          'Phone: +995 99 789 229',
          'Email: hello@nebiswera.ge'
        ]
      },
      {
        title: '2. Definition of User',
        content: 'A user is any individual who registers for courses and uses the platform\'s services.'
      },
      {
        title: '3. Agreement to Terms',
        content: 'Registration implies acceptance of all terms and acknowledgment that modifications may occur periodically.'
      },
      {
        title: '4. Authority',
        content: 'Individual Entrepreneur "Levan Bakhia" reserves the right to unilaterally modify the terms and conditions, which become effective upon publication.'
      },
      {
        title: '5. Service Description',
        content: 'Services include course delivery via video, text, and visual materials, as well as workshops and seminars in online and physical formats with mutually agreed schedules.'
      },
      {
        title: '6. Payment and Refunds',
        content: 'Paid course fees are non-refundable except in force majeure situations approved by the directors.'
      },
      {
        title: '7. Content Restrictions',
        content: 'Users cannot share, distribute, or republish lecture videos without prior consent from the company.'
      },
      {
        title: '8. Intellectual Property',
        content: 'Lectures remain the copyright of Individual Entrepreneur "Levan Bakhia"; users cannot repurpose, publish, or commercially exploit the materials.'
      },
      {
        title: '9. Limitation of Liability',
        content: 'Individual Entrepreneur "Levan Bakhia" is not responsible for direct/indirect damages from misuse of information.'
      },
      {
        title: '10. Data Privacy',
        content: 'Personal data is stored for service delivery; users may request information disclosure or deletion.'
      },
      {
        title: '11. Governing Law',
        content: 'Georgian law applies; disputes are handled by Tbilisi City Court.'
      }
    ]
  }
}

export function TermsContent() {
  const locale = useLocale() as Locale
  const t = content[locale]

  return (
    <div className="prose prose-lg max-w-none">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
        {t.title}
      </h1>
      <p className="text-sm text-text-muted mb-6">{t.lastUpdated}</p>

      <p className="text-text-secondary mb-8 leading-relaxed">
        {t.intro}
      </p>

      <div className="space-y-6">
        {t.sections.map((section, index) => (
          <div key={index}>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {section.title}
            </h2>
            {Array.isArray(section.content) ? (
              <ul className="list-none space-y-1 text-text-secondary">
                {section.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary leading-relaxed">
                {section.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
