/**
 * Feedback Configuration Component
 *
 * Informational only - no configuration needed
 */

'use client'

interface FeedbackConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function FeedbackConfig({ config, onChange }: FeedbackConfigProps) {
  return (
    <p className="text-sm text-text-secondary">
      Feedback interactions show thumbs up/down/neutral options automatically.
    </p>
  )
}
