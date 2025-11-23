import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { forgotPasswordSchema, formatZodError } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limit: 3 requests per 5 minutes for email endpoints
  const rateLimitResponse = await checkRateLimit(request, 'email')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()

    // Validate input with Zod
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      )
    }

    const { email } = result.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, preferredLocale: true },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent.',
      })
    }

    // Delete any existing password reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        type: 'PASSWORD_RESET',
      },
    })

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
        type: 'PASSWORD_RESET',
      },
    })

    // Send reset email in user's preferred language
    await sendPasswordResetEmail(email, token, user.preferredLocale || 'ka')

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
