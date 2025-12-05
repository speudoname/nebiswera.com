import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getQuizFailedEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Don't give up! Try the quiz again in ${vars.courseTitle}`,
    previewText: `You can do this! Review the material and try again.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Keep Going!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You gave the quiz <strong>${vars.quizTitle}</strong> a good try, but didn't quite reach the passing score this time.
          </p>
          <div style="background-color: #F3F4F6; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 5px 0;">Your Score</p>
            <p style="color: #374151; font-size: 48px; font-weight: bold; margin: 0;">${vars.quizScore}%</p>
            <p style="color: #6B7280; font-size: 14px; margin: 10px 0 0 0;">Passing score: ${vars.passingScore}%</p>
            ${vars.attemptsRemaining !== undefined ? `
            <p style="color: #4F46E5; font-size: 14px; margin: 15px 0 0 0; font-weight: 600;">
              ${vars.attemptsRemaining > 0 ? `${vars.attemptsRemaining} attempts remaining` : 'No attempts remaining'}
            </p>
            ` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>Don't be discouraged!</strong> This is part of the learning process. Here's what we suggest:
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Review the lesson content carefully</li>
            <li>Take notes on key concepts</li>
            <li>Try the quiz again when you feel ready</li>
          </ul>
          ${vars.attemptsRemaining === undefined || vars.attemptsRemaining > 0 ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.courseUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Review & Try Again
            </a>
          </div>
          ` : ''}
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Remember, every expert was once a beginner. You've got this!
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

You gave the quiz ${vars.quizTitle} a good try, but didn't quite reach the passing score this time.

Your Score: ${vars.quizScore}%
Passing score: ${vars.passingScore}%
${vars.attemptsRemaining !== undefined ? `Attempts remaining: ${vars.attemptsRemaining}` : ''}

Don't be discouraged! This is part of the learning process. Here's what we suggest:
- Review the lesson content carefully
- Take notes on key concepts
- Try the quiz again when you feel ready

${vars.attemptsRemaining === undefined || vars.attemptsRemaining > 0 ? `Review & try again: ${vars.courseUrl}` : ''}

Remember, every expert was once a beginner. You've got this!`,
  }
}
