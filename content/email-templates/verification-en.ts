export function getVerificationEmailEN(verificationUrl: string) {
  return {
    subject: 'Verify your email - Nebiswera',
    html: `
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
    text: `
Welcome to Nebiswera!

Please verify your email by visiting this link:
${verificationUrl}

You have 24 hours to verify your email.
    `.trim(),
  }
}
