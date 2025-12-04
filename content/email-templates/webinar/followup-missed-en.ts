import type { WebinarEmailTemplate } from './types'

export function getFollowupMissedEN(vars: {
  firstName: string
  webinarTitle: string
  replayUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `We Missed You at ${vars.webinarTitle}`,
    previewText: `No worries! Watch the replay at your convenience.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">We Missed You!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We noticed you couldn't make it to <strong>${vars.webinarTitle}</strong>. No worries - life happens!
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Good news: you can watch the replay at your convenience.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.replayUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Watch Replay
            </a>
          </div>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you registered for a webinar on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

We noticed you couldn't make it to ${vars.webinarTitle}. No worries - life happens!

Good news: you can watch the replay at your convenience.

Watch replay: ${vars.replayUrl}`,
  }
}
