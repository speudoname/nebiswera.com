'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  title: string
  description: string
  confirmButton: string
  cancelButton: string
  processing: string
  successTitle: string
  successMessage: string
  alreadyUnsubscribedTitle: string
  alreadyUnsubscribedMessage: string
  errorTitle: string
  errorMessage: string
  invalidLinkTitle: string
  invalidLinkMessage: string
  loadingText: string
  reasonLabel: string
  reasonPlaceholder: string
  reasonOptions: string[]
}> = {
  ka: {
    title: 'გამოწერის გაუქმება',
    description: 'დარწმუნებული ხართ, რომ გსურთ მარკეტინგული ელ-ფოსტის მიღების გაუქმება?',
    confirmButton: 'გაუქმება',
    cancelButton: 'დაბრუნება',
    processing: 'მიმდინარეობს...',
    successTitle: 'წარმატებით გაუქმდა',
    successMessage: 'თქვენ აღარ მიიღებთ მარკეტინგულ ელ-ფოსტას. ტრანზაქციული შეტყობინებები (პაროლის აღდგენა და სხვა) კვლავ გამოგეგზავნებათ.',
    alreadyUnsubscribedTitle: 'უკვე გაუქმებულია',
    alreadyUnsubscribedMessage: 'თქვენი ელ-ფოსტა უკვე გამოწერილია მარკეტინგული შეტყობინებებისგან.',
    errorTitle: 'შეცდომა',
    errorMessage: 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ მოგვიანებით.',
    invalidLinkTitle: 'არასწორი ბმული',
    invalidLinkMessage: 'გამოწერის გაუქმების ბმული არასწორია ან ვადა გაუვიდა.',
    loadingText: 'იტვირთება...',
    reasonLabel: 'რატომ უქმებთ გამოწერას? (არჩევითი)',
    reasonPlaceholder: 'აირჩიეთ მიზეზი',
    reasonOptions: [
      'ძალიან ხშირად ვიღებ ელ-ფოსტას',
      'კონტენტი არ არის ჩემთვის საინტერესო',
      'არასოდეს დამირეგისტრირებია',
      'სხვა მიზეზი',
    ],
  },
  en: {
    title: 'Unsubscribe',
    description: 'Are you sure you want to unsubscribe from marketing emails?',
    confirmButton: 'Unsubscribe',
    cancelButton: 'Go Back',
    processing: 'Processing...',
    successTitle: 'Successfully Unsubscribed',
    successMessage: 'You will no longer receive marketing emails from us. Transactional emails (password reset, etc.) will still be sent.',
    alreadyUnsubscribedTitle: 'Already Unsubscribed',
    alreadyUnsubscribedMessage: 'Your email is already unsubscribed from marketing emails.',
    errorTitle: 'Error',
    errorMessage: 'Something went wrong. Please try again later.',
    invalidLinkTitle: 'Invalid Link',
    invalidLinkMessage: 'This unsubscribe link is invalid or has expired.',
    loadingText: 'Loading...',
    reasonLabel: 'Why are you unsubscribing? (Optional)',
    reasonPlaceholder: 'Select a reason',
    reasonOptions: [
      'I receive too many emails',
      'The content is not relevant to me',
      'I never signed up',
      'Other reason',
    ],
  },
}

type Status = 'loading' | 'ready' | 'processing' | 'success' | 'already_unsubscribed' | 'error' | 'invalid'

export function UnsubscribeClient() {
  const locale = useLocale() as Locale
  const t = content[locale]
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [status, setStatus] = useState<Status>('loading')
  const [maskedEmail, setMaskedEmail] = useState<string>('')
  const [selectedReason, setSelectedReason] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    // Verify the token
    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setMaskedEmail(data.maskedEmail)
          setStatus('ready')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => {
        setStatus('invalid')
      })
  }, [token])

  const handleUnsubscribe = async () => {
    setStatus('processing')

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          reason: selectedReason || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.alreadyUnsubscribed) {
          setStatus('already_unsubscribed')
        } else {
          setStatus('success')
        }
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card variant="raised" padding="lg" className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-text-secondary">{t.loadingText}</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-xl font-semibold text-text-primary">{t.invalidLinkTitle}</h1>
            <p className="text-text-secondary">{t.invalidLinkMessage}</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="flex flex-col items-center gap-6">
            <Mail className="w-16 h-16 text-primary-500" />
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{t.title}</h1>
              <p className="text-text-secondary mt-2">{t.description}</p>
              {maskedEmail && (
                <p className="text-sm text-text-secondary mt-2 font-mono bg-neu-dark/30 px-3 py-1 rounded-lg inline-block">
                  {maskedEmail}
                </p>
              )}
            </div>

            <div className="w-full">
              <label className="block text-sm text-text-secondary text-left mb-2">
                {t.reasonLabel}
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full p-3 rounded-lg bg-neu-base shadow-neu-inset text-text-primary outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">{t.reasonPlaceholder}</option>
                {t.reasonOptions.map((reason, idx) => (
                  <option key={idx} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 w-full">
              <Button
                variant="secondary"
                onClick={handleGoBack}
                className="flex-1"
              >
                {t.cancelButton}
              </Button>
              <Button
                variant="primary"
                onClick={handleUnsubscribe}
                className="flex-1"
              >
                {t.confirmButton}
              </Button>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-text-secondary">{t.processing}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h1 className="text-xl font-semibold text-text-primary">{t.successTitle}</h1>
            <p className="text-text-secondary">{t.successMessage}</p>
          </div>
        )}

        {status === 'already_unsubscribed' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-16 h-16 text-amber-500" />
            <h1 className="text-xl font-semibold text-text-primary">{t.alreadyUnsubscribedTitle}</h1>
            <p className="text-text-secondary">{t.alreadyUnsubscribedMessage}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-xl font-semibold text-text-primary">{t.errorTitle}</h1>
            <p className="text-text-secondary">{t.errorMessage}</p>
            <Button variant="primary" onClick={() => setStatus('ready')}>
              {locale === 'ka' ? 'სცადეთ თავიდან' : 'Try Again'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
