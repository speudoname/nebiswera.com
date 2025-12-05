import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, errorResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/courses/[id]/enrollments/export - Export enrollments as CSV
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id: courseId } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'

  try {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true },
    })

    if (!course) {
      return errorResponse('Course not found')
    }

    // Get all enrollments with progress
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        partProgress: {
          select: {
            status: true,
            watchPercent: true,
            completedAt: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    // Get course stats
    const totalParts = await prisma.lmsPart.count({
      where: {
        lesson: {
          courseId,
        },
      },
    })

    // Build CSV
    const headers = [
      'Student Name',
      'Email',
      'Status',
      'Progress %',
      'Parts Completed',
      'Total Parts',
      'Enrolled Date',
      'Completed Date',
      'Expires Date',
      'Last Activity',
    ]

    const rows = enrollments.map(enrollment => {
      const completedParts = enrollment.partProgress.filter(p => p.status === 'COMPLETED').length
      const lastActivity = enrollment.partProgress.length > 0
        ? enrollment.partProgress.reduce((latest, p) => {
            const pDate = p.completedAt ? new Date(p.completedAt) : new Date(0)
            return pDate > latest ? pDate : latest
          }, new Date(0))
        : null

      return [
        enrollment.user.name || '',
        enrollment.user.email,
        enrollment.status,
        enrollment.progressPercent.toString(),
        completedParts.toString(),
        totalParts.toString(),
        new Date(enrollment.enrolledAt).toISOString().split('T')[0],
        enrollment.completedAt ? new Date(enrollment.completedAt).toISOString().split('T')[0] : '',
        enrollment.expiresAt ? new Date(enrollment.expiresAt).toISOString().split('T')[0] : '',
        lastActivity ? lastActivity.toISOString().split('T')[0] : '',
      ]
    })

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    // Return as downloadable file
    const filename = `${course.slug}-enrollments-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Failed to export enrollments:', error)
    return errorResponse('Failed to export enrollments')
  }
}
