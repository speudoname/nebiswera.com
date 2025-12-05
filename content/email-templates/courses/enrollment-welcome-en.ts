import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getEnrollmentWelcomeEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Welcome to ${vars.courseTitle}!`,
    previewText: `Your journey begins now. Start learning today!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Your Course!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Congratulations! You're now enrolled in <strong>${vars.courseTitle}</strong>.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Your learning journey starts now. Take the first step and dive into the content.
          </p>
          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 5px 0;">Course:</p>
            <p style="color: #1F2937; font-size: 18px; font-weight: 600; margin: 0;">${vars.courseTitle}</p>
            <p style="color: #6B7280; font-size: 14px; margin: 15px 0 5px 0;">Total Lessons:</p>
            <p style="color: #1F2937; font-size: 16px; margin: 0;">${vars.totalLessons} lessons</p>
            ${vars.expiresDate ? `
            <p style="color: #6B7280; font-size: 14px; margin: 15px 0 5px 0;">Access Until:</p>
            <p style="color: #1F2937; font-size: 16px; margin: 0;">${vars.expiresDate}</p>
            ` : ''}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.courseUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Start Learning Now
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>Tips for success:</strong>
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Set aside dedicated time each day for learning</li>
            <li>Take notes as you go through the lessons</li>
            <li>Complete the quizzes to test your understanding</li>
          </ul>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Happy learning!</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you enrolled in a course on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

Congratulations! You're now enrolled in ${vars.courseTitle}.

Your learning journey starts now. Take the first step and dive into the content.

Course: ${vars.courseTitle}
Total Lessons: ${vars.totalLessons} lessons
${vars.expiresDate ? `Access Until: ${vars.expiresDate}\n` : ''}
Start learning: ${vars.courseUrl}

Tips for success:
- Set aside dedicated time each day for learning
- Take notes as you go through the lessons
- Complete the quizzes to test your understanding

Happy learning!`,
  }
}
