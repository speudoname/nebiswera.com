// Reject testimonial (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({ success: true, testimonial })
  } catch (error) {
    logger.error('Error rejecting testimonial:', error)
    return errorResponse('Failed to reject testimonial')
  }
}
