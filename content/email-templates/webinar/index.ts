// Webinar Email Templates
// Following the same pattern as auth emails (verification, password-reset)
// Each template has EN and KA versions, locale is determined at send time

export type { WebinarEmailTemplate, WebinarTemplateVariables } from './types'

// Registration Confirmation
import { getRegistrationConfirmationEN } from './registration-confirmation-en'
import { getRegistrationConfirmationKA } from './registration-confirmation-ka'

// 24-hour Reminder
import { getReminder24hEN } from './reminder-24h-en'
import { getReminder24hKA } from './reminder-24h-ka'

// 1-hour Reminder
import { getReminder1hEN } from './reminder-1h-en'
import { getReminder1hKA } from './reminder-1h-ka'

// 15-minute Reminder
import { getReminder15mEN } from './reminder-15m-en'
import { getReminder15mKA } from './reminder-15m-ka'

// Follow-up: Missed (didn't attend)
import { getFollowupMissedEN } from './followup-missed-en'
import { getFollowupMissedKA } from './followup-missed-ka'

// Follow-up: Partial (left early, watched <50%)
import { getFollowupPartialEN } from './followup-partial-en'
import { getFollowupPartialKA } from './followup-partial-ka'

// Follow-up: Completed (watched >80%)
import { getFollowupCompletedEN } from './followup-completed-en'
import { getFollowupCompletedKA } from './followup-completed-ka'

// Template key type
export type WebinarTemplateKey =
  | 'registration-confirmation'
  | 'reminder-24h'
  | 'reminder-1h'
  | 'reminder-15m'
  | 'followup-missed'
  | 'followup-partial'
  | 'followup-completed'

// Get template by key and locale
export function getWebinarEmailTemplate(
  templateKey: WebinarTemplateKey,
  locale: string,
  vars: {
    firstName: string
    webinarTitle: string
    sessionDate?: string
    watchUrl: string
    replayUrl: string
  }
) {
  const isKa = locale === 'ka'

  switch (templateKey) {
    case 'registration-confirmation':
      return isKa
        ? getRegistrationConfirmationKA(vars)
        : getRegistrationConfirmationEN(vars)

    case 'reminder-24h':
      return isKa
        ? getReminder24hKA({ ...vars, sessionDate: vars.sessionDate! })
        : getReminder24hEN({ ...vars, sessionDate: vars.sessionDate! })

    case 'reminder-1h':
      return isKa
        ? getReminder1hKA({ ...vars, sessionDate: vars.sessionDate! })
        : getReminder1hEN({ ...vars, sessionDate: vars.sessionDate! })

    case 'reminder-15m':
      return isKa
        ? getReminder15mKA(vars)
        : getReminder15mEN(vars)

    case 'followup-missed':
      return isKa
        ? getFollowupMissedKA({ ...vars, replayUrl: vars.replayUrl })
        : getFollowupMissedEN({ ...vars, replayUrl: vars.replayUrl })

    case 'followup-partial':
      return isKa
        ? getFollowupPartialKA({ ...vars, replayUrl: vars.replayUrl })
        : getFollowupPartialEN({ ...vars, replayUrl: vars.replayUrl })

    case 'followup-completed':
      return isKa
        ? getFollowupCompletedKA({ ...vars, replayUrl: vars.replayUrl })
        : getFollowupCompletedEN({ ...vars, replayUrl: vars.replayUrl })

    default:
      throw new Error(`Unknown webinar template key: ${templateKey}`)
  }
}

// Default notification configurations
// These define the trigger timing and conditions, the actual content comes from templates
export interface DefaultNotificationConfig {
  templateKey: WebinarTemplateKey
  triggerType: 'AFTER_REGISTRATION' | 'BEFORE_START' | 'AFTER_END'
  triggerMinutes: number
  conditions: Record<string, unknown> | null
  sortOrder: number
}

// Get raw template content with variable placeholders intact (for editing)
// Uses generic placeholders like {{first_name}} that will be replaced at send time
export function getRawTemplateContent(
  templateKey: WebinarTemplateKey,
  locale: string
): { subject: string; previewText: string; html: string; text: string } {
  const isKa = locale === 'ka'

  // Use generic placeholder values to get template structure
  const placeholderVars = {
    firstName: '{{first_name}}',
    webinarTitle: '{{webinar_title}}',
    sessionDate: '{{session_date}}',
    watchUrl: '{{watch_url}}',
    replayUrl: '{{replay_url}}',
  }

  switch (templateKey) {
    case 'registration-confirmation':
      return isKa
        ? getRegistrationConfirmationKA(placeholderVars)
        : getRegistrationConfirmationEN(placeholderVars)

    case 'reminder-24h':
      return isKa
        ? getReminder24hKA({ ...placeholderVars, sessionDate: placeholderVars.sessionDate })
        : getReminder24hEN({ ...placeholderVars, sessionDate: placeholderVars.sessionDate })

    case 'reminder-1h':
      return isKa
        ? getReminder1hKA({ ...placeholderVars, sessionDate: placeholderVars.sessionDate })
        : getReminder1hEN({ ...placeholderVars, sessionDate: placeholderVars.sessionDate })

    case 'reminder-15m':
      return isKa
        ? getReminder15mKA(placeholderVars)
        : getReminder15mEN(placeholderVars)

    case 'followup-missed':
      return isKa
        ? getFollowupMissedKA({ ...placeholderVars, replayUrl: placeholderVars.replayUrl })
        : getFollowupMissedEN({ ...placeholderVars, replayUrl: placeholderVars.replayUrl })

    case 'followup-partial':
      return isKa
        ? getFollowupPartialKA({ ...placeholderVars, replayUrl: placeholderVars.replayUrl })
        : getFollowupPartialEN({ ...placeholderVars, replayUrl: placeholderVars.replayUrl })

    case 'followup-completed':
      return isKa
        ? getFollowupCompletedKA({ ...placeholderVars, replayUrl: placeholderVars.replayUrl })
        : getFollowupCompletedEN({ ...placeholderVars, replayUrl: placeholderVars.replayUrl })

    default:
      throw new Error(`Unknown webinar template key: ${templateKey}`)
  }
}

export const DEFAULT_NOTIFICATION_CONFIGS: DefaultNotificationConfig[] = [
  // 1. Registration Confirmation (immediate)
  {
    templateKey: 'registration-confirmation',
    triggerType: 'AFTER_REGISTRATION',
    triggerMinutes: 0,
    conditions: null,
    sortOrder: 0,
  },

  // 2. 24-hour Reminder
  {
    templateKey: 'reminder-24h',
    triggerType: 'BEFORE_START',
    triggerMinutes: -1440, // 24 hours
    conditions: null,
    sortOrder: 1,
  },

  // 3. 1-hour Reminder
  {
    templateKey: 'reminder-1h',
    triggerType: 'BEFORE_START',
    triggerMinutes: -60,
    conditions: null,
    sortOrder: 2,
  },

  // 4. 15-minute Reminder
  {
    templateKey: 'reminder-15m',
    triggerType: 'BEFORE_START',
    triggerMinutes: -15,
    conditions: null,
    sortOrder: 3,
  },

  // 5. Follow-up: Did Not Attend
  {
    templateKey: 'followup-missed',
    triggerType: 'AFTER_END',
    triggerMinutes: 15,
    conditions: { attended: false },
    sortOrder: 4,
  },

  // 6. Follow-up: Left Early (watched < 50%)
  {
    templateKey: 'followup-partial',
    triggerType: 'AFTER_END',
    triggerMinutes: 15,
    conditions: { AND: [{ attended: true }, { watchedPercent: { lt: 50 } }] },
    sortOrder: 5,
  },

  // 7. Follow-up: Completed (watched > 80%)
  {
    templateKey: 'followup-completed',
    triggerType: 'AFTER_END',
    triggerMinutes: 15,
    conditions: { watchedPercent: { gte: 80 } },
    sortOrder: 6,
  },
]
