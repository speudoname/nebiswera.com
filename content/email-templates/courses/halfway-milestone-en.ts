import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getHalfwayMilestoneEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `You're halfway through ${vars.courseTitle}!`,
    previewText: `Amazing progress! You've completed 50% of the course.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Halfway There!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            What an achievement! You've reached the <strong>50% milestone</strong> in <strong>${vars.courseTitle}</strong>.
          </p>
          <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #92400E; font-size: 14px; margin: 0 0 10px 0;">Your Progress</p>
            <div style="background-color: #FDE68A; border-radius: 100px; height: 20px; margin: 15px 0;">
              <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 100px; height: 20px; width: ${vars.progressPercent}%;"></div>
            </div>
            <p style="color: #D97706; font-size: 36px; font-weight: bold; margin: 10px 0 0 0;">${vars.progressPercent}%</p>
            <p style="color: #92400E; font-size: 14px; margin: 10px 0 0 0;">${vars.lessonsCompleted} of ${vars.totalLessons} lessons completed</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You've shown real dedication to reach this point. The finish line is now in sight—keep up the great work!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Continue to Finish Strong
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You're doing amazing!
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

What an achievement! You've reached the 50% milestone in ${vars.courseTitle}.

Your Progress: ${vars.progressPercent}%
${vars.lessonsCompleted} of ${vars.totalLessons} lessons completed

You've shown real dedication to reach this point. The finish line is now in sight—keep up the great work!

Continue learning: ${vars.continueUrl}

You're doing amazing!`,
  }
}
