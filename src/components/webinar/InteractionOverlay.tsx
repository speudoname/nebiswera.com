'use client'

import { useState } from 'react'
import { X, Download, ExternalLink, ThumbsUp, ThumbsDown, Meh } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface InteractionData {
  id: string
  type: string
  triggerTime: number
  title: string
  config: Record<string, unknown>
}

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
    <div className="absolute bottom-24 right-4 flex flex-col gap-4 max-w-sm z-20">
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = interaction.config as {
    options?: string[]
    buttonText?: string
    buttonUrl?: string
    downloadUrl?: string
    fileName?: string
    description?: string
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
