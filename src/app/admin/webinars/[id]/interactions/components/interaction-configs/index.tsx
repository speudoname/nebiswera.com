/**
 * Interaction Config Router
 *
 * Routes to the appropriate config component based on interaction type
 */

'use client'

import { PollConfig } from './PollConfig'
import { QuizConfig } from './QuizConfig'
import { CTAConfig } from './CTAConfig'
import { DownloadConfig } from './DownloadConfig'
import { QuestionConfig } from './QuestionConfig'
import { FeedbackConfig } from './FeedbackConfig'
import { ContactFormConfig } from './ContactFormConfig'
import { PauseConfig } from './PauseConfig'

interface InteractionConfigFieldsProps {
  type: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

/**
 * Smart router component that renders the appropriate config form
 * based on interaction type
 */
export function InteractionConfigFields({
  type,
  config,
  onChange,
}: InteractionConfigFieldsProps) {
  const props = { config, onChange }

  switch (type) {
    case 'POLL':
      return <PollConfig {...props} />

    case 'QUIZ':
      return <QuizConfig {...props} />

    case 'CTA':
    case 'SPECIAL_OFFER':
      return <CTAConfig {...props} />

    case 'DOWNLOAD':
      return <DownloadConfig {...props} />

    case 'TIP':
    case 'QUESTION':
      return <QuestionConfig {...props} />

    case 'FEEDBACK':
      return <FeedbackConfig {...props} />

    case 'CONTACT_FORM':
      return <ContactFormConfig {...props} />

    case 'PAUSE':
      return <PauseConfig {...props} />

    default:
      return (
        <p className="text-sm text-text-secondary">
          No configuration needed for this interaction type.
        </p>
      )
  }
}
