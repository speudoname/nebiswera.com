'use client'

import { useState } from 'react'
import { X, Download, ExternalLink, ThumbsUp, ThumbsDown, Meh } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { InteractionData } from '@/types'

interface InteractionOverlayProps {
  interactions: InteractionData[]
  onDismiss: (id: string) => void
  onRespond: (id: string, response: unknown) => void
  registrationId: string
}

export function InteractionOverlay({
  interactions,
  onDismiss,
  onRespond,
}: InteractionOverlayProps) {
  return (
    <div className="absolute bottom-4 md:bottom-24 left-4 right-4 md:left-auto md:right-4 flex flex-col gap-4 max-w-full md:max-w-sm z-20">
      {interactions.map((interaction) => (
        <InteractionCard
          key={interaction.id}
          interaction={interaction}
          onDismiss={() => onDismiss(interaction.id)}
          onRespond={(response) => onRespond(interaction.id, response)}
        />
      ))}
    </div>
  )
}

function InteractionCard({
  interaction,
  onDismiss,
  onRespond,
}: {
  interaction: InteractionData
  onDismiss: () => void
  onRespond: (response: unknown) => void
}) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [textResponse, setTextResponse] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = interaction.config as {
    options?: string[]
    correctAnswers?: number[]
    buttonText?: string
    buttonUrl?: string
    downloadUrl?: string
    fileName?: string
    description?: string
    message?: string
    autoResumeDuration?: number
    placeholder?: string
    collectPhone?: boolean
    collectCompany?: boolean
    successMessage?: string
  }

  const handleSubmit = async () => {
    if (selectedOption === null && interaction.type === 'POLL') return

    setIsSubmitting(true)
    try {
      await onRespond({
        selectedOptions: selectedOption !== null ? [selectedOption] : [],
        type: interaction.type,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderContent = () => {
    switch (interaction.type) {
      case 'POLL':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            <div className="space-y-2">
              {config.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full p-3 text-left rounded-lg transition-all ${
                    selectedOption === index
                      ? 'bg-primary-500 text-white shadow-neu-pressed'
                      : 'bg-neu-light hover:bg-neu-dark shadow-neu-sm'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitting}
              loading={isSubmitting}
              className="w-full"
            >
              Submit
            </Button>
          </div>
        )

      case 'CTA':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            {config.description && (
              <p className="text-sm text-text-secondary">{config.description}</p>
            )}
            <Button
              onClick={() => {
                if (config.buttonUrl) {
                  window.open(config.buttonUrl, '_blank')
                  onRespond({ clicked: true })
                }
              }}
              className="w-full flex items-center justify-center gap-2"
            >
              {config.buttonText || 'Learn More'}
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        )

      case 'DOWNLOAD':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            {config.description && (
              <p className="text-sm text-text-secondary">{config.description}</p>
            )}
            <Button
              onClick={() => {
                if (config.downloadUrl) {
                  window.open(config.downloadUrl, '_blank')
                  onRespond({ downloaded: true })
                }
              }}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {config.fileName || 'Download'}
            </Button>
          </div>
        )

      case 'FEEDBACK':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            <div className="flex justify-center gap-4">
              {[
                { icon: ThumbsUp, value: 1, label: 'Great' },
                { icon: Meh, value: 2, label: 'Okay' },
                { icon: ThumbsDown, value: 3, label: 'Poor' },
              ].map(({ icon: Icon, value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setSelectedOption(value)
                    onRespond({ rating: value })
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    selectedOption === value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neu-light hover:bg-neu-dark'
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'TIP':
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            {config.description && (
              <p className="text-sm text-text-secondary">{config.description}</p>
            )}
          </div>
        )

      case 'SPECIAL_OFFER':
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold w-fit">
              Special Offer
            </div>
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            {config.description && (
              <p className="text-sm text-text-secondary">{config.description}</p>
            )}
            <Button
              onClick={() => {
                if (config.buttonUrl) {
                  window.open(config.buttonUrl, '_blank')
                  onRespond({ clicked: true })
                }
              }}
              className="w-full"
              variant="primary"
            >
              {config.buttonText || 'Claim Offer'}
            </Button>
          </div>
        )

      case 'QUESTION':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            <textarea
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              placeholder={config.placeholder || 'Type your answer here...'}
              rows={3}
              className="w-full p-3 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  await onRespond({ textResponse })
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={!textResponse.trim() || isSubmitting}
              loading={isSubmitting}
              className="w-full"
            >
              Submit Answer
            </Button>
          </div>
        )

      case 'PAUSE':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            </div>
            {config.message && (
              <p className="text-sm text-text-secondary">{config.message}</p>
            )}
            {!config.autoResumeDuration && (
              <Button
                onClick={() => onRespond({ resumed: true })}
                className="w-full"
              >
                Resume Video
              </Button>
            )}
            {config.autoResumeDuration && (
              <p className="text-xs text-text-secondary text-center">
                Video will resume automatically in {config.autoResumeDuration} seconds...
              </p>
            )}
          </div>
        )

      case 'QUIZ':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            <div className="space-y-2">
              {config.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full p-3 text-left rounded-lg transition-all ${
                    selectedOption === index
                      ? 'bg-primary-500 text-white shadow-neu-pressed'
                      : 'bg-neu-light hover:bg-neu-dark shadow-neu-sm'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  const isCorrect = config.correctAnswers?.includes(selectedOption!)
                  await onRespond({
                    selectedOptions: [selectedOption],
                    isCorrect,
                  })
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={selectedOption === null || isSubmitting}
              loading={isSubmitting}
              className="w-full"
            >
              Submit Answer
            </Button>
          </div>
        )

      case 'CONTACT_FORM':
        return (
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name *"
                className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email Address *"
                className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              {config.collectPhone && (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              )}
              {config.collectCompany && (
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company Name"
                  className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              )}
            </div>
            <Button
              onClick={async () => {
                setIsSubmitting(true)
                try {
                  await onRespond({ formData })
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={!formData.name || !formData.email || isSubmitting}
              loading={isSubmitting}
              className="w-full"
            >
              Submit
            </Button>
          </div>
        )

      default:
        return (
          <div>
            <h3 className="font-semibold text-text-primary">{interaction.title}</h3>
          </div>
        )
    }
  }

  return (
    <div className="bg-neu-base rounded-xl shadow-neu-lg p-4 animate-slide-in-right relative">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-neu-dark transition-colors"
      >
        <X className="w-4 h-4 text-text-secondary" />
      </button>

      {renderContent()}
    </div>
  )
}
