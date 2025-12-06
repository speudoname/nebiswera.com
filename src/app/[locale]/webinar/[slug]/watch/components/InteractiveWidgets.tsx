'use client'

import { useState, useEffect, useRef } from 'react'
import { Zap, Check, X, Star, ThumbsUp, ThumbsDown, Download, ExternalLink, BarChart2 } from 'lucide-react'
import { usePollResults, type PollResults } from '../hooks/usePollResults'
import type { InteractionData } from '@/types'
import type { AnsweredInteraction } from '../hooks/useInteractionTiming'

/** Response payload for interaction events */
type InteractionResponse = Record<string, unknown>

interface InteractiveWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  slug: string
  accessToken: string
  registrationId: string
  onDismiss: (id: string) => void
  onRespond: (id: string, response: InteractionResponse) => void
  /** If true, the interaction has been answered and should show results */
  showResults?: boolean
}

/** Check if interaction is answered */
function isAnsweredInteraction(
  interaction: InteractionData | AnsweredInteraction
): interaction is AnsweredInteraction {
  return 'userResponse' in interaction && 'answeredAt' in interaction
}

export function InteractiveWidget({
  interaction,
  slug,
  accessToken,
  registrationId,
  onDismiss,
  onRespond,
  showResults: forceShowResults,
}: InteractiveWidgetProps) {
  const [hasResponded, setHasResponded] = useState(isAnsweredInteraction(interaction))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasTrackedView = useRef(false)

  // Determine if we should show results
  const shouldShowResults = forceShowResults || hasResponded || isAnsweredInteraction(interaction)

  // Fetch poll results when showing results for polls/quizzes
  const { results: pollResults, isLoading: resultsLoading } = usePollResults({
    slug,
    accessToken,
    interactionId: interaction.id,
    enabled: shouldShowResults && ['POLL', 'QUIZ'].includes(interaction.type),
    pollInterval: 5000, // Refresh every 5 seconds
  })

  // Track VIEWED event when interaction first appears
  useEffect(() => {
    if (!hasTrackedView.current && !isAnsweredInteraction(interaction)) {
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
  }, [interaction, slug, accessToken])

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
        // Don't auto-dismiss - keep showing with results
      }
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismiss = async () => {
    // Only track dismiss if not already answered
    if (!hasResponded && !isAnsweredInteraction(interaction)) {
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
    }
    onDismiss(interaction.id)
  }

  // Get user's previous response if this is an answered interaction
  const userResponse = isAnsweredInteraction(interaction)
    ? interaction.userResponse
    : undefined

  // Render different widget based on type
  switch (interaction.type) {
    case 'POLL':
    case 'QUIZ':
      return (
        <PollWidget
          interaction={interaction}
          hasResponded={shouldShowResults}
          isSubmitting={isSubmitting}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
          pollResults={pollResults}
          resultsLoading={resultsLoading}
          userResponse={userResponse as { selectedOptions?: number[] } | undefined}
        />
      )
    case 'CTA':
      return (
        <CTAWidget
          interaction={interaction}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
          hasResponded={shouldShowResults}
        />
      )
    case 'FEEDBACK':
      return (
        <FeedbackWidget
          interaction={interaction}
          hasResponded={shouldShowResults}
          isSubmitting={isSubmitting}
          onResponse={handleResponse}
          onDismiss={handleDismiss}
          userResponse={userResponse as { rating?: number } | undefined}
        />
      )
    case 'QUESTION':
      return (
        <QuestionWidget
          interaction={interaction}
          hasResponded={shouldShowResults}
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
          hasResponded={shouldShowResults}
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

// ==================================================
// Poll/Quiz Widget with Results
// ==================================================
interface PollWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  hasResponded: boolean
  isSubmitting: boolean
  onResponse: (response: InteractionResponse, eventType: string) => void
  onDismiss: () => void
  pollResults: PollResults | null
  resultsLoading: boolean
  userResponse?: { selectedOptions?: number[] }
}

function PollWidget({
  interaction,
  hasResponded,
  isSubmitting,
  onResponse,
  onDismiss,
  pollResults,
  resultsLoading,
  userResponse,
}: PollWidgetProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    userResponse?.selectedOptions || []
  )
  const options = interaction.config.options || []
  const multipleChoice = interaction.config.multipleChoice || false

  const handleOptionToggle = (index: number) => {
    if (hasResponded) return // Can't change after responding

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

  // Get user's selected options from results or local state
  const userSelectedOptions = pollResults?.userResponse || userResponse?.selectedOptions || selectedOptions

  return (
    <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
          {hasResponded ? (
            <BarChart2 className="w-4 h-4 text-white" />
          ) : (
            <Zap className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{interaction.title}</h4>
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss poll"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {interaction.config.description && (
            <p className="text-xs text-gray-600 mb-3">{interaction.config.description}</p>
          )}

          {hasResponded ? (
            // Show results
            <div className="space-y-2">
              {resultsLoading && !pollResults ? (
                <div className="text-sm text-gray-500">Loading results...</div>
              ) : (
                <>
                  {/* Results header */}
                  <div className="flex items-center gap-2 text-green-600 text-xs mb-2">
                    <Check className="w-3 h-3" />
                    <span>
                      {pollResults?.totalResponses || 1} response{(pollResults?.totalResponses || 1) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Options with percentages */}
                  {options.map((option: string, index: number) => {
                    const result = pollResults?.options.find(r => r.index === index)
                    const percentage = result?.percentage || 0
                    const isUserChoice = userSelectedOptions.includes(index)

                    return (
                      <div
                        key={index}
                        className={`relative overflow-hidden rounded-lg border ${
                          isUserChoice
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {/* Background bar */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                            isUserChoice ? 'bg-primary-200' : 'bg-gray-100'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />

                        {/* Content */}
                        <div className="relative px-3 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isUserChoice && (
                              <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            )}
                            <span className="text-sm">{option}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          ) : (
            // Show voting UI
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
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedOptions.includes(index)
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-400'
                      }`}
                    >
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

// ==================================================
// CTA Widget
// ==================================================
interface CTAWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  onResponse: (response: InteractionResponse, eventType: string) => void
  onDismiss: () => void
  hasResponded: boolean
}

function CTAWidget({ interaction, onResponse, onDismiss, hasResponded }: CTAWidgetProps) {
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

          {hasResponded ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Clicked!</span>
            </div>
          ) : (
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              {buttonText}
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================================================
// Feedback Widget
// ==================================================
interface FeedbackWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  hasResponded: boolean
  isSubmitting: boolean
  onResponse: (response: InteractionResponse, eventType: string) => void
  onDismiss: () => void
  userResponse?: { rating?: number }
}

function FeedbackWidget({
  interaction,
  hasResponded,
  isSubmitting,
  onResponse,
  onDismiss,
  userResponse,
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState(userResponse?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const feedbackType = interaction.config.feedbackType || 'stars'

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
              {feedbackType === 'stars' && (
                <div className="flex gap-0.5 ml-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
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

// ==================================================
// Question Widget
// ==================================================
interface QuestionWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  hasResponded: boolean
  isSubmitting: boolean
  onResponse: (response: InteractionResponse, eventType: string) => void
  onDismiss: () => void
}

function QuestionWidget({ interaction, hasResponded, isSubmitting, onResponse, onDismiss }: QuestionWidgetProps) {
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

// ==================================================
// Tip Widget
// ==================================================
interface TipWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  onDismiss: () => void
}

function TipWidget({ interaction, onDismiss }: TipWidgetProps) {
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

// ==================================================
// Download Widget
// ==================================================
interface DownloadWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  onResponse: (response: InteractionResponse, eventType: string) => void
  onDismiss: () => void
  hasResponded: boolean
}

function DownloadWidget({ interaction, onResponse, onDismiss, hasResponded }: DownloadWidgetProps) {
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

          {hasResponded ? (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              <span>Downloaded!</span>
            </div>
          ) : (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download {fileName}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================================================
// Generic fallback widget
// ==================================================
interface GenericWidgetProps {
  interaction: InteractionData | AnsweredInteraction
  onDismiss: () => void
}

function GenericWidget({ interaction, onDismiss }: GenericWidgetProps) {
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
