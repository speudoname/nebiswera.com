import type { WebinarEmailTemplate } from './types'

export function getReminder15mEN(vars: {
  firstName: string
  webinarTitle: string
  watchUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `${vars.webinarTitle} Starts in 15 Minutes!`,
    previewText: `We're about to start! Click to join now.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">We're About to Start!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>${vars.webinarTitle}</strong> is starting in just 15 minutes!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.watchUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
              Join Now
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center;">
            Click the button above to join the waiting room.
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you registered for a webinar on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

${vars.webinarTitle} is starting in just 15 minutes!

Join now: ${vars.watchUrl}

Click the link above to join the waiting room.`,
  }
}
