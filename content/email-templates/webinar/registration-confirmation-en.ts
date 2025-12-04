import type { WebinarEmailTemplate } from './types'

export function getRegistrationConfirmationEN(vars: {
  firstName: string
  webinarTitle: string
  sessionDate?: string
  watchUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `You're registered for ${vars.webinarTitle}`,
    previewText: `Thank you for registering! Your spot is confirmed.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">You're In!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for registering for <strong>${vars.webinarTitle}</strong>.
          </p>
          ${vars.sessionDate ? `
          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 5px 0;">When:</p>
            <p style="color: #1F2937; font-size: 18px; font-weight: 600; margin: 0;">${vars.sessionDate}</p>
          </div>
          ` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.watchUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Access Your Session
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Add this event to your calendar so you don't miss it!
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">See you there!</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you registered for a webinar on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

Thank you for registering for ${vars.webinarTitle}.
${vars.sessionDate ? `\nWhen: ${vars.sessionDate}\n` : ''}
Access your session: ${vars.watchUrl}

Add this event to your calendar so you don't miss it!

See you there!`,
  }
}
