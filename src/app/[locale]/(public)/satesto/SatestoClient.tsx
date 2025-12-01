'use client'

import React, { useState } from 'react'
import { useLocale } from 'next-intl'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  title: string
  subtitle: string
  nameLabel: string
  namePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  phoneLabel: string
  phonePlaceholder: string
  submitButton: string
  successMessage: string
  errorMessage: string
}> = {
  ka: {
    title: 'სატესტო რეგისტრაცია',
    subtitle: 'გთხოვთ შეავსოთ ფორმა',
    nameLabel: 'სახელი და გვარი',
    namePlaceholder: 'თქვენი სახელი',
    emailLabel: 'ელ. ფოსტა',
    emailPlaceholder: 'example@mail.com',
    phoneLabel: 'ტელეფონი',
    phonePlaceholder: '+995 XXX XX XX XX',
    submitButton: 'რეგისტრაცია',
    successMessage: 'წარმატებით დარეგისტრირდით!',
    errorMessage: 'დაფიქსირდა შეცდომა, სცადეთ თავიდან',
  },
  en: {
    title: 'Test Registration',
    subtitle: 'Please fill out the form',
    nameLabel: 'Full Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    emailPlaceholder: 'example@mail.com',
    phoneLabel: 'Phone',
    phonePlaceholder: '+995 XXX XX XX XX',
    submitButton: 'Register',
    successMessage: 'Successfully registered!',
    errorMessage: 'An error occurred, please try again',
  },
}

export function SatestoClient() {
  const locale = useLocale() as Locale
  const t = content[locale]

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus('idle')

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Form submitted:', formData)
      setStatus('success')
      setFormData({ name: '', email: '', phone: '' })
    } catch (error) {
      console.error('Submission error:', error)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neu-light to-neu-base py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-text-secondary">
            {t.subtitle}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-neu-base rounded-neu-lg p-8 md:p-12 shadow-neu">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                {t.nameLabel}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t.namePlaceholder}
                required
                className="w-full px-4 py-3 bg-neu-light rounded-neu shadow-neu-inset text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                {t.emailLabel}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.emailPlaceholder}
                required
                className="w-full px-4 py-3 bg-neu-light rounded-neu shadow-neu-inset text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t.phonePlaceholder}
                required
                className="w-full px-4 py-3 bg-neu-light rounded-neu shadow-neu-inset text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-primary-500 text-white font-semibold rounded-neu shadow-neu hover:shadow-neu-hover active:shadow-neu-pressed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : t.submitButton}
            </button>

            {/* Status Messages */}
            {status === 'success' && (
              <div className="p-4 bg-gradient-to-r from-secondary-100 to-secondary-50 rounded-neu text-center">
                <p className="text-secondary-600 font-semibold">{t.successMessage}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-gradient-to-r from-primary-100 to-primary-50 rounded-neu text-center">
                <p className="text-primary-600 font-semibold">{t.errorMessage}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
