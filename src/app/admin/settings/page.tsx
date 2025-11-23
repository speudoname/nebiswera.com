'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Badge } from '@/components/ui'
import { Mail, User, Link, Loader2 } from 'lucide-react'

interface Settings {
  postmarkServerToken: string | null
  postmarkStreamName: string
  emailFromAddress: string | null
  emailFromName: string
  hasPostmarkToken: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    postmarkServerToken: '',
    postmarkStreamName: 'outbound',
    emailFromAddress: '',
    emailFromName: 'Nebiswera',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data)
      setFormData({
        postmarkServerToken: data.postmarkServerToken || '',
        postmarkStreamName: data.postmarkStreamName || 'outbound',
        emailFromAddress: data.emailFromAddress || '',
        emailFromName: data.emailFromName || 'Nebiswera',
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setFormData({
          ...formData,
          postmarkServerToken: data.postmarkServerToken || '',
        })
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="no-margin">Settings</h1>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-neu ${
            message.type === 'success'
              ? 'bg-secondary-50 border border-secondary-200 text-secondary-700'
              : 'bg-primary-100 border border-primary-300 text-primary-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Postmark Settings */}
        <div className="bg-neu-light rounded-neu shadow-neu mb-6">
          <div className="px-6 py-4 border-b border-neu-dark">
            <h3 className="no-margin flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-600" />
              Postmark Email Settings
            </h3>
            <p className="text-body-sm text-muted mt-1 no-margin">
              Configure your Postmark server for sending transactional emails.
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="postmarkServerToken" className="block text-body-sm font-medium text-secondary mb-1">
                Server API Token
              </label>
              <div className="relative">
                <input
                  id="postmarkServerToken"
                  name="postmarkServerToken"
                  type="password"
                  placeholder={settings?.hasPostmarkToken ? 'Token is set (enter new value to change)' : 'Enter your Postmark server token'}
                  value={formData.postmarkServerToken}
                  onChange={(e) => setFormData({ ...formData, postmarkServerToken: e.target.value })}
                  className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                />
                {settings?.hasPostmarkToken && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge variant="success">Configured</Badge>
                  </div>
                )}
              </div>
              <p className="text-caption text-muted mt-1 no-margin">
                Find this in your Postmark account under Server &gt; API Tokens
              </p>
            </div>

            <div>
              <label htmlFor="postmarkStreamName" className="block text-body-sm font-medium text-secondary mb-1">
                Message Stream
              </label>
              <select
                id="postmarkStreamName"
                value={formData.postmarkStreamName}
                onChange={(e) => setFormData({ ...formData, postmarkStreamName: e.target.value })}
                className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              >
                <option value="outbound">outbound (Transactional)</option>
                <option value="broadcast">broadcast (Marketing)</option>
              </select>
              <p className="text-caption text-muted mt-1 no-margin">
                Use &quot;outbound&quot; for transactional emails like verification and password reset
              </p>
            </div>
          </div>
        </div>

        {/* From Email Settings */}
        <div className="bg-neu-light rounded-neu shadow-neu mb-6">
          <div className="px-6 py-4 border-b border-neu-dark">
            <h3 className="no-margin flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              Sender Information
            </h3>
            <p className="text-body-sm text-muted mt-1 no-margin">
              Configure the &quot;From&quot; address and name for outgoing emails.
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            <Input
              id="emailFromAddress"
              name="emailFromAddress"
              type="email"
              label="From Email Address"
              placeholder="info@nebiswera.com"
              value={formData.emailFromAddress}
              onChange={(e) => setFormData({ ...formData, emailFromAddress: e.target.value })}
            />
            <p className="text-caption text-muted -mt-2 no-margin">
              Must be a verified sender signature in Postmark
            </p>

            <Input
              id="emailFromName"
              name="emailFromName"
              type="text"
              label="From Name"
              placeholder="Nebiswera"
              value={formData.emailFromName}
              onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
            />
          </div>
        </div>

        {/* Webhook Info (Read Only) */}
        <div className="bg-neu-light rounded-neu shadow-neu mb-6">
          <div className="px-6 py-4 border-b border-neu-dark">
            <h3 className="no-margin flex items-center gap-2">
              <Link className="h-5 w-5 text-primary-600" />
              Webhook Configuration
            </h3>
            <p className="text-body-sm text-muted mt-1 no-margin">
              Webhook is automatically configured to track email delivery status.
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="bg-neu-light rounded-neu p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-sm font-medium text-secondary">Webhook URL</span>
                <Badge variant="success">Active</Badge>
              </div>
              <code className="text-body-sm text-secondary bg-neu-base px-2 py-1 rounded-neu block break-all">
                https://nebiswera.com/api/webhooks/postmark
              </code>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info">Delivery</Badge>
                <Badge variant="info">Bounce</Badge>
                <Badge variant="info">Open</Badge>
                <Badge variant="info">Click</Badge>
                <Badge variant="info">Spam Complaint</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
