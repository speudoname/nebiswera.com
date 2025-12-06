'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Badge } from '@/components/ui'
import { BarChart3, Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle2, XCircle, FlaskConical } from 'lucide-react'
import Link from 'next/link'

interface PixelConfig {
  fbPixelId: string | null
  fbAccessToken: string | null
  fbTestEventCode: string | null
  fbPixelEnabled: boolean
  fbTestMode: boolean
}

export default function FacebookPixelSettings() {
  const [config, setConfig] = useState<PixelConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    fbPixelId: '',
    fbAccessToken: '',
    fbTestEventCode: '',
    fbPixelEnabled: false,
    fbTestMode: false,
  })

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pixel/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
        setFormData({
          fbPixelId: data.fbPixelId || '',
          fbAccessToken: data.fbAccessToken || '',
          fbTestEventCode: data.fbTestEventCode || '',
          fbPixelEnabled: data.fbPixelEnabled || false,
          fbTestMode: data.fbTestMode || false,
        })
      }
    } catch (error) {
      console.error('Failed to fetch pixel config:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/pixel/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setConfig(data.config)
        setFormData({
          fbPixelId: data.config.fbPixelId || '',
          fbAccessToken: data.config.fbAccessToken || '',
          fbTestEventCode: data.config.fbTestEventCode || '',
          fbPixelEnabled: data.config.fbPixelEnabled || false,
          fbTestMode: data.config.fbTestMode || false,
        })
        setMessage({ type: 'success', text: 'Pixel configuration saved!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' })
      }
    } catch (error) {
      console.error('Failed to save pixel config:', error)
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/pixel/config', {
        method: 'POST',
      })

      const data = await res.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Connection successful! Events received: ${data.eventsReceived}`,
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Connection test failed',
        })
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      setMessage({ type: 'error', text: 'Failed to test connection' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-neu-light rounded-neu shadow-neu mb-6">
        <div className="px-6 py-4 border-b border-neu-dark">
          <h3 className="no-margin flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            Facebook Pixel & Conversions API
          </h3>
        </div>
        <div className="px-6 py-8 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-primary-600 animate-spin" />
        </div>
      </div>
    )
  }

  const hasPixelId = Boolean(config?.fbPixelId)
  const hasAccessToken = config?.fbAccessToken && config.fbAccessToken.includes('*')

  return (
    <div className="bg-neu-light rounded-neu shadow-neu mb-6">
      <div className="px-6 py-4 border-b border-neu-dark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="no-margin flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              Facebook Pixel & Conversions API
            </h3>
            <p className="text-body-sm text-muted mt-1 no-margin">
              Track user actions for Facebook Ads optimization with both browser and server-side tracking.
            </p>
          </div>
          <Link
            href="/admin/pixel-logs"
            className="text-body-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View Logs <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`mx-6 mt-4 p-3 rounded-neu flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-secondary-50 border border-secondary-200 text-secondary-700'
              : 'bg-primary-100 border border-primary-300 text-primary-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="px-6 py-4 space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {formData.fbPixelEnabled ? (
              <Badge variant="success">Tracking Enabled</Badge>
            ) : (
              <Badge variant="default">Tracking Disabled</Badge>
            )}
            {formData.fbTestMode && (
              <Badge variant="warning">Test Mode Active</Badge>
            )}
            {hasPixelId && <Badge variant="info">Pixel ID Set</Badge>}
            {hasAccessToken && <Badge variant="info">Access Token Set</Badge>}
          </div>

          {/* Pixel ID */}
          <div>
            <label htmlFor="fbPixelId" className="block text-body-sm font-medium text-secondary mb-1">
              Facebook Pixel ID
            </label>
            <Input
              id="fbPixelId"
              type="text"
              placeholder="e.g., 123456789012345"
              value={formData.fbPixelId}
              onChange={(e) => setFormData({ ...formData, fbPixelId: e.target.value })}
            />
            <p className="text-caption text-muted mt-1 no-margin">
              Find this in Facebook Events Manager under Data Sources &gt; Pixels
            </p>
          </div>

          {/* Access Token */}
          <div>
            <label htmlFor="fbAccessToken" className="block text-body-sm font-medium text-secondary mb-1">
              Conversions API Access Token
            </label>
            <div className="relative">
              <input
                id="fbAccessToken"
                type={showAccessToken ? 'text' : 'password'}
                placeholder={hasAccessToken ? 'Token is set (enter new value to change)' : 'Enter your access token'}
                value={formData.fbAccessToken}
                onChange={(e) => setFormData({ ...formData, fbAccessToken: e.target.value })}
                className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 pr-10 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-primary-600 transition-colors"
                title={showAccessToken ? 'Hide token' : 'Show token'}
              >
                {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-caption text-muted mt-1 no-margin">
              Required for server-side tracking. Generate in Events Manager &gt; Settings &gt; Conversions API.
            </p>
          </div>

          {/* Test Event Code */}
          <div>
            <label htmlFor="fbTestEventCode" className="block text-body-sm font-medium text-secondary mb-1">
              Test Event Code
            </label>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-text-secondary" />
              <Input
                id="fbTestEventCode"
                type="text"
                placeholder="e.g., TEST12345"
                value={formData.fbTestEventCode}
                onChange={(e) => setFormData({ ...formData, fbTestEventCode: e.target.value })}
              />
            </div>
            <p className="text-caption text-muted mt-1 no-margin">
              Used when Test Mode is enabled. Find this in Events Manager &gt; Test Events.
            </p>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Enable Tracking */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.fbPixelEnabled}
                  onChange={(e) => setFormData({ ...formData, fbPixelEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neu-base rounded-full shadow-neu-inset peer-checked:bg-primary-500 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div>
                <span className="text-body-sm font-medium text-secondary group-hover:text-primary-600 transition-colors">
                  Enable Tracking
                </span>
                <p className="text-caption text-muted no-margin">
                  Start sending events to Facebook
                </p>
              </div>
            </label>

            {/* Test Mode */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.fbTestMode}
                  onChange={(e) => setFormData({ ...formData, fbTestMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neu-base rounded-full shadow-neu-inset peer-checked:bg-amber-500 transition-colors"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div>
                <span className="text-body-sm font-medium text-secondary group-hover:text-primary-600 transition-colors">
                  Test Mode
                </span>
                <p className="text-caption text-muted no-margin">
                  Events visible in Test Events only
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" loading={saving}>
              Save Pixel Settings
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !hasPixelId}
              className="flex items-center gap-2"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
