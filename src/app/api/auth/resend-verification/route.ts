import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limit: 3 requests per 5 minutes for email endpoints
  const rateLimitResponse = await checkRateLimit(request, 'email')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, emailVerified: true, preferredLocale: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Delete existing verification tokens
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email,
        type: 'EMAIL_VERIFICATION',
      },
    })

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
        type: 'EMAIL_VERIFICATION',
      },
    })

    // Update the sent timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationSentAt: new Date() },
    })

    // Send verification email in user's preferred language
    await sendVerificationEmail(user.email, token, user.preferredLocale || 'ka')

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
