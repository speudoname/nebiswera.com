'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import type { RegistrationFieldConfig, RegistrationFormData, CustomField } from '@/types/registration-fields'

interface Session {
  id: string
  scheduledAt: string
  type: string
}

interface RegistrationOptions {
  onDemandAvailable: boolean
  replayAvailable: boolean
}

interface DynamicRegistrationFormProps {
  slug: string
  locale: string
}

export function DynamicRegistrationForm({ slug, locale }: DynamicRegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sessions, setSessions] = useState<Session[]>([])
  const [options, setOptions] = useState<RegistrationOptions | null>(null)
  const [fieldConfig, setFieldConfig] = useState<RegistrationFieldConfig | null>(null)

  const [formData, setFormData] = useState<RegistrationFormData & { sessionId: string; sessionType: string }>({
    email: '',
    firstName: '',
    lastName: '',
    fullName: '',
    phone: '',
    sessionId: '',
    sessionType: '',
    customFieldResponses: {},
  })

  const isGeorgian = locale === 'ka'

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both sessions and field config
        const [sessionsRes, fieldsRes] = await Promise.all([
          fetch(`/api/webinars/${slug}/register`),
          fetch(`/api/webinars/${slug}/registration-fields`),
        ])

        if (sessionsRes.ok) {
          const data = await sessionsRes.json()
          setSessions(data.sessions || [])
          setOptions(data.options || null)
        }

        if (fieldsRes.ok) {
          const data = await fieldsRes.json()
          setFieldConfig(data.config)
        }
      } catch (err) {
        console.error('Failed to fetch registration data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Build registration payload
      const payload: any = {
        email: formData.email,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      // Add name fields based on format
      if (fieldConfig?.nameFormat === 'FULL' && formData.fullName) {
        // Split full name into first and last
        const nameParts = formData.fullName.trim().split(' ')
        payload.firstName = nameParts[0] || ''
        payload.lastName = nameParts.slice(1).join(' ') || ''
      } else {
        payload.firstName = formData.firstName
        payload.lastName = formData.lastName
      }

      // Add phone if configured
      if (fieldConfig?.showPhone && formData.phone) {
        payload.phone = formData.phone
      }

      // Add custom field responses
      if (formData.customFieldResponses && Object.keys(formData.customFieldResponses).length > 0) {
        payload.customFieldResponses = formData.customFieldResponses
      }

      // Add session info
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

      // Redirect to watch page
      router.push(`/${locale}/webinar/${slug}/watch?token=${data.registration.accessToken}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSessionSelect = (sessionId: string, sessionType: string) => {
    setFormData({ ...formData, sessionId, sessionType })
  }

  const handleCustomFieldChange = (fieldId: string, value: string | boolean) => {
    setFormData({
      ...formData,
      customFieldResponses: {
        ...formData.customFieldResponses,
        [fieldId]: value,
      },
    })
  }

  const renderCustomField = (field: CustomField) => {
    const value = formData.customFieldResponses?.[field.id] || ''

    switch (field.type) {
      case 'text':
        return (
          <Input
            key={field.id}
            label={field.label}
            required={field.required}
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )

      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              required={field.required}
              value={value as string}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              required={field.required}
              value={value as string}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="">{isGeorgian ? 'აირჩიეთ...' : 'Select...'}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'checkbox':
        return (
          <label key={field.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              required={field.required}
              checked={!!value}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 rounded border-2 border-neu-dark text-primary-600 focus:ring-2 focus:ring-primary-400"
            />
            <span className="text-sm text-text-secondary">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Fields */}
      {fieldConfig?.nameFormat === 'FULL' ? (
        <Input
          label={isGeorgian ? 'სახელი და გვარი' : 'Full Name'}
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder={isGeorgian ? 'თქვენი სახელი და გვარი' : 'Your full name'}
        />
      ) : (
        <>
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
        </>
      )}

      {/* Email - always required */}
      <Input
        label={isGeorgian ? 'ელ. ფოსტა' : 'Email'}
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder={isGeorgian ? 'თქვენი ელ. ფოსტა' : 'Your email address'}
      />

      {/* Phone - if configured */}
      {fieldConfig?.showPhone && (
        <Input
          label={isGeorgian ? 'ტელეფონი' : 'Phone'}
          type="tel"
          required={fieldConfig.phoneRequired}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder={isGeorgian ? 'თქვენი ტელეფონი' : 'Your phone number'}
        />
      )}

      {/* Custom Fields */}
      {fieldConfig?.customFields?.map((field) => renderCustomField(field))}

      {/* Session Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {isGeorgian ? 'აირჩიეთ სესია' : 'Select Session'}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          required
          value={formData.sessionId || formData.sessionType || ''}
          onChange={(e) => {
            const value = e.target.value
            if (value.startsWith('session-')) {
              const sessionId = value.replace('session-', '')
              const session = sessions.find((s) => s.id === sessionId)
              if (session) {
                handleSessionSelect(session.id, session.type)
              }
            } else {
              handleSessionSelect('', value)
            }
          }}
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        >
          <option value="">{isGeorgian ? 'აირჩიეთ სესია...' : 'Select a session...'}</option>

          {sessions.length > 0 && (
            <optgroup label={isGeorgian ? 'დაგეგმილი სესიები' : 'Scheduled Sessions'}>
              {sessions.map((session) => (
                <option key={session.id} value={`session-${session.id}`}>
                  {new Date(session.scheduledAt).toLocaleDateString(
                    isGeorgian ? 'ka-GE' : 'en-US',
                    { weekday: 'short', month: 'short', day: 'numeric' }
                  )}{' '}
                  {new Date(session.scheduledAt).toLocaleTimeString(
                    isGeorgian ? 'ka-GE' : 'en-US',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </option>
              ))}
            </optgroup>
          )}

          {(options?.onDemandAvailable || options?.replayAvailable) && (
            <optgroup label={isGeorgian ? 'სხვა ვარიანტები' : 'Other Options'}>
              {options?.onDemandAvailable && (
                <option value="ON_DEMAND">
                  {isGeorgian ? 'მოთხოვნისამებრ ყურება - იყურეთ ნებისმიერ დროს' : 'Watch On-Demand - Start anytime'}
                </option>
              )}
              {options?.replayAvailable && (
                <option value="REPLAY">
                  {isGeorgian ? 'რიპლეი - იხილეთ ჩანაწერი' : 'Watch Replay - View recording'}
                </option>
              )}
            </optgroup>
          )}
        </select>
      </div>

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
        disabled={isLoading}
        className="w-full"
        rightIcon={ArrowRight}
      >
        {isGeorgian ? 'რეგისტრაცია' : 'Register & Watch Now'}
      </Button>
    </form>
  )
}
