import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getInactivity7dEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `We miss you! Continue ${vars.courseTitle}`,
    previewText: `Your course is waiting. Pick up where you left off.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">We Miss You!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            It's been about a week since you last visited <strong>${vars.courseTitle}</strong>. We wanted to check in and remind you that your progress is still saved!
          </p>
          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">Your Progress</p>
            <div style="background-color: #E5E7EB; border-radius: 100px; height: 12px; margin-bottom: 10px;">
              <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); border-radius: 100px; height: 12px; width: ${vars.progressPercent}%;"></div>
            </div>
            <p style="color: #374151; font-size: 16px; font-weight: 600; margin: 0;">${vars.progressPercent}% complete</p>
            <p style="color: #6B7280; font-size: 14px; margin: 5px 0 0 0;">${vars.lessonsCompleted} of ${vars.totalLessons} lessons</p>
            ${vars.currentLesson ? `<p style="color: #4F46E5; font-size: 14px; margin: 15px 0 0 0;">Next up: ${vars.currentLesson}</p>` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Life gets busy—we understand. But even just 10-15 minutes can help you make progress and keep the material fresh in your mind.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Continue Where You Left Off
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're rooting for you!
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

It's been about a week since you last visited ${vars.courseTitle}. We wanted to check in and remind you that your progress is still saved!

Your Progress: ${vars.progressPercent}% complete
${vars.lessonsCompleted} of ${vars.totalLessons} lessons
${vars.currentLesson ? `Next up: ${vars.currentLesson}` : ''}

Life gets busy—we understand. But even just 10-15 minutes can help you make progress and keep the material fresh in your mind.

Continue where you left off: ${vars.continueUrl}

We're rooting for you!`,
  }
}
