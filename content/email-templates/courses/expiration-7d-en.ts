import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getExpiration7dEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Your access to ${vars.courseTitle} expires in 7 days`,
    previewText: `Don't miss out! Complete your course before access ends.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Access Expiring Soon</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your access to <strong>${vars.courseTitle}</strong> will expire in <strong>7 days</strong> (on ${vars.expiresDate}).
          </p>
          <div style="background-color: #FEE2E2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <p style="color: #991B1B; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
              Time is running out!
            </p>
            <p style="color: #991B1B; font-size: 14px; margin: 0;">
              You're ${vars.progressPercent}% complete with ${vars.lessonsCompleted} of ${vars.totalLessons} lessons done.
            </p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>You still have time to finish!</strong> Here's how to make the most of your remaining access:
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Dedicate 30-60 minutes daily to the course</li>
            <li>Download any materials you want to keep</li>
            <li>Complete the remaining quizzes</li>
            <li>Finish strong and earn your certificate!</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Continue Course Now
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Don't let your hard work go to waste—finish what you started!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because your course access is expiring soon on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

Your access to ${vars.courseTitle} will expire in 7 days (on ${vars.expiresDate}).

Time is running out!
You're ${vars.progressPercent}% complete with ${vars.lessonsCompleted} of ${vars.totalLessons} lessons done.

You still have time to finish! Here's how to make the most of your remaining access:
- Dedicate 30-60 minutes daily to the course
- Download any materials you want to keep
- Complete the remaining quizzes
- Finish strong and earn your certificate!

Continue course now: ${vars.continueUrl}

Don't let your hard work go to waste—finish what you started!`,
  }
}
