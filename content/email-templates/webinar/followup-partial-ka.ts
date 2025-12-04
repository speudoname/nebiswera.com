import type { WebinarEmailTemplate } from './types'

export function getFollowupPartialKA(vars: {
  firstName: string
  webinarTitle: string
  replayUrl: string
}): WebinarEmailTemplate {
  return {
    subject: `გააგრძელე ყურება: ${vars.webinarTitle}`,
    previewText: `გააგრძელე იქიდან, სადაც გაჩერდი და არ გამოტოვო საუკეთესო ნაწილები!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">გააგრძელე იქიდან, სადაც გაჩერდი</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            შევამჩნიეთ, რომ <strong>${vars.webinarTitle}</strong> ადრე დატოვე. არაფერია!
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            შეგიძლია გააგრძელო ჩანაწერის ყურება ნებისმიერ დროს, რომ არ გამოგრჩეს.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.replayUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გააგრძელე ყურება
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

შევამჩნიეთ, რომ ${vars.webinarTitle} ადრე დატოვე. არაფერია!

შეგიძლია გააგრძელო ჩანაწერის ყურება ნებისმიერ დროს, რომ არ გამოგრჩეს.

გააგრძელე ყურება: ${vars.replayUrl}`,
  }
}
