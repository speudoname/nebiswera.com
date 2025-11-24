// Approve testimonial (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { status: 'APPROVED' },
    })

    return NextResponse.json({ success: true, testimonial })
  } catch (error: any) {
    console.error('Error approving testimonial:', error)
    return NextResponse.json({ error: 'Failed to approve testimonial' }, { status: 500 })
  }
}
