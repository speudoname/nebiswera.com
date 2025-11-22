import * as postmark from 'postmark'

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN!)

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`

  await client.sendEmail({
    From: process.env.EMAIL_FROM!,
    To: email,
    Subject: 'Verify your email - Nebiswera',
    HtmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to Nebiswera!</h1>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #6366f1; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666;">Or copy and paste this link into your browser:</p>
        <p style="color: #6366f1; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          You have 24 hours to verify your email. After that, you'll need to request a new verification link.
        </p>
      </div>
    `,
    TextBody: `
      Welcome to Nebiswera!

      Please verify your email by visiting this link:
      ${verificationUrl}

      You have 24 hours to verify your email.
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  await client.sendEmail({
    From: process.env.EMAIL_FROM!,
    To: email,
    Subject: 'Reset your password - Nebiswera',
    HtmlBody: `
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
    TextBody: `
      Password Reset Request

      You requested to reset your password. Visit this link to set a new password:
      ${resetUrl}

      This link will expire in 1 hour. If you didn't request this, please ignore this email.
    `,
  })
}
