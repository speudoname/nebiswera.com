import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getEnrollmentNudgeEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Ready to start ${vars.courseTitle}?`,
    previewText: `Your course is waiting for you. Take the first step today!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your Course Awaits!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We noticed you enrolled in <strong>${vars.courseTitle}</strong> but haven't started yet.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            The first lesson is just a click away. Why not take a few minutes to get started?
          </p>
          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px 20px; margin: 20px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              <strong>Pro tip:</strong> Starting is the hardest part. Even 10 minutes today will build momentum!
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.courseUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Start Your First Lesson
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're here to support you on your learning journey!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you enrolled in a course on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

We noticed you enrolled in ${vars.courseTitle} but haven't started yet.

The first lesson is just a click away. Why not take a few minutes to get started?

Pro tip: Starting is the hardest part. Even 10 minutes today will build momentum!

Start your first lesson: ${vars.courseUrl}

We're here to support you on your learning journey!`,
  }
}
