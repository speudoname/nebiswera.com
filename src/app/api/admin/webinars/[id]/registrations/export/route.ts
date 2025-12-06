import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/registrations/export - Export registrations as CSV
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const registrations = await prisma.webinarRegistration.findMany({
      where: { webinarId: id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        sessionType: true,
        registeredAt: true,
        joinedAt: true,
        leftAt: true,
        watchTimeSeconds: true,
        maxVideoPosition: true,
        completedAt: true,
        engagementScore: true,
        chatMessageCount: true,
        pollResponseCount: true,
        ctaClickCount: true,
        source: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        timezone: true,
      },
      orderBy: { registeredAt: 'desc' },
    })

    // Build CSV
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Status',
      'Session Type',
      'Registered At',
      'Joined At',
      'Left At',
      'Watch Time (seconds)',
      'Max Position (seconds)',
      'Completed At',
      'Engagement Score',
      'Chat Messages',
      'Poll Responses',
      'CTA Clicks',
      'Source',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'Timezone',
    ]

    const rows = registrations.map((r) => [
      r.email,
      r.firstName || '',
      r.lastName || '',
      r.status,
      r.sessionType,
      r.registeredAt.toISOString(),
      r.joinedAt?.toISOString() || '',
      r.leftAt?.toISOString() || '',
      r.watchTimeSeconds.toString(),
      r.maxVideoPosition.toString(),
      r.completedAt?.toISOString() || '',
      r.engagementScore?.toString() || '',
      r.chatMessageCount.toString(),
      r.pollResponseCount.toString(),
      r.ctaClickCount.toString(),
      r.source || '',
      r.utmSource || '',
      r.utmMedium || '',
      r.utmCampaign || '',
      r.timezone,
    ])

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="webinar-${id}-registrations.csv"`,
      },
    })
  } catch (error) {
    logger.error('Failed to export registrations:', error)
    return errorResponse('Failed to export registrations')
  }
}
