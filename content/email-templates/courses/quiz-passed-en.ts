import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getQuizPassedEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Great job! You passed the quiz in ${vars.courseTitle}`,
    previewText: `You scored ${vars.quizScore}%! Keep up the excellent work.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ Quiz Passed!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Excellent work! You've successfully passed the quiz <strong>${vars.quizTitle}</strong> in <strong>${vars.courseTitle}</strong>.
          </p>
          <div style="background-color: #ECFDF5; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #A7F3D0;">
            <p style="color: #065F46; font-size: 14px; margin: 0 0 5px 0;">Your Score</p>
            <p style="color: #059669; font-size: 48px; font-weight: bold; margin: 0;">${vars.quizScore}%</p>
            <p style="color: #065F46; font-size: 14px; margin: 10px 0 0 0;">Passing score: ${vars.passingScore}%</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            This shows you've truly understood the material. Your hard work is paying off!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Continue to Next Lesson
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Keep up the momentum!
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

Excellent work! You've successfully passed the quiz ${vars.quizTitle} in ${vars.courseTitle}.

Your Score: ${vars.quizScore}%
Passing score: ${vars.passingScore}%

This shows you've truly understood the material. Your hard work is paying off!

Continue to next lesson: ${vars.continueUrl}

Keep up the momentum!`,
  }
}
