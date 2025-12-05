import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getInactivity14dEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Your course is waiting, ${vars.firstName}!`,
    previewText: `It's been 2 weeks. Don't let your progress go to waste.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your Course Misses You!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            It's been two weeks since your last visit to <strong>${vars.courseTitle}</strong>. We don't want you to lose the momentum you've built!
          </p>
          <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
              You're ${vars.progressPercent}% of the way there!
            </p>
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              ${vars.lessonsCompleted} of ${vars.totalLessons} lessons completed
            </p>
            ${vars.currentLesson ? `<p style="color: #D97706; font-size: 14px; margin: 10px 0 0 0;">Resume from: ${vars.currentLesson}</p>` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>Remember why you started.</strong> You enrolled in this course because you wanted to learn and grow. That goal is still within reach.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Here's a simple plan to get back on track:
          </p>
          <ol style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Set aside just 15 minutes today</li>
            <li>Watch one lesson or review your notes</li>
            <li>Schedule your next study session</li>
          </ol>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Get Back on Track
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You've already made progress—don't let it go to waste!
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

It's been two weeks since your last visit to ${vars.courseTitle}. We don't want you to lose the momentum you've built!

You're ${vars.progressPercent}% of the way there!
${vars.lessonsCompleted} of ${vars.totalLessons} lessons completed
${vars.currentLesson ? `Resume from: ${vars.currentLesson}` : ''}

Remember why you started. You enrolled in this course because you wanted to learn and grow. That goal is still within reach.

Here's a simple plan to get back on track:
1. Set aside just 15 minutes today
2. Watch one lesson or review your notes
3. Schedule your next study session

Get back on track: ${vars.continueUrl}

You've already made progress—don't let it go to waste!`,
  }
}
