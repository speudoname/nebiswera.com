'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface SmsBrand {
  id: number
  name: string
}

interface SmsSettings {
  id?: string
  apiKey: string | null
  hasApiKey: boolean
  defaultBrandId: number | null
  brands: SmsBrand[] | null
  unsubscribeFooterKa: string
  unsubscribeFooterEn: string
  dailySendLimit: number | null
  updatedAt?: string
}

export default function SmsSettingsPage() {
  const [settings, setSettings] = useState<SmsSettings | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [apiKey, setApiKey] = useState('')
  const [defaultBrandId, setDefaultBrandId] = useState<string>('')
  const [brands, setBrands] = useState<SmsBrand[]>([])
  const [newBrandId, setNewBrandId] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [unsubscribeFooterKa, setUnsubscribeFooterKa] = useState('')
  const [unsubscribeFooterEn, setUnsubscribeFooterEn] = useState('')
  const [dailySendLimit, setDailySendLimit] = useState('')

  // Test SMS state
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Balance state
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sms/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')

      const data = await res.json()
      setSettings(data.settings)
      setIsConfigured(data.isConfigured)

      if (data.settings) {
        setDefaultBrandId(data.settings.defaultBrandId?.toString() || '')
        setBrands(data.settings.brands || [])
        setUnsubscribeFooterKa(data.settings.unsubscribeFooterKa || '')
        setUnsubscribeFooterEn(data.settings.unsubscribeFooterEn || '')
        setDailySendLimit(data.settings.dailySendLimit?.toString() || '')
      }
    } catch (err) {
      setError('Failed to load settings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBalance = useCallback(async () => {
    if (!isConfigured) return

    setLoadingBalance(true)
    try {
      const res = await fetch('/api/admin/sms/balance')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch balance')
      }

      const data = await res.json()
      setBalance(data.balance)
    } catch (err) {
      console.error('Failed to fetch balance:', err)
    } finally {
      setLoadingBalance(false)
    }
  }, [isConfigured])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (isConfigured) {
      fetchBalance()
    }
  }, [isConfigured, fetchBalance])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/sms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || undefined, // Only send if not empty
          defaultBrandId: defaultBrandId || null,
          brands,
          unsubscribeFooterKa,
          unsubscribeFooterEn,
          dailySendLimit: dailySendLimit || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      const data = await res.json()
      setSettings(data.settings)
      setIsConfigured(data.isConfigured)
      setSuccess('Settings saved successfully')
      setApiKey('') // Clear the API key field after successful save

      // Refresh balance if now configured
      if (data.isConfigured) {
        fetchBalance()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addBrand = () => {
    if (!newBrandId || !newBrandName) return

    const id = parseInt(newBrandId, 10)
    if (isNaN(id)) return

    // Check for duplicate
    if (brands.some((b) => b.id === id)) {
      setError('Brand ID already exists')
      return
    }

    setBrands([...brands, { id, name: newBrandName }])
    setNewBrandId('')
    setNewBrandName('')
  }

  const removeBrand = (id: number) => {
    setBrands(brands.filter((b) => b.id !== id))
    if (defaultBrandId === id.toString()) {
      setDefaultBrandId('')
    }
  }

  const sendTestSms = async () => {
    if (!testPhone || !testMessage) return

    setSendingTest(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/admin/sms/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
          brandId: defaultBrandId ? parseInt(defaultBrandId, 10) : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Failed to send test SMS',
        })
      } else {
        setTestResult({
          success: true,
          message: `SMS sent successfully! ID: ${data.smsID}`,
        })
        // Refresh balance after sending
        fetchBalance()
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send test SMS',
      })
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/sms"
          className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SMS
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent-900">SMS Settings</h1>
          {isConfigured && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent-600">Balance:</span>
              {loadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="font-semibold text-accent-900">
                  {balance?.toLocaleString() ?? '—'} SMS
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-neu text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-neu text-green-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* API Configuration */}
        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <h2 className="text-lg font-semibold text-accent-900 mb-4">UBill API Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-1">API Key</label>
              {settings?.hasApiKey && (
                <p className="text-sm text-accent-500 mb-2">
                  Current: {settings.apiKey} (leave empty to keep current key)
                </p>
              )}
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.hasApiKey ? 'Enter new API key to change' : 'Enter your UBill API key'}
                className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Brands Configuration */}
        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <h2 className="text-lg font-semibold text-accent-900 mb-4">SMS Brands</h2>
          <p className="text-sm text-accent-500 mb-4">
            Configure your UBill brand IDs. You can have multiple brands for different purposes.
          </p>

          {/* Existing brands */}
          {brands.length > 0 && (
            <div className="mb-4 space-y-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-3 bg-accent-50 rounded-neu"
                >
                  <div>
                    <span className="font-medium text-accent-900">{brand.name}</span>
                    <span className="ml-2 text-sm text-accent-500">ID: {brand.id}</span>
                    {defaultBrandId === brand.id.toString() && (
                      <span className="ml-2 text-xs bg-accent-200 text-accent-700 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeBrand(brand.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new brand */}
          <div className="flex gap-2">
            <input
              type="number"
              value={newBrandId}
              onChange={(e) => setNewBrandId(e.target.value)}
              placeholder="Brand ID"
              className="w-24 px-3 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <input
              type="text"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Brand Name"
              className="flex-1 px-3 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <button
              onClick={addBrand}
              disabled={!newBrandId || !newBrandName}
              className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Default brand selection */}
          {brands.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-accent-700 mb-1">Default Brand</label>
              <select
                value={defaultBrandId}
                onChange={(e) => setDefaultBrandId(e.target.value)}
                className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="">Select default brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} (ID: {brand.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Unsubscribe Footer */}
        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <h2 className="text-lg font-semibold text-accent-900 mb-4">Unsubscribe Footer</h2>
          <p className="text-sm text-accent-500 mb-4">
            This text is automatically appended to marketing campaign SMS messages.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-1">
                Georgian Footer
              </label>
              <input
                type="text"
                value={unsubscribeFooterKa}
                onChange={(e) => setUnsubscribeFooterKa(e.target.value)}
                placeholder="გააუქმე: nebiswera.com/nosms"
                className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-1">
                English Footer
              </label>
              <input
                type="text"
                value={unsubscribeFooterEn}
                onChange={(e) => setUnsubscribeFooterEn(e.target.value)}
                placeholder="Unsubscribe: nebiswera.com/nosms"
                className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Safety Limits */}
        <div className="bg-white rounded-neu shadow-neu-flat p-6">
          <h2 className="text-lg font-semibold text-accent-900 mb-4">Safety Limits</h2>

          <div>
            <label className="block text-sm font-medium text-accent-700 mb-1">
              Daily Send Limit (optional)
            </label>
            <input
              type="number"
              value={dailySendLimit}
              onChange={(e) => setDailySendLimit(e.target.value)}
              placeholder="Leave empty for unlimited"
              className="w-full max-w-xs px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <p className="mt-1 text-sm text-accent-500">
              Maximum SMS messages to send per day. Leave empty for no limit.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-accent-600 text-white rounded-neu hover:bg-accent-700 disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save Settings
          </button>
        </div>

        {/* Test SMS */}
        {isConfigured && (
          <div className="bg-white rounded-neu shadow-neu-flat p-6">
            <h2 className="text-lg font-semibold text-accent-900 mb-4">Send Test SMS</h2>
            <p className="text-sm text-accent-500 mb-4">
              Send a test SMS to verify your configuration is working.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="551234567"
                  className="w-full max-w-xs px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1">Message</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Test message from Nebiswera"
                  rows={3}
                  className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <p className="mt-1 text-sm text-accent-500">
                  {testMessage.length} characters
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-neu ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <button
                onClick={sendTestSms}
                disabled={sendingTest || !testPhone || !testMessage || !defaultBrandId}
                className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Test SMS
              </button>

              {!defaultBrandId && brands.length === 0 && (
                <p className="text-sm text-amber-600">
                  Please add at least one brand and select it as default to send test SMS.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
