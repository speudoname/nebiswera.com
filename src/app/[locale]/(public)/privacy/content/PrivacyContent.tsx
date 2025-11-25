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
    title: 'კონფიდენციალურობის პოლიტიკა',
    lastUpdated: 'ბოლო განახლება: 2024 წლის 25 ნოემბერი',
    intro: 'ჩვენ ვახორციელებთ შემეცნებითი და სასწავლო კურსების გაყიდვას ვორქშოპების, სემინარების და ონლაინ ფორმატით. წინამდებარე პოლიტიკა ასახავს პროცესს, რომელიც დაკავშირებულია ჩვენს მიერ თქვენი პირადი მონაცემების დაცვასთან.',
    sections: [
      {
        title: 'მომსახურების მიმწოდებელი',
        content: [
          'მცირე მეწარმე "ლევან ბახია"',
          'პირადი ნომერი: 01031000466',
          'ტელეფონი: +995 99 789 229',
          'ელ-ფოსტა: hello@nebiswera.ge'
        ]
      },
      {
        title: 'რა ინფორმაციას ვაგროვებთ',
        content: [
          'სახელი და გვარი',
          'მისამართი',
          'ელექტრონული ფოსტის მისამართი',
          'ტელეფონის ნომერი',
          'დაბადების თარიღი',
          'ფინანსური ინფორმაცია (საბანკო ანგარიშისა და ბარათის ნომრები) მომსახურების მისაწოდებლად'
        ]
      },
      {
        title: 'Cookie ფაილები',
        content: 'Cookie ფაილები ინახება მომხმარებლის მოწყობილობაზე და უზრუნველყოფს საიტის ფუნქციონირებას და მომხმარებლის დამახსოვრებას. მომხმარებლებს შეუძლიათ გათიშონ Cookie-ები, თუმცა ამით დაკარგავენ წვდომას ზოგიერთ ვებსაიტის ფუნქციაზე.'
      },
      {
        title: 'კომუნიკაცია',
        content: 'პირადი მონაცემები მუშავდება მარკეტინგული მიზნებისთვის, რაც საშუალებას გვაძლევს პერიოდულად გამოვუგზავნოთ მომხმარებლებს განახლებები პროდუქტებისა და მომსახურების შესახებ, თუ მომხმარებელი არ უარს არ იტყვის.'
      },
      {
        title: 'პოლიტიკის ცვლილებები',
        content: 'კონფიდენციალურობის პოლიტიკის განახლებები ქვეყნდება ვებსაიტზე. მომხმარებლებმა უნდა გადახედონ განახლებულ ვერსიებს. მონაცემების გამოყენება ამ პოლიტიკის მიღმა მოითხოვს მომხმარებლის აშკარა თანხმობას.'
      },
      {
        title: 'თქვენი უფლებები',
        content: [
          'თქვენი პირადი მონაცემების ასლის მოთხოვნა',
          'თქვენი პირადი მონაცემების გასწორების მოთხოვნა',
          'თქვენი პირადი მონაცემების წაშლის მოთხოვნა',
          'მარკეტინგული კომუნიკაციის მიღებაზე უარის თქმა'
        ]
      },
      {
        title: 'დაგვიკავშირდით',
        content: 'კონფიდენციალურობასთან დაკავშირებული კითხვებისთვის, გთხოვთ დაგვიკავშირდეთ: hello@nebiswera.ge ან +995 99 789 229'
      }
    ]
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: November 25, 2024',
    intro: 'We conduct the sale of cognitive and educational courses through workshops, seminars, and online formats. This policy describes the processes related to the protection of your personal data by us.',
    sections: [
      {
        title: 'Service Provider',
        content: [
          'Individual Entrepreneur "Levan Bakhia"',
          'Personal ID: 01031000466',
          'Phone: +995 99 789 229',
          'Email: hello@nebiswera.ge'
        ]
      },
      {
        title: 'What Information We Collect',
        content: [
          'Name and surname',
          'Address',
          'Email address',
          'Phone number',
          'Date of birth',
          'Financial information (bank account and card numbers) to provide services'
        ]
      },
      {
        title: 'Cookies',
        content: 'Cookie files are stored on the user\'s device and enable site functionality and user recognition. Users may disable cookies but will lose access to certain website features.'
      },
      {
        title: 'Communication',
        content: 'Personal data is processed for marketing purposes, allowing us to periodically send users updates about products and services, unless users opt out.'
      },
      {
        title: 'Policy Changes',
        content: 'Updates to the privacy policy are published on the website. Users must review updated versions. Data use beyond this policy requires explicit user consent.'
      },
      {
        title: 'Your Rights',
        content: [
          'Request a copy of your personal data',
          'Request correction of your personal data',
          'Request deletion of your personal data',
          'Opt out of marketing communications'
        ]
      },
      {
        title: 'Contact Us',
        content: 'For privacy-related questions, please contact us at: hello@nebiswera.ge or +995 99 789 229'
      }
    ]
  }
}

export function PrivacyContent() {
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
              <ul className="list-disc list-inside space-y-1 text-text-secondary">
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
