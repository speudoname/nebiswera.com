/**
 * Basic Info Tab Component
 *
 * Handles webinar details, presenter info, page paths, and registration fields
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, Input } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import { RegistrationFieldsForm } from '../RegistrationFieldsForm'
import type { RegistrationFieldConfig } from '@/app/api/webinars/lib/registration-fields'

interface WebinarData {
  title: string
  slug: string
  description: string
  presenterName: string
  presenterTitle: string
  presenterBio: string
  presenterAvatar: string
  customThankYouPageHtml: string
  timezone: string
  language: 'ka' | 'en'
  completionPercent: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  landingPagePath?: string
  thankYouPagePath?: string
}

interface BasicInfoTabProps {
  data: WebinarData
  onChange: (field: keyof WebinarData, value: string | number) => void
  webinarId?: string
}

export function BasicInfoTab({ data, onChange, webinarId }: BasicInfoTabProps) {
  const [regFieldsConfig, setRegFieldsConfig] = useState<RegistrationFieldConfig | null>(null)
  const [regFieldsLoading, setRegFieldsLoading] = useState(false)
  const [regFieldsError, setRegFieldsError] = useState<string | null>(null)

  // Fetch registration fields config
  useEffect(() => {
    if (!webinarId) return

    async function fetchConfig() {
      setRegFieldsLoading(true)
      try {
        const res = await fetch(`/api/admin/webinars/${webinarId}/registration-fields`)
        if (res.ok) {
          const data = await res.json()
          setRegFieldsConfig(data.config)
        } else if (res.status === 404) {
          setRegFieldsConfig(null)
        } else {
          throw new Error('Failed to fetch registration fields config')
        }
      } catch (err) {
        setRegFieldsError(err instanceof Error ? err.message : 'Failed to load registration fields')
      } finally {
        setRegFieldsLoading(false)
      }
    }
    fetchConfig()
  }, [webinarId])

  const handleRegFieldsSave = async (fieldConfig: RegistrationFieldConfig) => {
    if (!webinarId) return

    const res = await fetch(`/api/admin/webinars/${webinarId}/registration-fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldConfig),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save registration fields')
    }

    const responseData = await res.json()
    setRegFieldsConfig(responseData.config)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column - Main info */}
      <div className="space-y-6">
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Webinar Details</h3>

          <div className="space-y-4">
            <Input
              label="Title"
              value={data.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="e.g., Master AI Tools in 60 Minutes"
              required
            />

            <div>
              <Input
                label="URL Slug"
                value={data.slug}
                onChange={(e) => onChange('slug', e.target.value)}
                placeholder="e.g., master-ai-tools"
              />
              <p className="text-xs text-text-muted mt-1">
                Auto-generated from title • Used in URL: <code className="bg-neu-dark px-1 rounded">/webinar/{data.slug || 'your-slug'}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Description
              </label>
              <textarea
                value={data.description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="What will attendees learn in this webinar?"
                rows={4}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Timezone
                </label>
                <select
                  value={data.timezone}
                  onChange={(e) => onChange('timezone', e.target.value)}
                  className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                >
                  <option value="Asia/Tbilisi">Tbilisi (GMT+4)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                  <option value="Europe/Paris">Paris (GMT+1)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
                </select>
              </div>

              <div>
                <Input
                  label="Completion %"
                  type="number"
                  min={50}
                  max={100}
                  value={data.completionPercent}
                  onChange={(e) => onChange('completionPercent', parseInt(e.target.value))}
                />
                <p className="text-xs text-text-muted mt-1">Watch % to count as completed</p>
              </div>
            </div>
          </div>
        </Card>

        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Page Paths</h3>
          <p className="text-sm text-text-muted mb-4">
            Auto-generated based on slug. These are the URLs where you'll build the landing and thank you pages.
          </p>

          <div className="space-y-4">
            <div>
              <Input
                label="Landing Page Path"
                value={data.landingPagePath || ''}
                onChange={(e) => onChange('landingPagePath', e.target.value)}
                placeholder="e.g., /ka/webinar/master-ai-tools"
              />
              <p className="text-xs text-text-muted mt-1">Auto-synced with slug</p>
            </div>

            <div>
              <Input
                label="Thank You Page Path"
                value={data.thankYouPagePath || ''}
                onChange={(e) => onChange('thankYouPagePath', e.target.value)}
                placeholder="e.g., /ka/webinar/master-ai-tools/thank-you"
              />
              <p className="text-xs text-text-muted mt-1">Auto-synced with slug</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Right column - Presenter */}
      <div>
        <Card variant="raised" padding="lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Presenter</h3>

          <div className="space-y-4">
            <Input
              label="Name"
              value={data.presenterName}
              onChange={(e) => onChange('presenterName', e.target.value)}
              placeholder="e.g., John Smith"
            />

            <Input
              label="Title / Role"
              value={data.presenterTitle}
              onChange={(e) => onChange('presenterTitle', e.target.value)}
              placeholder="e.g., CEO at TechCorp"
            />

            <Input
              label="Avatar URL"
              value={data.presenterAvatar}
              onChange={(e) => onChange('presenterAvatar', e.target.value)}
              placeholder="https://..."
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Bio
              </label>
              <textarea
                value={data.presenterBio}
                onChange={(e) => onChange('presenterBio', e.target.value)}
                placeholder="Brief presenter biography..."
                rows={4}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
              />
            </div>

            {/* Custom Thank You Page HTML */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Custom Thank You Page HTML
                <span className="text-xs text-text-muted ml-2">(Optional - shown below standard message)</span>
              </label>
              <textarea
                value={data.customThankYouPageHtml}
                onChange={(e) => onChange('customThankYouPageHtml', e.target.value)}
                placeholder="<div>Custom HTML content for thank you page...</div>"
                rows={6}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none font-mono"
              />
              <p className="text-xs text-text-muted mt-1">
                This HTML will be displayed below the standard thank you message after registration.
              </p>
            </div>

            {/* Presenter preview */}
            {data.presenterName && (
              <div className="mt-4 p-4 bg-neu-base rounded-neu">
                <p className="text-xs text-text-muted mb-2">Preview:</p>
                <div className="flex items-center gap-3">
                  {data.presenterAvatar ? (
                    <img
                      src={data.presenterAvatar}
                      alt={data.presenterName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {data.presenterName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-text-primary">{data.presenterName}</div>
                    {data.presenterTitle && (
                      <div className="text-sm text-text-muted">{data.presenterTitle}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Registration Fields - Full width card below the two columns */}
      {webinarId && (
        <div className="lg:col-span-2">
          <Card variant="raised" padding="lg">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Registration Fields</h3>
            {regFieldsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
            ) : regFieldsError ? (
              <div className="text-center py-8 text-red-600">{regFieldsError}</div>
            ) : (
              <RegistrationFieldsForm
                webinarId={webinarId}
                initialConfig={regFieldsConfig}
                onSave={handleRegFieldsSave}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
