// Reject testimonial (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({ success: true, testimonial })
  } catch (error: any) {
    console.error('Error rejecting testimonial:', error)
    return NextResponse.json({ error: 'Failed to reject testimonial' }, { status: 500 })
  }
}
