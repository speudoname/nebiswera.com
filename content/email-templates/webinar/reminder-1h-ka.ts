import type { WebinarEmailTemplate } from './types'

export function getReminder1hKA(vars: {
  firstName: string
  webinarTitle: string
  sessionDate: string
  watchUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `${vars.webinarTitle} იწყება 1 საათში!`,
    previewText: `მოემზადეთ! თქვენი ვებინარი მალე იწყება.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">მალე იწყება!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>${vars.webinarTitle}</strong> იწყება 1 საათში!
          </p>
          <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0;">
              მოემზადეთ შესაერთებლად: ${vars.sessionDate}
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.watchUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              შეუერთდი ვებინარს
            </a>
          </div>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს წერილი, რადგან დარეგისტრირდით ვებინარზე Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

${vars.webinarTitle} იწყება 1 საათში!

მოემზადეთ შესაერთებლად: ${vars.sessionDate}.

შეუერთდი ვებინარს: ${vars.watchUrl}`,
  }
}
