export function getPasswordResetEmailEN(resetUrl: string) {
  return {
    subject: 'Reset your password - Nebiswera',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #6366f1; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">Or copy and paste this link into your browser:</p>
        <p style="color: #6366f1; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    text: `
Password Reset Request

You requested to reset your password. Visit this link to set a new password:
${resetUrl}

This link will expire in 1 hour. If you didn't request this, please ignore this email.
    `.trim(),
  }
}
