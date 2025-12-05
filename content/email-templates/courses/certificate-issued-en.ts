import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getCertificateIssuedEN(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `Your certificate for ${vars.courseTitle} is ready!`,
    previewText: `Congratulations! Download your official certificate now.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏅 Certificate Issued!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Congratulations on completing <strong>${vars.courseTitle}</strong>! Your official certificate of completion is now ready.
          </p>
          <div style="background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; border: 2px solid #C4B5FD;">
            <p style="color: #5B21B6; font-size: 14px; margin: 0 0 10px 0;">CERTIFICATE OF COMPLETION</p>
            <p style="color: #4C1D95; font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">${vars.fullName}</p>
            <p style="color: #6D28D9; font-size: 14px; margin: 0 0 15px 0;">has successfully completed</p>
            <p style="color: #4C1D95; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">${vars.courseTitle}</p>
            ${vars.certificateId ? `<p style="color: #7C3AED; font-size: 12px; margin: 0;">Certificate ID: ${vars.certificateId}</p>` : ''}
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            This certificate represents your achievement and can be shared with employers, added to your LinkedIn profile, or printed for your records.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.certificateUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Download Certificate
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>Share your achievement:</strong>
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>Post it on LinkedIn to showcase your new skills</li>
            <li>Add it to your resume or portfolio</li>
            <li>Share with friends and family who supported you</li>
          </ul>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're incredibly proud of your accomplishment. Keep learning, keep growing!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            You're receiving this because you earned a certificate on Nebiswera.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${vars.firstName},

Congratulations on completing ${vars.courseTitle}! Your official certificate of completion is now ready.

CERTIFICATE OF COMPLETION
${vars.fullName}
has successfully completed
${vars.courseTitle}
${vars.certificateId ? `Certificate ID: ${vars.certificateId}` : ''}

This certificate represents your achievement and can be shared with employers, added to your LinkedIn profile, or printed for your records.

Download your certificate: ${vars.certificateUrl}

Share your achievement:
- Post it on LinkedIn to showcase your new skills
- Add it to your resume or portfolio
- Share with friends and family who supported you

We're incredibly proud of your accomplishment. Keep learning, keep growing!`,
  }
}
