import * as postmark from 'postmark'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { EmailType } from '@prisma/client'
import { getVerificationEmail, getPasswordResetEmail } from './email-templates'

async function getEmailClient() {
  const settings = await getSettings()

  if (!settings.postmarkServerToken) {
    throw new Error('Postmark server token not configured. Please configure it in Admin > Settings.')
  }

  return {
    client: new postmark.ServerClient(settings.postmarkServerToken),
    fromAddress: settings.emailFromAddress || 'noreply@nebiswera.com',
    fromName: settings.emailFromName,
    streamName: settings.postmarkStreamName,
  }
}

export async function sendVerificationEmail(email: string, token: string, locale: string = 'ka') {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/${locale}/auth/verify-email?token=${token}`
  const template = getVerificationEmail(verificationUrl, locale)

  const { client, fromAddress, fromName, streamName } = await getEmailClient()

  const result = await client.sendEmail({
    From: `${fromName} <${fromAddress}>`,
    To: email,
    Subject: template.subject,
    MessageStream: streamName,
    HtmlBody: template.html,
    TextBody: template.text,
  })

  // Log the email
  await prisma.emailLog.create({
    data: {
      messageId: result.MessageID,
      to: email,
      subject: template.subject,
      type: EmailType.VERIFICATION,
      locale,
    },
  })

  return result
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string = 'ka') {
  const resetUrl = `${process.env.NEXTAUTH_URL}/${locale}/auth/reset-password?token=${token}`
  const template = getPasswordResetEmail(resetUrl, locale)

  const { client, fromAddress, fromName, streamName } = await getEmailClient()

  const result = await client.sendEmail({
    From: `${fromName} <${fromAddress}>`,
    To: email,
    Subject: template.subject,
    MessageStream: streamName,
    HtmlBody: template.html,
    TextBody: template.text,
  })

  // Log the email
  await prisma.emailLog.create({
    data: {
      messageId: result.MessageID,
      to: email,
      subject: template.subject,
      type: EmailType.PASSWORD_RESET,
      locale,
    },
  })

  return result
}
