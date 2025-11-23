import { getVerificationEmailEN } from './verification-en'
import { getVerificationEmailKA } from './verification-ka'
import { getPasswordResetEmailEN } from './password-reset-en'
import { getPasswordResetEmailKA } from './password-reset-ka'

export type EmailTemplate = {
  subject: string
  html: string
  text: string
}

export function getVerificationEmail(url: string, locale: string): EmailTemplate {
  return locale === 'ka' ? getVerificationEmailKA(url) : getVerificationEmailEN(url)
}

export function getPasswordResetEmail(url: string, locale: string): EmailTemplate {
  return locale === 'ka' ? getPasswordResetEmailKA(url) : getPasswordResetEmailEN(url)
}
