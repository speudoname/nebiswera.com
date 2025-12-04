'use client'

import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import type { ButtonStyle } from '@prisma/client'
import { DynamicRegistrationForm } from '../../components/DynamicRegistrationForm'

interface RegistrationButtonProps {
  buttonText: string
  belowButtonText?: string | null
  buttonStyle: ButtonStyle
  slug: string
  locale: string
  primaryColor?: string | null
}

export function RegistrationButton({
  buttonText,
  belowButtonText,
  buttonStyle,
  slug,
  locale,
  primaryColor,
}: RegistrationButtonProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [showExpandedForm, setShowExpandedForm] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isGeorgian = locale === 'ka'

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Open the popup with email prefilled
    setShowPopup(true)
  }

  // Custom button style based on primary color
  const buttonStyles = primaryColor
    ? { backgroundColor: primaryColor, borderColor: primaryColor }
    : {}

  // Popup form modal
  if (buttonStyle === 'POPUP_FORM') {
    return (
      <>
        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowPopup(true)}
            rightIcon={ArrowRight}
            style={buttonStyles}
            className="w-full sm:w-auto"
          >
            {buttonText}
          </Button>
          {belowButtonText && (
            <p className="text-sm text-text-secondary">{belowButtonText}</p>
          )}
        </div>

        {/* Modal */}
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowPopup(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-neu-base rounded-neu-lg shadow-neu-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-text-primary mb-4">
                {isGeorgian ? 'რეგისტრაცია' : 'Register Now'}
              </h3>

              <DynamicRegistrationForm slug={slug} locale={locale} />
            </div>
          </div>
        )}
      </>
    )
  }

  // Inline email input
  if (buttonStyle === 'INLINE_EMAIL') {
    return (
      <>
        <div className="space-y-2">
          <form onSubmit={handleInlineSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder={isGeorgian ? 'თქვენი ელ. ფოსტა' : 'Your email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              rightIcon={ArrowRight}
              style={buttonStyles}
              className="whitespace-nowrap"
            >
              {buttonText}
            </Button>
          </form>
          {belowButtonText && (
            <p className="text-sm text-text-secondary">{belowButtonText}</p>
          )}
        </div>

        {/* Popup Modal with prefilled email */}
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowPopup(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-neu-base rounded-neu-lg shadow-neu-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-text-primary mb-4">
                {isGeorgian ? 'რეგისტრაცია' : 'Complete Registration'}
              </h3>

              <DynamicRegistrationForm slug={slug} locale={locale} initialEmail={email} />
            </div>
          </div>
        )}
      </>
    )
  }

  // Expand form inline
  if (buttonStyle === 'EXPAND_FORM') {
    return (
      <div className="space-y-4">
        {!showExpandedForm ? (
          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowExpandedForm(true)}
              rightIcon={ArrowRight}
              style={buttonStyles}
              className="w-full sm:w-auto"
            >
              {buttonText}
            </Button>
            {belowButtonText && (
              <p className="text-sm text-text-secondary">{belowButtonText}</p>
            )}
          </div>
        ) : (
          <div className="bg-neu-light/50 rounded-neu-lg p-6 shadow-neu-inset">
            <DynamicRegistrationForm slug={slug} locale={locale} />
          </div>
        )}
      </div>
    )
  }

  // Default fallback
  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        size="lg"
        onClick={() => setShowPopup(true)}
        rightIcon={ArrowRight}
        style={buttonStyles}
        className="w-full sm:w-auto"
      >
        {buttonText}
      </Button>
      {belowButtonText && (
        <p className="text-sm text-text-secondary">{belowButtonText}</p>
      )}
    </div>
  )
}
