'use client'

import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react'

interface EndScreenProps {
  title?: string | null
  message?: string | null
  buttonText?: string | null
  buttonUrl?: string | null
  redirectUrl?: string | null
  redirectDelay?: number | null // in minutes
  onClose?: () => void
  slug: string
  accessToken: string
}

export function EndScreen({
  title,
  message,
  buttonText,
  buttonUrl,
  redirectUrl,
  redirectDelay,
  onClose,
  slug,
  accessToken,
}: EndScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const hasTrackedView = useRef(false)

  // Track end screen view
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true
      fetch(`/api/webinars/${slug}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          eventType: 'END_SCREEN_VIEWED',
          metadata: {
            hasButton: !!(buttonText && buttonUrl),
            hasRedirect: !!redirectUrl,
            redirectDelay,
          },
        }),
      }).catch((error) => {
        console.error('Failed to track end screen view:', error)
      })
    }
  }, [slug, accessToken, buttonText, buttonUrl, redirectUrl, redirectDelay])

  // Handle redirect countdown
  useEffect(() => {
    if (redirectUrl && redirectDelay && redirectDelay > 0) {
      // Convert minutes to seconds
      const delaySeconds = redirectDelay * 60
      setCountdown(delaySeconds)

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            // Track redirect before navigating
            fetch(`/api/webinars/${slug}/analytics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: accessToken,
                eventType: 'END_SCREEN_REDIRECTED',
                metadata: {
                  redirectUrl,
                  automatic: true,
                },
              }),
            }).catch(() => {})
            window.location.href = redirectUrl
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [redirectUrl, redirectDelay, slug, accessToken])

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}s`
  }

  const handleButtonClick = () => {
    // Track CTA button click
    fetch(`/api/webinars/${slug}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: accessToken,
        eventType: 'END_SCREEN_CTA_CLICKED',
        metadata: {
          buttonText,
          buttonUrl,
        },
      }),
    }).catch((error) => {
      console.error('Failed to track end screen CTA click:', error)
    })
  }

  const handleSkipRedirect = () => {
    // Track manual redirect
    fetch(`/api/webinars/${slug}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: accessToken,
        eventType: 'END_SCREEN_REDIRECTED',
        metadata: {
          redirectUrl,
          automatic: false,
        },
      }),
    }).catch(() => {})

    setCountdown(null)
    if (redirectUrl) {
      window.location.href = redirectUrl
    }
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-8 z-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {title || 'Thank You for Watching!'}
        </h2>

        {/* Message */}
        {message && (
          <div className="text-lg text-gray-600 mb-8 whitespace-pre-wrap">
            {message}
          </div>
        )}

        {/* CTA Button */}
        {buttonText && buttonUrl && (
          <div className="mb-6">
            <a
              href={buttonUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleButtonClick}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold text-lg hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
            >
              {buttonText}
              {buttonUrl.startsWith('http') ? (
                <ExternalLink className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </a>
          </div>
        )}

        {/* Countdown for redirect */}
        {countdown !== null && countdown > 0 && redirectUrl && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Redirecting in <span className="font-semibold text-primary-600">{formatCountdown(countdown)}</span>
            </p>
            <button
              onClick={handleSkipRedirect}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Skip and redirect now
            </button>
          </div>
        )}

        {/* Close button (if provided) */}
        {onClose && !redirectUrl && (
          <button
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}
