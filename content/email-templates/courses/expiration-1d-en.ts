import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getExpiration1dEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `URGENT: ${vars.courseTitle} access expires TOMORROW`,
    previewText: `Last chance! Your course access ends in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 LAST DAY</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>This is your final reminder.</strong> Your access to <strong>${vars.courseTitle}</strong> expires <strong>tomorrow</strong> (${vars.expiresDate}).
          </p>
          <div style="background-color: #FEE2E2; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #EF4444;">
            <p style="color: #991B1B; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
              ⏰ Only 24 hours left!
            </p>
            <p style="color: #991B1B; font-size: 14px; margin: 0;">
              Current progress: ${vars.progressPercent}% (${vars.lessonsCompleted}/${vars.totalLessons} lessons)
            </p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>What you should do now:</strong>
          </p>
          <ol style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Complete as many remaining lessons as possible</li>
            <li>Download any course materials you need</li>
            <li>Take notes on key takeaways</li>
            ${vars.progressPercent >= 80 ? '<li>Finish the last lessons to get your certificate!</li>' : ''}
          </ol>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
              Access Course Now
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; text-align: center;">
            After expiration, you'll lose access to all course content.
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this urgent reminder because your course access expires tomorrow on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

This is your final reminder. Your access to ${vars.courseTitle} expires TOMORROW (${vars.expiresDate}).

⏰ Only 24 hours left!
Current progress: ${vars.progressPercent}% (${vars.lessonsCompleted}/${vars.totalLessons} lessons)

What you should do now:
1. Complete as many remaining lessons as possible
2. Download any course materials you need
3. Take notes on key takeaways
${vars.progressPercent >= 80 ? '4. Finish the last lessons to get your certificate!' : ''}

Access course now: ${vars.continueUrl}

After expiration, you'll lose access to all course content.`,
  }
}
