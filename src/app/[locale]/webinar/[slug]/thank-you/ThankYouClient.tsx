'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui'

interface ThankYouClientProps {
  slug: string
  token: string
  locale: string
}

interface RegistrationData {
  webinarTitle: string
  email: string
  firstName: string | null
  lastName: string | null
  sessionType: string
  sessionScheduledAt: string | null
  customThankYouHtml: string | null
}

export function ThankYouClient({ slug, token, locale }: ThankYouClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RegistrationData | null>(null)
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isGeorgian = locale === 'ka'

  // Fetch registration data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/webinars/${slug}/thank-you?token=${token}`)

        if (!res.ok) {
          throw new Error('Failed to load registration details')
        }

        const registrationData = await res.json()
        setData(registrationData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, token])

  // Auto-redirect logic and countdown
  useEffect(() => {
    if (!data) return

    const watchUrl = `/${locale}/webinar/${slug}/watch?token=${token}`

    // ON_DEMAND or REPLAY: Redirect immediately after 2 seconds
    if (data.sessionType === 'ON_DEMAND' || data.sessionType === 'REPLAY') {
      const timer = setTimeout(() => {
        router.push(watchUrl)
      }, 2000)
      return () => clearTimeout(timer)
    }

    // SCHEDULED: Calculate time until start and set up countdown
    if (data.sessionScheduledAt) {
      const startTime = new Date(data.sessionScheduledAt).getTime()
      const now = Date.now()
      const msUntilStart = startTime - now

      // If already started or starts very soon, redirect immediately
      if (msUntilStart <= 0) {
        router.push(watchUrl)
        return
      }

      // Update countdown every second
      setTimeUntilStart(Math.floor(msUntilStart / 1000))

      const interval = setInterval(() => {
        const newMs = startTime - Date.now()
        const newSeconds = Math.floor(newMs / 1000)

        if (newSeconds <= 0) {
          clearInterval(interval)
          router.push(watchUrl)
        } else {
          setTimeUntilStart(newSeconds)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [data, locale, slug, token, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neu-base flex items-center justify-center px-4">
        <Card variant="raised" padding="lg" className="max-w-md w-full text-center">
          <p className="text-red-600">{error || 'Failed to load registration details'}</p>
        </Card>
      </div>
    )
  }

  const formatCountdown = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600))
    const hours = Math.floor((seconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const showCountdown = data.sessionType === 'SCHEDULED' && timeUntilStart !== null && timeUntilStart > 0
  const showAutoRedirectMessage = data.sessionType === 'ON_DEMAND' || data.sessionType === 'REPLAY'

  return (
    <div className="min-h-screen bg-neu-base py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <Card variant="raised" padding="lg" className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />

          <h1 className="text-3xl font-bold text-text-primary mb-4">
            {isGeorgian ? 'რეგისტრაცია წარმატებულია!' : 'Registration Successful!'}
          </h1>

          <p className="text-lg text-text-secondary mb-6">
            {isGeorgian
              ? `გმადლობთ რეგისტრაციისთვის, ${data.firstName || data.email}!`
              : `Thank you for registering, ${data.firstName || data.email}!`}
          </p>

          <div className="bg-neu-light rounded-neu p-4 mb-6">
            <p className="text-text-secondary mb-2">
              {isGeorgian
                ? 'წვდომის ბმული გამოგზავნილია შემდეგ მისამართზე:'
                : 'An access link has been sent to:'}
            </p>
            <p className="font-semibold text-text-primary">{data.email}</p>
          </div>

          {showAutoRedirectMessage && (
            <div className="flex items-center justify-center gap-2 text-primary-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p>
                {isGeorgian
                  ? 'გადამისამართება საყურებელ ოთახში...'
                  : 'Redirecting to watch room...'}
              </p>
            </div>
          )}

          {showCountdown && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <Clock className="w-5 h-5" />
                <p>
                  {isGeorgian
                    ? 'ვებინარი იწყება:'
                    : 'Webinar starts in:'}
                </p>
              </div>

              <div className="text-4xl font-bold text-primary-600 font-mono">
                {formatCountdown(timeUntilStart)}
              </div>

              <p className="text-sm text-text-muted">
                {isGeorgian
                  ? 'თქვენ ავტომატურად გადამისამართდებით საყურებელ ოთახში როცა ვებინარი დაიწყება'
                  : 'You will be automatically redirected to the watch room when the webinar starts'}
              </p>
            </div>
          )}
        </Card>

        {/* Custom Thank You Page HTML */}
        {data.customThankYouHtml && (
          <Card variant="raised" padding="lg">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: data.customThankYouHtml }}
            />
          </Card>
        )}
      </div>
    </div>
  )
}
