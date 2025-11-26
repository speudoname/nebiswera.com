import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/analytics - Get webinar analytics
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get webinar with related data
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        videoDuration: true,
        createdAt: true,
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Get registration stats
    const [
      totalRegistrations,
      registrationsByType,
      totalAttended,
      totalCompleted,
      registrationsByDate,
    ] = await Promise.all([
      // Total registrations
      prisma.webinarRegistration.count({ where: { webinarId: id } }),

      // Registrations by session type
      prisma.webinarRegistration.groupBy({
        by: ['sessionType'],
        where: { webinarId: id },
        _count: { id: true },
      }),

      // Total attended (joined at least once)
      prisma.webinarRegistration.count({
        where: { webinarId: id, joinedAt: { not: null } },
      }),

      // Total completed (watched 90%+)
      prisma.webinarRegistration.count({
        where: { webinarId: id, completedAt: { not: null } },
      }),

      // Registrations by date (last 30 days)
      prisma.$queryRaw<Array<{ date: Date; count: number }>>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM webinar.webinar_registrations
        WHERE webinar_id = ${id}
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ])

    // Get engagement stats
    const [
      chatMessageCount,
      interactionStats,
      avgWatchTime,
      watchTimeDistribution,
    ] = await Promise.all([
      // Total chat messages (excluding simulated)
      prisma.webinarChatMessage.count({
        where: { webinarId: id, isSimulated: false },
      }),

      // Interaction engagement stats
      prisma.webinarInteraction.findMany({
        where: { webinarId: id },
        select: {
          id: true,
          type: true,
          title: true,
          triggersAt: true,
          viewCount: true,
          actionCount: true,
        },
        orderBy: { triggersAt: 'asc' },
      }),

      // Average watch time
      prisma.webinarRegistration.aggregate({
        where: { webinarId: id, joinedAt: { not: null } },
        _avg: { maxVideoPosition: true },
      }),

      // Watch time distribution
      prisma.$queryRaw<Array<{ bucket: string; count: number }>>`
        SELECT
          CASE
            WHEN max_video_position < 60 THEN '0-1 min'
            WHEN max_video_position < 300 THEN '1-5 min'
            WHEN max_video_position < 900 THEN '5-15 min'
            WHEN max_video_position < 1800 THEN '15-30 min'
            ELSE '30+ min'
          END as bucket,
          COUNT(*)::int as count
        FROM webinar.webinar_registrations
        WHERE webinar_id = ${id}
          AND joined_at IS NOT NULL
        GROUP BY bucket
        ORDER BY
          CASE bucket
            WHEN '0-1 min' THEN 1
            WHEN '1-5 min' THEN 2
            WHEN '5-15 min' THEN 3
            WHEN '15-30 min' THEN 4
            ELSE 5
          END
      `,
    ])

    // Get source attribution
    const sourceBreakdown = await prisma.webinarRegistration.groupBy({
      by: ['source'],
      where: { webinarId: id },
      _count: { id: true },
    })

    // Get UTM breakdown
    const utmBreakdown: Array<{
      utm_source: string | null
      utm_medium: string | null
      utm_campaign: string | null
      count: number
    }> = await prisma.$queryRaw`
      SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        COUNT(*)::int as count
      FROM webinar.webinar_registrations
      WHERE webinar_id = ${id}
        AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL)
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY count DESC
      LIMIT 20
    `

    // Get recent analytics events
    const recentEvents = await prisma.webinarAnalyticsEvent.findMany({
      where: { webinarId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        metadata: true,
      },
    })

    // Event type breakdown
    const eventBreakdown = await prisma.webinarAnalyticsEvent.groupBy({
      by: ['eventType'],
      where: { webinarId: id },
      _count: { id: true },
    })

    // Calculate rates
    const attendanceRate = totalRegistrations > 0
      ? Math.round((totalAttended / totalRegistrations) * 100)
      : 0

    const completionRate = totalAttended > 0
      ? Math.round((totalCompleted / totalAttended) * 100)
      : 0

    const avgWatchTimeSeconds = avgWatchTime._avg.maxVideoPosition || 0
    const avgWatchPercent = webinar.videoDuration && webinar.videoDuration > 0
      ? Math.round((avgWatchTimeSeconds / webinar.videoDuration) * 100)
      : 0

    // Format interaction stats with engagement rates
    const interactionsWithRates = interactionStats.map((interaction) => ({
      ...interaction,
      triggerTime: interaction.triggersAt,
      engagementRate: interaction.viewCount > 0
        ? Math.round((interaction.actionCount / interaction.viewCount) * 100)
        : 0,
    }))

    return NextResponse.json({
      webinar: {
        id: webinar.id,
        title: webinar.title,
        slug: webinar.slug,
        status: webinar.status,
        videoDuration: webinar.videoDuration,
        createdAt: webinar.createdAt,
      },
      overview: {
        totalRegistrations,
        totalAttended,
        totalCompleted,
        attendanceRate,
        completionRate,
        avgWatchTimeSeconds,
        avgWatchPercent,
        chatMessageCount,
      },
      registrations: {
        byType: registrationsByType.map((r) => ({
          type: r.sessionType,
          count: r._count.id,
        })),
        byDate: registrationsByDate,
        bySource: sourceBreakdown.map((s) => ({
          source: s.source || 'direct',
          count: s._count.id,
        })),
      },
      engagement: {
        interactions: interactionsWithRates,
        watchTimeDistribution,
        eventBreakdown: eventBreakdown.map((e) => ({
          type: e.eventType,
          count: e._count.id,
        })),
      },
      attribution: {
        utm: utmBreakdown.map((u) => ({
          source: u.utm_source,
          medium: u.utm_medium,
          campaign: u.utm_campaign,
          count: u.count,
        })),
      },
      recentActivity: recentEvents.map((e) => ({
        id: e.id,
        type: e.eventType,
        timestamp: e.createdAt,
        metadata: e.metadata,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
