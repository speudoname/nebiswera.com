import type { WebinarEmailTemplate } from './types'

export function getFollowupCompletedKA(vars: {
  firstName: string
  webinarTitle: string
  replayUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `გმადლობთ, რომ უყურეთ: ${vars.webinarTitle}!`,
    previewText: `ვიმედოვნებთ, რომ სასარგებლო იყო. აი, როგორ ნახოთ ჩანაწერი.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">გმადლობთ!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            გმადლობთ, რომ დაესწარით <strong>${vars.webinarTitle}</strong>-ს!
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ვიმედოვნებთ, რომ სასარგებლო იყო. თუ გსურთ პრეზენტაციის რომელიმე ნაწილის გადახედვა, ჩანაწერი ხელმისაწვდომია თქვენთვის.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.replayUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ნახე ჩანაწერი
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">სიამოვნებით მოვისმენთ თქვენს აზრს!</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს წერილი, რადგან დარეგისტრირდით ვებინარზე Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

გმადლობთ, რომ დაესწარით ${vars.webinarTitle}-ს!

ვიმედოვნებთ, რომ სასარგებლო იყო. თუ გსურთ პრეზენტაციის რომელიმე ნაწილის გადახედვა, ჩანაწერი ხელმისაწვდომია თქვენთვის.

ნახე ჩანაწერი: ${vars.replayUrl}

სიამოვნებით მოვისმენთ თქვენს აზრს!`,
  }
}
