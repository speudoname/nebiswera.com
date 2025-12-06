'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Locale } from '@/i18n/config'

const content: Record<Locale, {
  title: string
  description: string
  phoneLabel: string
  phonePlaceholder: string
  confirmButton: string
  processing: string
  successTitle: string
  successMessage: string
  alreadyUnsubscribedTitle: string
  alreadyUnsubscribedMessage: string
  errorTitle: string
  errorMessage: string
  invalidPhoneTitle: string
  invalidPhoneMessage: string
  tryAgain: string
  phoneFormat: string
}> = {
  ka: {
    title: 'SMS-ის გამოწერის გაუქმება',
    description: 'შეიყვანეთ თქვენი ტელეფონის ნომერი SMS მარკეტინგის გასაუქმებლად',
    phoneLabel: 'ტელეფონის ნომერი',
    phonePlaceholder: '5XX XXX XXX',
    confirmButton: 'გაუქმება',
    processing: 'მიმდინარეობს...',
    successTitle: 'წარმატებით გაუქმდა',
    successMessage: 'თქვენ აღარ მიიღებთ მარკეტინგულ SMS შეტყობინებებს. სერვისული შეტყობინებები (დადასტურება, შეხსენება) კვლავ გამოგეგზავნებათ.',
    alreadyUnsubscribedTitle: 'უკვე გაუქმებულია',
    alreadyUnsubscribedMessage: 'თქვენი ნომერი უკვე გამოწერილია მარკეტინგული SMS-ებისგან.',
    errorTitle: 'შეცდომა',
    errorMessage: 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ მოგვიანებით.',
    invalidPhoneTitle: 'არასწორი ნომერი',
    invalidPhoneMessage: 'გთხოვთ შეიყვანოთ სწორი საქართველოს ტელეფონის ნომერი.',
    tryAgain: 'სცადეთ თავიდან',
    phoneFormat: 'ფორმატი: 5XX XXX XXX',
  },
  en: {
    title: 'Unsubscribe from SMS',
    description: 'Enter your phone number to unsubscribe from SMS marketing',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '5XX XXX XXX',
    confirmButton: 'Unsubscribe',
    processing: 'Processing...',
    successTitle: 'Successfully Unsubscribed',
    successMessage: 'You will no longer receive marketing SMS from us. Service messages (confirmations, reminders) will still be sent.',
    alreadyUnsubscribedTitle: 'Already Unsubscribed',
    alreadyUnsubscribedMessage: 'Your number is already unsubscribed from marketing SMS.',
    errorTitle: 'Error',
    errorMessage: 'Something went wrong. Please try again later.',
    invalidPhoneTitle: 'Invalid Number',
    invalidPhoneMessage: 'Please enter a valid Georgian phone number.',
    tryAgain: 'Try Again',
    phoneFormat: 'Format: 5XX XXX XXX',
  },
}

type Status = 'ready' | 'processing' | 'success' | 'already_unsubscribed' | 'error' | 'invalid_phone'

export function SmsUnsubscribeClient() {
  const locale = useLocale() as Locale
  const t = content[locale]

  const [status, setStatus] = useState<Status>('ready')
  const [phone, setPhone] = useState('')

  const formatPhoneInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as XXX XXX XXX
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setPhone(formatted)
  }

  const handleUnsubscribe = async () => {
    // Get just the digits
    const digits = phone.replace(/\D/g, '')

    // Validate phone
    if (digits.length < 9) {
      setStatus('invalid_phone')
      return
    }

    setStatus('processing')

    try {
      const response = await fetch('/api/sms/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.message?.includes('already')) {
          setStatus('already_unsubscribed')
        } else {
          setStatus('success')
        }
      } else {
        if (data.error?.includes('Invalid')) {
          setStatus('invalid_phone')
        } else {
          setStatus('error')
        }
      }
    } catch {
      setStatus('error')
    }
  }

  const handleReset = () => {
    setStatus('ready')
    setPhone('')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card variant="raised" padding="lg" className="max-w-md w-full text-center">
        {status === 'ready' && (
          <div className="flex flex-col items-center gap-6">
            <MessageSquare className="w-16 h-16 text-primary-500" />
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{t.title}</h1>
              <p className="text-text-secondary mt-2">{t.description}</p>
            </div>

            <div className="w-full">
              <label className="block text-sm text-text-secondary text-left mb-2">
                {t.phoneLabel}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={t.phonePlaceholder}
                maxLength={11}
                className="w-full p-3 rounded-lg bg-neu-base shadow-neu-inset text-text-primary outline-none focus:ring-2 focus:ring-primary-500/30 text-center text-lg tracking-wider font-mono"
              />
              <p className="text-xs text-text-secondary mt-2">{t.phoneFormat}</p>
            </div>

            <Button
              variant="primary"
              onClick={handleUnsubscribe}
              className="w-full"
              disabled={phone.replace(/\D/g, '').length < 9}
            >
              {t.confirmButton}
            </Button>
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

        {status === 'invalid_phone' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-xl font-semibold text-text-primary">{t.invalidPhoneTitle}</h1>
            <p className="text-text-secondary">{t.invalidPhoneMessage}</p>
            <Button variant="primary" onClick={handleReset}>
              {t.tryAgain}
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-xl font-semibold text-text-primary">{t.errorTitle}</h1>
            <p className="text-text-secondary">{t.errorMessage}</p>
            <Button variant="primary" onClick={handleReset}>
              {t.tryAgain}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
