'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { AlertTriangle, CheckCircle, Loader2, Send, Calendar, Mail } from 'lucide-react'
import { CampaignData } from './CampaignEditor'

interface Step4ReviewScheduleProps {
  data: CampaignData
  onUpdate: (updates: Partial<CampaignData>) => void
  campaignId?: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function Step4ReviewSchedule({ data, onUpdate, campaignId }: Step4ReviewScheduleProps) {
  const router = useRouter()
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')

  useEffect(() => {
    if (campaignId) {
      runValidation()
    }
  }, [campaignId])

  const runValidation = async () => {
    if (!campaignId) {
      alert('Please save the campaign first')
      return
    }

    setValidating(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/validate`, {
        method: 'POST',
      })
      if (res.ok) {
        const result = await res.json()
        setValidation(result)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setValidating(false)
    }
  }

  const prepareCampaign = async () => {
    if (!campaignId) {
      alert('Please save the campaign first')
      return
    }

    setPreparing(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/prepare`, {
        method: 'POST',
      })
      if (res.ok) {
        const result = await res.json()
        alert(`Prepared! ${result.recipientsCreated} recipients ready to send.`)
        return true
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to prepare campaign')
        return false
      }
    } catch (error) {
      console.error('Prepare failed:', error)
      alert('Failed to prepare campaign')
      return false
    } finally {
      setPreparing(false)
    }
  }

  const sendTestEmail = async () => {
    if (!campaignId) {
      alert('Please save the campaign first')
      return
    }

    if (!testEmail) {
      alert('Please enter an email address')
      return
    }

    setSendingTest(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })

      if (res.ok) {
        alert(`Test email sent to ${testEmail}!`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Test send failed:', error)
      alert('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendNow = async () => {
    if (!validation?.valid) {
      alert('Please fix validation errors before sending')
      return
    }

    if (!confirm('Are you sure you want to send this campaign now?')) {
      return
    }

    // Prepare recipients first
    const prepared = await prepareCampaign()
    if (!prepared) return

    setSending(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendNow: true }),
      })

      if (res.ok) {
        alert('Campaign is now sending!')
        router.push(`/admin/campaigns/${campaignId}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to start sending')
      }
    } catch (error) {
      console.error('Send failed:', error)
      alert('Failed to start sending')
    } finally {
      setSending(false)
    }
  }

  const handleSchedule = async () => {
    if (!validation?.valid) {
      alert('Please fix validation errors before scheduling')
      return
    }

    if (!scheduleTime) {
      alert('Please select a schedule time')
      return
    }

    // Prepare recipients first
    const prepared = await prepareCampaign()
    if (!prepared) return

    setSending(true)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendNow: false,
          scheduledAt: scheduleTime,
        }),
      })

      if (res.ok) {
        alert('Campaign scheduled successfully!')
        router.push('/admin/campaigns')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to schedule campaign')
      }
    } catch (error) {
      console.error('Schedule failed:', error)
      alert('Failed to schedule campaign')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Review & Schedule</h2>
        <p className="text-text-muted">
          Review your campaign, run validation, and send or schedule
        </p>
      </div>

      {/* Campaign Summary */}
      <div className="bg-neu-base rounded-neu p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Campaign Summary</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-muted">Name:</div>
            <div className="font-medium">{data.name}</div>
          </div>
          <div>
            <div className="text-text-muted">Subject:</div>
            <div className="font-medium">{data.subject}</div>
          </div>
          <div>
            <div className="text-text-muted">From:</div>
            <div className="font-medium">
              {data.fromName} &lt;{data.fromEmail}&gt;
            </div>
          </div>
          <div>
            <div className="text-text-muted">Target Audience:</div>
            <div className="font-medium">{data.targetType.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* Validation */}
      <div className="bg-neu-base rounded-neu p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Validation</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={runValidation}
            disabled={validating || !campaignId}
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Run Validation
              </>
            )}
          </Button>
        </div>

        {validation ? (
          <div className="space-y-3">
            {validation.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-neu p-4">
                <div className="flex items-center gap-2 text-red-900 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Errors (must fix before sending)
                </div>
                <ul className="text-sm text-red-800 space-y-1 ml-6 list-disc">
                  {validation.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-neu p-4">
                <div className="flex items-center gap-2 text-yellow-900 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings (recommended to fix)
                </div>
                <ul className="text-sm text-yellow-800 space-y-1 ml-6 list-disc">
                  {validation.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.valid && validation.errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-neu p-4">
                <div className="flex items-center gap-2 text-green-900 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  All checks passed! Ready to send.
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            Run validation to check for issues before sending
          </p>
        )}
      </div>

      {/* Test Send */}
      <div className="bg-neu-base rounded-neu p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Send Test Email</h3>
        <p className="text-sm text-text-muted mb-4">
          Send a test email to yourself to preview how it looks
        </p>
        <div className="flex gap-3">
          <Input
            id="testEmail"
            name="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={sendTestEmail}
            disabled={sendingTest || !campaignId || !testEmail}
            loading={sendingTest}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Test
          </Button>
        </div>
      </div>

      {/* Send Options */}
      <div className="bg-neu-base rounded-neu p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">Send Campaign</h3>

        {/* Send Now */}
        <div>
          <Button
            size="lg"
            onClick={handleSendNow}
            disabled={!validation?.valid || sending || !campaignId}
            loading={sending}
            className="w-full"
          >
            <Send className="w-5 h-5 mr-2" />
            Send Now
          </Button>
          <p className="text-xs text-text-muted mt-2">
            Campaign will start sending immediately to all recipients
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neu-dark"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-neu-base text-text-muted">or</span>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Schedule for Later
          </label>
          <div className="flex gap-3">
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="flex-1 rounded-neu border-2 border-transparent bg-white px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
            <Button
              variant="secondary"
              onClick={handleSchedule}
              disabled={!validation?.valid || !scheduleTime || sending || !campaignId}
              loading={sending}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Campaign will be sent at the specified date and time
          </p>
        </div>
      </div>

      {/* Final Warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-neu p-4">
        <div className="flex items-center gap-2 text-orange-900 font-medium mb-2">
          <AlertTriangle className="w-4 h-4" />
          Before Sending
        </div>
        <ul className="text-xs text-orange-800 space-y-1 ml-6 list-disc">
          <li>Double-check your subject line and preview text</li>
          <li>Send a test email to verify content and formatting</li>
          <li>Ensure your unsubscribe link is working</li>
          <li>Verify your target audience is correct</li>
          <li>Once sent, the campaign cannot be stopped (but can be paused)</li>
        </ul>
      </div>
    </div>
  )
}
