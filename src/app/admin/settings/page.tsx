'use client'

import { useState, useEffect } from 'react'
import { Button, Input } from '@/components/ui'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Postmark Settings */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Postmark Email Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure your Postmark server for sending transactional emails.
            </p>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="postmarkServerToken" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {settings?.hasPostmarkToken && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Configured
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Postmark account under Server &gt; API Tokens
              </p>
            </div>

            <div>
              <label htmlFor="postmarkStreamName" className="block text-sm font-medium text-gray-700 mb-1">
                Message Stream
              </label>
              <select
                id="postmarkStreamName"
                value={formData.postmarkStreamName}
                onChange={(e) => setFormData({ ...formData, postmarkStreamName: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="outbound">outbound (Transactional)</option>
                <option value="broadcast">broadcast (Marketing)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Use &quot;outbound&quot; for transactional emails like verification and password reset
              </p>
            </div>
          </div>
        </div>

        {/* From Email Settings */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Sender Information
            </h2>
            <p className="text-sm text-gray-500 mt-1">
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
            <p className="text-xs text-gray-500 -mt-2">
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
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              Webhook Configuration
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Webhook is automatically configured to track email delivery status.
            </p>
          </div>
          <div className="px-6 py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Webhook URL</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded block break-all">
                https://nebiswera.com/api/webhooks/postmark
              </code>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Delivery
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Bounce
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Open
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Click
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Spam Complaint
                </span>
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
