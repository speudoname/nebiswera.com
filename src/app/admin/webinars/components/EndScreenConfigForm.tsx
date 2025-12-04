'use client'

import { useState, useEffect } from 'react'
import { Card, Input, Button } from '@/components/ui'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

interface EndScreenConfig {
  enabled: boolean
  title: string | null
  message: string | null
  buttonText: string | null
  buttonUrl: string | null
  redirectUrl: string | null
  redirectDelay: number | null
}

interface EndScreenConfigFormProps {
  webinarId: string
}

export function EndScreenConfigForm({ webinarId }: EndScreenConfigFormProps) {
  const [config, setConfig] = useState<EndScreenConfig>({
    enabled: true,
    title: null,
    message: null,
    buttonText: null,
    buttonUrl: null,
    redirectUrl: null,
    redirectDelay: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load existing config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/admin/webinars/${webinarId}`)
        if (response.ok) {
          const data = await response.json()
          setConfig({
            enabled: data.endScreenEnabled ?? true,
            title: data.endScreenTitle,
            message: data.endScreenMessage,
            buttonText: data.endScreenButtonText,
            buttonUrl: data.endScreenButtonUrl,
            redirectUrl: data.endScreenRedirectUrl,
            redirectDelay: data.endScreenRedirectDelay,
          })
        }
      } catch (error) {
        console.error('Failed to load end screen config:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [webinarId])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const response = await fetch(`/api/admin/webinars/${webinarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endScreenEnabled: config.enabled,
          endScreenTitle: config.title || null,
          endScreenMessage: config.message || null,
          endScreenButtonText: config.buttonText || null,
          endScreenButtonUrl: config.buttonUrl || null,
          endScreenRedirectUrl: config.redirectUrl || null,
          endScreenRedirectDelay: config.redirectDelay || null,
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save end screen config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card variant="raised" padding="lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="raised" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">End Screen</h3>
            <p className="text-sm text-text-muted mt-1">
              Configure what viewers see after the webinar ends
            </p>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
          <span className="text-sm font-medium text-text-primary">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {config.enabled && (
          <>
            {/* Title */}
            <div>
              <Input
                label="Title"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value || null })}
                placeholder="Thank You for Watching!"
              />
              <p className="text-xs text-text-muted mt-1">Shown at the top of the end screen</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Message
                <span className="text-xs text-text-muted ml-2">(Optional)</span>
              </label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value || null })}
                placeholder="Thank you for attending! Check your email for next steps..."
                rows={4}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
              />
              <p className="text-xs text-text-muted mt-1">
                Shown below the title
              </p>
            </div>

            {/* Call-to-Action Button */}
            <div className="border-t border-neu-dark pt-6">
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Call-to-Action Button (Optional)
              </h4>

              <div className="space-y-4">
                <div>
                  <Input
                    label="Button Text"
                    value={config.buttonText || ''}
                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value || null })}
                    placeholder="Get Started Now"
                  />
                  <p className="text-xs text-text-muted mt-1">Leave empty to hide the button</p>
                </div>

                <div>
                  <Input
                    label="Button URL"
                    value={config.buttonUrl || ''}
                    onChange={(e) => setConfig({ ...config, buttonUrl: e.target.value || null })}
                    placeholder="https://example.com/signup"
                  />
                  <p className="text-xs text-text-muted mt-1">Where the button should link to</p>
                </div>
              </div>
            </div>

            {/* Auto-Redirect */}
            <div className="border-t border-neu-dark pt-6">
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Auto-Redirect (Optional)
              </h4>

              <div className="space-y-4">
                <div>
                  <Input
                    label="Redirect URL"
                    value={config.redirectUrl || ''}
                    onChange={(e) => setConfig({ ...config, redirectUrl: e.target.value || null })}
                    placeholder="https://example.com/thank-you"
                  />
                  <p className="text-xs text-text-muted mt-1">Automatically redirect viewers to this URL after the end screen</p>
                </div>

                <div>
                  <Input
                    label="Redirect Delay (minutes)"
                    type="number"
                    value={config.redirectDelay !== null ? String(config.redirectDelay) : ''}
                    onChange={(e) => setConfig({
                      ...config,
                      redirectDelay: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="2"
                    min={0}
                    max={60}
                  />
                  <p className="text-xs text-text-muted mt-1">How long to wait before redirecting</p>
                </div>
              </div>

              {config.redirectUrl && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-neu">
                  <p className="text-sm text-blue-900">
                    💡 Viewers will be redirected to <strong>{config.redirectUrl}</strong> after{' '}
                    <strong>{config.redirectDelay || 0} minute(s)</strong> with a countdown timer.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3 pt-4 border-t border-neu-dark">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save End Screen
              </>
            )}
          </Button>

          {saveSuccess && (
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Saved successfully!
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
