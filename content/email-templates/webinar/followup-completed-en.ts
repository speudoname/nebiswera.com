import type { WebinarEmailTemplate } from './types'

export function getFollowupCompletedEN(vars: {
  firstName: string
  webinarTitle: string
  replayUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `Thank You for Watching ${vars.webinarTitle}!`,
    previewText: `We hope you found it valuable. Here's how to watch the replay.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Thank You!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for attending <strong>${vars.webinarTitle}</strong>!
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We hope you found it valuable. If you'd like to review any part of the presentation, the replay is available for you.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.replayUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Watch Replay
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">We'd love to hear your feedback!</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you registered for a webinar on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

Thank you for attending ${vars.webinarTitle}!

We hope you found it valuable. If you'd like to review any part of the presentation, the replay is available for you.

Watch replay: ${vars.replayUrl}

We'd love to hear your feedback!`,
  }
}
