import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getCourseStartedEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Great start! You've begun ${vars.courseTitle}`,
    previewText: `You're on your way! Keep the momentum going.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">You're Off to a Great Start!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Congratulations on starting <strong>${vars.courseTitle}</strong>! Taking the first step is often the hardest part, and you've done it.
          </p>
          <div style="background-color: #ECFDF5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #065F46; font-size: 14px; margin: 0 0 10px 0;">Your Progress</p>
            <p style="color: #059669; font-size: 36px; font-weight: bold; margin: 0;">${vars.progressPercent}%</p>
            <p style="color: #065F46; font-size: 14px; margin: 10px 0 0 0;">${vars.lessonsCompleted} of ${vars.totalLessons} lessons completed</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Keep going! Consistency is key to mastering any new skill. Even just a few minutes each day will add up.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Continue Learning
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're cheering you on!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you're enrolled in a course on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

Congratulations on starting ${vars.courseTitle}! Taking the first step is often the hardest part, and you've done it.

Your Progress: ${vars.progressPercent}%
${vars.lessonsCompleted} of ${vars.totalLessons} lessons completed

Keep going! Consistency is key to mastering any new skill. Even just a few minutes each day will add up.

Continue learning: ${vars.continueUrl}

We're cheering you on!`,
  }
}
