'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, User, Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'

interface WebinarLandingClientProps {
  webinar: {
    id: string
    title: string
    description: string | null
    presenterName: string | null
    presenterTitle: string | null
    presenterBio: string | null
    presenterAvatar: string | null
    thumbnailUrl: string | null
    scheduleConfig: any
  }
  slug: string
  locale: string
}

interface Session {
  id: string
  scheduledAt: string
  type: string
}

interface RegistrationOptions {
  onDemandAvailable: boolean
  replayAvailable: boolean
  justInTimeEnabled: boolean
  justInTimeMinutes: number
  useAttendeeTimezone: boolean
}

export function WebinarLandingClient({ webinar, slug, locale }: WebinarLandingClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [options, setOptions] = useState<RegistrationOptions | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    sessionId: '',
    sessionType: '',
  })

  const isGeorgian = locale === 'ka'

  // Fetch available sessions on mount
  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch(`/api/webinars/${slug}/register`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
          setOptions(data.options || null)
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err)
      } finally {
        setIsLoadingSessions(false)
      }
    }
    fetchSessions()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Build registration payload
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      // Add session info based on selection
      if (formData.sessionId) {
        payload.sessionId = formData.sessionId
      } else if (formData.sessionType) {
        payload.sessionType = formData.sessionType
      }

      const response = await fetch(`/api/webinars/${slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to watch page with token
      router.push(`/${locale}/webinar/${slug}/watch?token=${data.registration.accessToken}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSessionSelect = (sessionId: string, sessionType: string) => {
    setFormData({
      ...formData,
      sessionId,
      sessionType,
    })
  }

  return (
    <div className="min-h-screen bg-neu-base">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {webinar.title}
            </h1>
            {webinar.description && (
              <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
                {webinar.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Webinar Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Thumbnail */}
            {webinar.thumbnailUrl && (
              <Card variant="raised" padding="none">
                <img
                  src={webinar.thumbnailUrl}
                  alt={webinar.title}
                  className="w-full h-auto rounded-neu-lg"
                />
              </Card>
            )}

            {/* Presenter Info */}
            <Card variant="raised" padding="lg">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {isGeorgian ? 'წამყვანის შესახებ' : 'About the Presenter'}
              </h2>
              <div className="flex items-start gap-6">
                {webinar.presenterAvatar && (
                  <img
                    src={webinar.presenterAvatar}
                    alt={webinar.presenterName ?? ''}
                    className="w-24 h-24 rounded-full object-cover shadow-neu"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text-primary">
                    {webinar.presenterName}
                  </h3>
                  {webinar.presenterTitle && (
                    <p className="text-text-secondary mt-1">{webinar.presenterTitle}</p>
                  )}
                  {webinar.presenterBio && (
                    <p className="text-text-secondary mt-4 leading-relaxed">
                      {webinar.presenterBio}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Registration Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card variant="raised" padding="lg">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-text-primary">
                    {isGeorgian ? 'რეგისტრაცია' : 'Register Now'}
                  </h2>
                  <p className="text-text-secondary mt-2">
                    {isGeorgian
                      ? 'შეავსეთ ფორმა ვებინარზე წვდომისთვის'
                      : 'Fill out the form to access the webinar'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label={isGeorgian ? 'სახელი' : 'First Name'}
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={isGeorgian ? 'თქვენი სახელი' : 'Your first name'}
                  />

                  <Input
                    label={isGeorgian ? 'გვარი' : 'Last Name'}
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={isGeorgian ? 'თქვენი გვარი' : 'Your last name'}
                  />

                  <Input
                    label={isGeorgian ? 'ელ. ფოსტა' : 'Email'}
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={isGeorgian ? 'თქვენი ელ. ფოსტა' : 'Your email address'}
                  />

                  {/* Session Selection */}
                  {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        {isGeorgian ? 'აირჩიეთ სესია' : 'Select Session'}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="space-y-2">
                        {/* Scheduled Sessions */}
                        {sessions.map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => handleSessionSelect(session.id, session.type)}
                            className={`w-full text-left p-4 rounded-neu border-2 transition-all ${
                              formData.sessionId === session.id
                                ? 'border-primary-500 bg-primary-50 shadow-neu'
                                : 'border-transparent bg-neu-base shadow-neu-inset hover:shadow-neu'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-primary-600" />
                              <div className="flex-1">
                                <div className="font-medium text-text-primary">
                                  {new Date(session.scheduledAt).toLocaleDateString(
                                    isGeorgian ? 'ka-GE' : 'en-US',
                                    { weekday: 'long', month: 'long', day: 'numeric' }
                                  )}
                                </div>
                                <div className="text-sm text-text-secondary">
                                  {new Date(session.scheduledAt).toLocaleTimeString(
                                    isGeorgian ? 'ka-GE' : 'en-US',
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}

                        {/* On-Demand Option */}
                        {options?.onDemandAvailable && (
                          <button
                            type="button"
                            onClick={() => handleSessionSelect('', 'ON_DEMAND')}
                            className={`w-full text-left p-4 rounded-neu border-2 transition-all ${
                              formData.sessionType === 'ON_DEMAND'
                                ? 'border-primary-500 bg-primary-50 shadow-neu'
                                : 'border-transparent bg-neu-base shadow-neu-inset hover:shadow-neu'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-primary-600" />
                              <div className="flex-1">
                                <div className="font-medium text-text-primary">
                                  {isGeorgian ? 'მოთხოვნისამებრ ყურება' : 'Watch On-Demand'}
                                </div>
                                <div className="text-sm text-text-secondary">
                                  {isGeorgian ? 'იყურეთ ნებისმიერ დროს' : 'Start watching anytime'}
                                </div>
                              </div>
                            </div>
                          </button>
                        )}

                        {/* Replay Option */}
                        {options?.replayAvailable && (
                          <button
                            type="button"
                            onClick={() => handleSessionSelect('', 'REPLAY')}
                            className={`w-full text-left p-4 rounded-neu border-2 transition-all ${
                              formData.sessionType === 'REPLAY'
                                ? 'border-primary-500 bg-primary-50 shadow-neu'
                                : 'border-transparent bg-neu-base shadow-neu-inset hover:shadow-neu'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-primary-600" />
                              <div className="flex-1">
                                <div className="font-medium text-text-primary">
                                  {isGeorgian ? 'რიპლეი' : 'Watch Replay'}
                                </div>
                                <div className="text-sm text-text-secondary">
                                  {isGeorgian ? 'იხილეთ ჩანაწერი' : 'View recorded session'}
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-neu p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isLoadingSessions || (!formData.sessionId && !formData.sessionType)}
                    className="w-full"
                    rightIcon={ArrowRight}
                  >
                    {isGeorgian ? 'რეგისტრაცია' : 'Register & Watch Now'}
                  </Button>
                </form>

                <p className="text-xs text-text-muted text-center mt-4">
                  {isGeorgian
                    ? 'რეგისტრაციით თქვენ ეთანხმებით ჩვენს პირობებს'
                    : 'By registering, you agree to our terms and conditions'}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
