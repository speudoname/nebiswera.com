'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, Save, Send, Calendar } from 'lucide-react'
import { Step1BasicInfo } from './Step1BasicInfo'
import { Step2Content } from './Step2Content'
import { Step3Audience } from './Step3Audience'
import { Step4ReviewSchedule } from './Step4ReviewSchedule'

export interface CampaignData {
  id?: string
  name: string
  subject: string
  previewText: string
  fromName: string
  fromEmail: string
  replyTo: string
  htmlContent: string
  textContent: string
  targetType: 'ALL_CONTACTS' | 'SEGMENT' | 'TAG' | 'REGISTERED_USERS' | 'CUSTOM_FILTER'
  targetCriteria: any
  scheduledAt: string | null
  status?: string
}

interface CampaignEditorProps {
  campaignId?: string
  initialData?: Partial<CampaignData>
}

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Campaign details' },
  { id: 2, name: 'Content', description: 'Email content' },
  { id: 3, name: 'Audience', description: 'Target recipients' },
  { id: 4, name: 'Review & Send', description: 'Preview and schedule' },
]

export function CampaignEditor({ campaignId, initialData }: CampaignEditorProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    previewText: initialData?.previewText || '',
    fromName: initialData?.fromName || 'Nebiswera',
    fromEmail: initialData?.fromEmail || 'hello@nebiswera.ge',
    replyTo: initialData?.replyTo || 'hello@nebiswera.ge',
    htmlContent: initialData?.htmlContent || '',
    textContent: initialData?.textContent || '',
    targetType: initialData?.targetType || 'ALL_CONTACTS',
    targetCriteria: initialData?.targetCriteria || null,
    scheduledAt: initialData?.scheduledAt || null,
  })

  // Load campaign data if editing
  useEffect(() => {
    if (campaignId && !initialData) {
      fetchCampaign()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`)
      if (res.ok) {
        const data = await res.json()
        setCampaignData({
          id: data.id,
          name: data.name,
          subject: data.subject,
          previewText: data.previewText || '',
          fromName: data.fromName,
          fromEmail: data.fromEmail,
          replyTo: data.replyTo || data.fromEmail,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          targetType: data.targetType,
          targetCriteria: data.targetCriteria,
          scheduledAt: data.scheduledAt,
          status: data.status,
        })
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
      alert('Failed to load campaign')
    }
  }

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData((prev) => ({ ...prev, ...updates }))
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const url = campaignId
        ? `/api/admin/campaigns/${campaignId}`
        : '/api/admin/campaigns'
      const method = campaignId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      })

      if (res.ok) {
        const data = await res.json()
        if (!campaignId) {
          // Redirect to edit page with the new campaign ID
          router.push(`/admin/campaigns/${data.id}/edit`)
        }
        return data
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save campaign')
        return null
      }
    } catch (error) {
      console.error('Failed to save campaign:', error)
      alert('Failed to save campaign')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    // Auto-save when moving forward
    if (currentStep < 4) {
      const saved = await saveDraft()
      if (saved) {
        setCurrentStep((prev) => prev + 1)
      }
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name && campaignData.subject && campaignData.fromEmail
      case 2:
        return campaignData.htmlContent && campaignData.textContent
      case 3:
        return true // Audience step always allows proceeding
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {STEPS.map((step, index) => (
              <li
                key={step.id}
                className={`relative ${
                  index !== STEPS.length - 1 ? 'flex-1 pr-8' : ''
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      currentStep > step.id
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : currentStep === step.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-neu-dark text-text-muted'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <div className="ml-4 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-text-primary' : 'text-text-muted'
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-text-muted">{step.description}</p>
                  </div>
                </div>
                {index !== STEPS.length - 1 && (
                  <div
                    className={`absolute top-5 left-10 right-0 h-0.5 ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-neu-dark'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-neu-light rounded-neu shadow-neu p-8 mb-6">
        {currentStep === 1 && (
          <Step1BasicInfo data={campaignData} onUpdate={updateCampaignData} />
        )}
        {currentStep === 2 && (
          <Step2Content data={campaignData} onUpdate={updateCampaignData} />
        )}
        {currentStep === 3 && (
          <Step3Audience data={campaignData} onUpdate={updateCampaignData} />
        )}
        {currentStep === 4 && (
          <Step4ReviewSchedule
            data={campaignData}
            onUpdate={updateCampaignData}
            campaignId={campaignId}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={saveDraft} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed() || saving}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
