import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getCourseCompletedEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Congratulations! You've completed ${vars.courseTitle}!`,
    previewText: `You did it! Your certificate is ready.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎓 Congratulations!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>You did it!</strong> You've successfully completed <strong>${vars.courseTitle}</strong>.
          </p>
          <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; border: 2px solid #C7D2FE;">
            <p style="color: #4338CA; font-size: 48px; margin: 0;">🏆</p>
            <p style="color: #3730A3; font-size: 24px; font-weight: bold; margin: 15px 0 5px 0;">Course Completed!</p>
            <p style="color: #4338CA; font-size: 16px; margin: 0;">${vars.totalLessons} lessons • 100% complete</p>
            ${vars.timeSpent ? `<p style="color: #6366F1; font-size: 14px; margin: 10px 0 0 0;">Total time: ${vars.timeSpent}</p>` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            This is a significant achievement. You've invested time and effort to learn something new, and that dedication deserves recognition.
          </p>
          ${vars.certificateUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.certificateUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Download Your Certificate
            </a>
          </div>
          ` : ''}
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>What's next?</strong>
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Share your achievement on social media</li>
            <li>Apply what you've learned in real life</li>
            <li>Explore our other courses to continue growing</li>
          </ul>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for learning with us. We're proud of you!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you completed a course on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

You did it! You've successfully completed ${vars.courseTitle}.

🏆 Course Completed!
${vars.totalLessons} lessons • 100% complete
${vars.timeSpent ? `Total time: ${vars.timeSpent}` : ''}

This is a significant achievement. You've invested time and effort to learn something new, and that dedication deserves recognition.

${vars.certificateUrl ? `Download your certificate: ${vars.certificateUrl}\n` : ''}
What's next?
- Share your achievement on social media
- Apply what you've learned in real life
- Explore our other courses to continue growing

Thank you for learning with us. We're proud of you!`,
  }
}
