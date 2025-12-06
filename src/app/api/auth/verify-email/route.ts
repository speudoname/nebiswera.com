import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger, badRequestResponse, errorResponse } from '@/lib'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Rate limiting - prevent token enumeration attacks
  const rateLimitResponse = await checkRateLimit(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return badRequestResponse('Token is required')
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'EMAIL_VERIFICATION',
        expires: { gt: new Date() },
      },
    })

    if (!verificationToken) {
      return badRequestResponse('Invalid or expired token')
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    })

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    })

    return NextResponse.json({ success: true, message: 'Email verified successfully' })
  } catch (error) {
    logger.error('Email verification error:', error)
    return errorResponse('Something went wrong')
  }
}
