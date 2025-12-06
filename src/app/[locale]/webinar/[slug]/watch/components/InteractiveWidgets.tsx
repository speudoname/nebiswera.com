'use client'

import { useState, useEffect, useRef } from 'react'
import { Zap, Check, X, Star, ThumbsUp, ThumbsDown, Download, ExternalLink } from 'lucide-react'
import type { InteractionData } from '@/types'

/** Response payload for interaction events */
type InteractionResponse = Record<string, unknown>

interface InteractiveWidgetProps {
  interaction: InteractionData
  slug: string
  accessToken: string
  registrationId: string
  onDismiss: (id: string) => void
  onRespond: (id: string, response: InteractionResponse) => void
}

/** Props for individual widget components */
interface WidgetProps {
  interaction: InteractionData
  onDismiss: () => void
}

interface ResponseWidgetProps extends WidgetProps {
  hasResponded: boolean
  isSubmitting: boolean
  onResponse: (response: InteractionResponse, eventType: string) => void
}

interface ClickableWidgetProps extends WidgetProps {
  onResponse: (response: InteractionResponse, eventType: string) => void
}

export function InteractiveWidget({
  interaction,
  slug,
  accessToken,
  registrationId,
  onDismiss,
  onRespond,
}: InteractiveWidgetProps) {
  const [hasResponded, setHasResponded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasTrackedView = useRef(false)

  // Track VIEWED event when interaction first appears
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true
      fetch(`/api/webinars/${slug}/interactions/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          interactionId: interaction.id,
          response: {},
          eventType: 'VIEWED',
        }),
      }).catch((error) => {
        console.error('Failed to track view:', error)
      })
    }
  }, [interaction.id, slug, accessToken])

  const handleResponse = async (response: InteractionResponse, eventType: string) => {
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/webinars/${slug}/interactions/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          interactionId: interaction.id,
          response,
          eventType,
        }),
      })

      if (res.ok) {
        setHasResponded(true)
        onRespond(interaction.id, response)

        // Auto-dismiss after successful response (except for some types)
        if (!['TIP', 'PAUSE'].includes(interaction.type)) {
          setTimeout(() => onDismiss(interaction.id), 2000)
        }
      }
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async () => {
    await fetch(`/api/webinars/${slug}/interactions/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: accessToken,
        interactionId: interaction.id,
        response: {},
        eventType: 'DISMISSED',
      }),
    })
    onDismiss(interaction.id)
  }

  // Render different widget based on type
  switch (interaction.type) {
    case 'POLL':
    case 'QUIZ':
      return (
        <PollWidget
          interaction={interaction}
          hasResponded={hasResponded}
          isSubmitting={isSubmitting}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
        />
      )
    case 'CTA':
      return (
        <CTAWidget
          interaction={interaction}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
        />
      )
    case 'FEEDBACK':
      return (
        <FeedbackWidget
          interaction={interaction}
          hasResponded={hasResponded}
          isSubmitting={isSubmitting}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
        />
      )
    case 'QUESTION':
      return (
        <QuestionWidget
          interaction={interaction}
          hasResponded={hasResponded}
          isSubmitting={isSubmitting}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
        />
      )
    case 'TIP':
      return (
        <TipWidget
          interaction={interaction}
          onDismiss={handleDismiss}
        />
      )
    case 'DOWNLOAD':
      return (
        <DownloadWidget
          interaction={interaction}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
        />
      )
    default:
      return (
        <GenericWidget
          interaction={interaction}
          onDismiss={handleDismiss}
        />
      )
  }
}

// Poll/Quiz Widget
function PollWidget({
  interaction,
  hasResponded,
  isSubmitting,
  onResponse,
  onDismiss,
}: ResponseWidgetProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const options = interaction.config.options || []
  const multipleChoice = interaction.config.multipleChoice || false

  const handleOptionToggle = (index: number) => {
    if (multipleChoice) {
      setSelectedOptions(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      )
    } else {
      setSelectedOptions([index])
    }
  }

  const handleSubmit = () => {
    onResponse({ selectedOptions }, 'RESPONDED')
  }

  return (
    <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {interaction.config.description && (
            <p className="text-xs text-gray-600 mb-3">{interaction.config.description}</p>
          )}

          {hasResponded ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Thank you for your response!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleOptionToggle(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    selectedOptions.includes(index)
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-300 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedOptions.includes(index)
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-400'
                    }`}>
                      {selectedOptions.includes(index) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                </button>
              ))}

              <button
                onClick={handleSubmit}
                disabled={selectedOptions.length === 0 || isSubmitting}
                className="w-full mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// CTA Widget
function CTAWidget({ interaction, onResponse, onDismiss }: ClickableWidgetProps) {
  const buttonText = interaction.config.buttonText || 'Learn More'
  const buttonUrl = interaction.config.buttonUrl || '#'
  const openInNewTab = interaction.config.openInNewTab !== false

  const handleClick = () => {
    onResponse({ clicked: true, url: buttonUrl }, 'CLICKED')
    if (buttonUrl !== '#') {
      window.open(buttonUrl, openInNewTab ? '_blank' : '_self')
    }
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {interaction.config.description && (
            <p className="text-sm text-gray-700 mb-3">{interaction.config.description}</p>
          )}

          <button
            onClick={handleClick}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
          >
            {buttonText}
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Feedback Widget (Star rating or emoji)
function FeedbackWidget({ interaction, hasResponded, isSubmitting, onResponse, onDismiss }: ResponseWidgetProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const feedbackType = interaction.config.feedbackType || 'stars' // 'stars' | 'thumbs' | 'emoji'

  const handleSubmit = () => {
    onResponse({ rating }, 'RESPONDED')
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
          <Star className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {hasResponded ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Thank you for your feedback!</span>
            </div>
          ) : (
            <div>
              {feedbackType === 'stars' && (
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {feedbackType === 'thumbs' && (
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => setRating(1)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      rating === 1
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <ThumbsUp className={`w-6 h-6 ${rating === 1 ? 'text-green-600' : 'text-gray-400'}`} />
                  </button>
                  <button
                    onClick={() => setRating(-1)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      rating === -1
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <ThumbsDown className={`w-6 h-6 ${rating === -1 ? 'text-red-600' : 'text-gray-400'}`} />
                  </button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Question Widget (open-ended text)
function QuestionWidget({ interaction, hasResponded, isSubmitting, onResponse, onDismiss }: ResponseWidgetProps) {
  const [textResponse, setTextResponse] = useState('')

  const handleSubmit = () => {
    onResponse({ textResponse }, 'RESPONDED')
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {hasResponded ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Thank you for your answer!</span>
            </div>
          ) : (
            <div>
              <textarea
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleSubmit}
                disabled={!textResponse.trim() || isSubmitting}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Tip Widget (informational)
function TipWidget({ interaction, onDismiss }: WidgetProps) {
  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {interaction.config.message && (
            <p className="text-sm text-gray-700">{interaction.config.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Download Widget
function DownloadWidget({ interaction, onResponse, onDismiss }: ClickableWidgetProps) {
  const downloadUrl = interaction.config.downloadUrl || '#'
  const fileName = interaction.config.fileName || 'download'

  const handleDownload = () => {
    onResponse({ downloaded: true, url: downloadUrl }, 'DOWNLOADED')
    if (downloadUrl !== '#') {
      window.open(downloadUrl, '_blank')
    }
  }

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {interaction.config.description && (
            <p className="text-sm text-gray-700 mb-3">{interaction.config.description}</p>
          )}

          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download {fileName}
          </button>
        </div>
      </div>
    </div>
  )
}

// Generic fallback widget
function GenericWidget({ interaction, onDismiss }: WidgetProps) {
  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600">Interactive element - {interaction.type}</p>
        </div>
      </div>
    </div>
  )
}
