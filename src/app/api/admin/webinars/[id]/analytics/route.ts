import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib'
import { getEngagementBreakdown } from '@/app/api/webinars/lib/engagement'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to build WHERE clause for raw SQL
function buildWhereClause(
  webinarId: string,
  dateStart?: Date,
  dateEnd?: Date,
  sessionId?: string
): string {
  let where = `"webinarId" = '${webinarId}'`
  if (dateStart && dateEnd) {
    where += ` AND "registeredAt" >= '${dateStart.toISOString()}' AND "registeredAt" <= '${dateEnd.toISOString()}'`
  }
  if (sessionId) {
    where += ` AND "sessionId" = '${sessionId}'`
  }
  return where
}

// GET /api/admin/webinars/[id]/analytics - Get webinar analytics (OPTIMIZED)
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)

  // Parse filters from query params
  const dateStart = searchParams.get('dateStart') ? new Date(searchParams.get('dateStart')!) : undefined
  const dateEnd = searchParams.get('dateEnd') ? new Date(searchParams.get('dateEnd')!) : undefined
  const sessionId = searchParams.get('sessionId') || undefined

  try {
    // Build filter conditions for Prisma
    const dateFilter = dateStart && dateEnd ? {
      registeredAt: { gte: dateStart, lte: dateEnd },
    } : {}
    const sessionFilter = sessionId ? { sessionId } : {}
    const whereClause = buildWhereClause(id, dateStart, dateEnd, sessionId)

    // ============================================
    // BATCH 1: Get webinar + all core counts in ONE query
    // ============================================
    const [webinar, coreStats] = await Promise.all([
      // Get webinar details
      prisma.webinar.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          videoDuration: true,
          hlsUrl: true,
          thumbnailUrl: true,
          createdAt: true,
        },
      }),

      // Get ALL registration counts in a single query
      prisma.$queryRaw<Array<{
        total: number
        attended: number
        completed: number
        engaged: number
        avg_watch_time: number
      }>>`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE "joinedAt" IS NOT NULL)::int as attended,
          COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL)::int as completed,
          COUNT(*) FILTER (WHERE "engagementScore" >= 40)::int as engaged,
          COALESCE(AVG("maxVideoPosition") FILTER (WHERE "joinedAt" IS NOT NULL), 0)::float as avg_watch_time
        FROM webinar.webinar_registrations
        WHERE ${Prisma.raw(whereClause)}
      `,
    ])

    if (!webinar) {
      return notFoundResponse('Webinar not found')
    }

    const stats = coreStats[0] || { total: 0, attended: 0, completed: 0, engaged: 0, avg_watch_time: 0 }

    // ============================================
    // BATCH 2: Get groupings and distributions in parallel
    // ============================================
    const [
      registrationsByType,
      registrationsByDate,
      sourceBreakdown,
      watchTimeDistribution,
      utmBreakdown,
    ] = await Promise.all([
      // Registrations by session type
      prisma.$queryRaw<Array<{ session_type: string; count: number }>>`
        SELECT "sessionType" as session_type, COUNT(*)::int as count
        FROM webinar.webinar_registrations
        WHERE ${Prisma.raw(whereClause)}
        GROUP BY "sessionType"
      `,

      // Registrations by date
      prisma.$queryRaw<Array<{ date: Date; count: number }>>`
        SELECT DATE("registeredAt") as date, COUNT(*)::int as count
        FROM webinar.webinar_registrations
        WHERE ${Prisma.raw(whereClause)}
          ${dateStart && dateEnd ? Prisma.raw('') : Prisma.raw(`AND "registeredAt" >= NOW() - INTERVAL '30 days'`)}
        GROUP BY DATE("registeredAt")
        ORDER BY date DESC
      `,

      // Source breakdown
      prisma.$queryRaw<Array<{ source: string | null; count: number }>>`
        SELECT "source", COUNT(*)::int as count
        FROM webinar.webinar_registrations
        WHERE ${Prisma.raw(whereClause)}
        GROUP BY "source"
      `,

      // Watch time distribution
      prisma.$queryRaw<Array<{ bucket: string; count: number }>>`
        SELECT bucket, COUNT(*)::int as count
        FROM (
          SELECT
            CASE
              WHEN "maxVideoPosition" < 60 THEN '0-1 min'
              WHEN "maxVideoPosition" < 300 THEN '1-5 min'
              WHEN "maxVideoPosition" < 900 THEN '5-15 min'
              WHEN "maxVideoPosition" < 1800 THEN '15-30 min'
              ELSE '30+ min'
            END as bucket
          FROM webinar.webinar_registrations
          WHERE ${Prisma.raw(whereClause)} AND "joinedAt" IS NOT NULL
        ) buckets
        GROUP BY bucket
        ORDER BY CASE bucket
          WHEN '0-1 min' THEN 1 WHEN '1-5 min' THEN 2
          WHEN '5-15 min' THEN 3 WHEN '15-30 min' THEN 4 ELSE 5
        END
      `,

      // UTM breakdown
      prisma.$queryRaw<Array<{
        utm_source: string | null
        utm_medium: string | null
        utm_campaign: string | null
        count: number
      }>>`
        SELECT "utmSource" as utm_source, "utmMedium" as utm_medium, "utmCampaign" as utm_campaign, COUNT(*)::int as count
        FROM webinar.webinar_registrations
        WHERE ${Prisma.raw(whereClause)}
          AND ("utmSource" IS NOT NULL OR "utmMedium" IS NOT NULL OR "utmCampaign" IS NOT NULL)
        GROUP BY "utmSource", "utmMedium", "utmCampaign"
        ORDER BY count DESC
        LIMIT 20
      `,
    ])

    // Get registration IDs for filtering related tables (only if needed)
    const registrationIds = sessionId || (dateStart && dateEnd)
      ? (await prisma.webinarRegistration.findMany({
          where: { webinarId: id, ...dateFilter, ...sessionFilter },
          select: { id: true },
        })).map((r) => r.id)
      : undefined

    // ============================================
    // BATCH 3: Engagement data in parallel
    // ============================================
    const [
      chatMessageCount,
      interactionStats,
      eventBreakdown,
      convertedCount,
      engagementBreakdown,
    ] = await Promise.all([
      // Chat message count
      prisma.webinarChatMessage.count({
        where: {
          webinarId: id,
          isSimulated: false,
          ...(registrationIds && { registrationId: { in: registrationIds } }),
        },
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

      // Event type breakdown
      prisma.webinarAnalyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          webinarId: id,
          ...(registrationIds && { registrationId: { in: registrationIds } }),
        },
        _count: { id: true },
      }),

      // CTA click count for funnel
      prisma.webinarAnalyticsEvent.count({
        where: {
          webinarId: id,
          eventType: 'CTA_CLICKED',
          ...(registrationIds && { registrationId: { in: registrationIds } }),
        },
      }),

      // Engagement breakdown (from engagement.ts)
      getEngagementBreakdown(id, sessionId, dateStart, dateEnd),
    ])

    // ============================================
    // BATCH 4: Chat analytics + recent events + cohort (parallel)
    // ============================================
    const [chatMessages, recentEvents, cohortData] = await Promise.all([
      // Chat messages for detailed analytics
      prisma.webinarChatMessage.findMany({
        where: {
          webinarId: id,
          isSimulated: false,
          ...(registrationIds && { registrationId: { in: registrationIds } }),
        },
        select: {
          appearsAt: true,
          registrationId: true,
          registration: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),

      // Recent events
      prisma.webinarAnalyticsEvent.findMany({
        where: {
          webinarId: id,
          ...(registrationIds && { registrationId: { in: registrationIds } }),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          eventType: true,
          createdAt: true,
          metadata: true,
        },
      }),

      // Cohort analysis - OPTIMIZED: single query for all sessions
      !sessionId ? prisma.$queryRaw<Array<{
        session_id: string
        scheduled_at: Date
        session_type: string
        registrations: number
        attended: number
        completed: number
        avg_score: number
        avg_watch: number
      }>>`
        SELECT
          s.id as session_id,
          s."scheduledAt" as scheduled_at,
          s.type as session_type,
          COUNT(r.id)::int as registrations,
          COUNT(r.id) FILTER (WHERE r."joinedAt" IS NOT NULL)::int as attended,
          COUNT(r.id) FILTER (WHERE r."completedAt" IS NOT NULL)::int as completed,
          COALESCE(AVG(r."engagementScore") FILTER (WHERE r."engagementScore" IS NOT NULL), 0)::float as avg_score,
          COALESCE(AVG(r."maxVideoPosition") FILTER (WHERE r."joinedAt" IS NOT NULL), 0)::float as avg_watch
        FROM webinar.webinar_sessions s
        LEFT JOIN webinar.webinar_registrations r ON r."sessionId" = s.id
          ${dateStart && dateEnd ? Prisma.raw(`AND r."registeredAt" >= '${dateStart.toISOString()}' AND r."registeredAt" <= '${dateEnd.toISOString()}'`) : Prisma.raw('')}
        WHERE s."webinarId" = ${id}
        GROUP BY s.id, s."scheduledAt", s.type
        ORDER BY s."scheduledAt" DESC
      ` : Promise.resolve([]),
    ])

    // ============================================
    // Calculate derived metrics
    // ============================================
    const totalRegistrations = stats.total
    const totalAttended = stats.attended
    const totalCompleted = stats.completed
    const engagedCount = stats.engaged
    const avgWatchTimeSeconds = stats.avg_watch_time

    const attendanceRate = totalRegistrations > 0
      ? Math.round((totalAttended / totalRegistrations) * 100)
      : 0

    const completionRate = totalAttended > 0
      ? Math.round((totalCompleted / totalAttended) * 100)
      : 0

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

    // Funnel data
    const funnelData = {
      registered: totalRegistrations,
      attended: totalAttended,
      engaged: engagedCount,
      completed: totalCompleted,
      converted: convertedCount,
    }

    // ============================================
    // Chat Analytics
    // ============================================
    let chatData: any = undefined
    if (chatMessageCount > 0) {
      // Calculate messages per minute
      const messagesPerMinute: Array<{ minute: number; count: number }> = []
      if (webinar.videoDuration) {
        const totalMinutes = Math.ceil(webinar.videoDuration / 60)
        for (let minute = 0; minute < totalMinutes; minute++) {
          const count = chatMessages.filter((msg) => {
            if (!msg.appearsAt) return false
            return Math.floor(msg.appearsAt / 60) === minute
          }).length
          messagesPerMinute.push({ minute, count })
        }
      }

      // Top chatters
      const chatterCounts = new Map<string, { email: string; name: string; count: number }>()
      chatMessages.forEach((msg) => {
        if (!msg.registrationId || !msg.registration) return
        const existing = chatterCounts.get(msg.registrationId)
        if (existing) {
          existing.count++
        } else {
          chatterCounts.set(msg.registrationId, {
            email: msg.registration.email,
            name: `${msg.registration.firstName} ${msg.registration.lastName}`.trim() || msg.registration.email,
            count: 1,
          })
        }
      })
      const topChatters = Array.from(chatterCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const peakActivity = messagesPerMinute.reduce(
        (peak, current) => (current.count > peak.count ? current : peak),
        { minute: 0, count: 0 }
      )

      chatData = {
        totalMessages: chatMessageCount,
        uniqueChatters: chatterCounts.size,
        messagesPerMinute,
        topChatters,
        peakActivity,
      }
    }

    // ============================================
    // Time-based analytics (video drop-off)
    // ============================================
    let timeBasedData: any = undefined
    if (webinar.videoDuration && totalAttended > 0) {
      // Get max video positions in one query
      const registrationsWithPosition = await prisma.webinarRegistration.findMany({
        where: { webinarId: id, joinedAt: { not: null }, ...dateFilter, ...sessionFilter },
        select: { maxVideoPosition: true },
      })

      const segmentSize = 60
      const totalSegments = Math.ceil(webinar.videoDuration / segmentSize)
      const segments = []

      for (let i = 0; i < totalSegments; i++) {
        const startSecond = i * segmentSize
        const endSecond = Math.min((i + 1) * segmentSize, webinar.videoDuration)
        const viewerCount = registrationsWithPosition.filter((r) => r.maxVideoPosition >= startSecond).length
        const dropoffCount = registrationsWithPosition.filter(
          (r) => r.maxVideoPosition >= startSecond && r.maxVideoPosition < endSecond
        ).length
        const dropoffRate = viewerCount > 0 ? Math.round((dropoffCount / viewerCount) * 100) : 0
        segments.push({ startSecond, endSecond, viewerCount, dropoffCount, dropoffRate })
      }

      const criticalDropoffs = segments
        .filter((s) => s.dropoffRate > 30)
        .map((s) => ({ time: s.startSecond, dropoffRate: s.dropoffRate }))

      const peakViewers = segments.reduce(
        (peak, current) => (current.viewerCount > peak.count ? { time: current.startSecond, count: current.viewerCount } : peak),
        { time: 0, count: 0 }
      )

      timeBasedData = {
        segments,
        avgSessionDuration: avgWatchTimeSeconds,
        peakViewers,
        criticalDropoffs,
      }
    }

    // ============================================
    // Cohort Analytics (from optimized query)
    // ============================================
    let formattedCohortData: any = undefined
    if (!sessionId && cohortData.length > 1) {
      const sessionStats = cohortData.map((s) => ({
        sessionId: s.session_id,
        sessionDate: s.scheduled_at.toISOString(),
        sessionType: s.session_type,
        registrations: s.registrations,
        attendanceRate: s.registrations > 0 ? Math.round((s.attended / s.registrations) * 100) : 0,
        completionRate: s.attended > 0 ? Math.round((s.completed / s.attended) * 100) : 0,
        avgWatchTime: Math.round(s.avg_watch),
        avgEngagementScore: Math.round(s.avg_score),
      }))

      // Calculate trends
      const midpoint = Math.floor(sessionStats.length / 2)
      const firstHalf = sessionStats.slice(0, midpoint)
      const secondHalf = sessionStats.slice(midpoint)

      const avgFirst = (arr: typeof sessionStats, key: keyof typeof sessionStats[0]) =>
        arr.length > 0 ? arr.reduce((sum, s) => sum + (s[key] as number), 0) / arr.length : 0
      const avgSecond = (arr: typeof sessionStats, key: keyof typeof sessionStats[0]) =>
        arr.length > 0 ? arr.reduce((sum, s) => sum + (s[key] as number), 0) / arr.length : 0

      const trends = {
        attendanceRate: avgSecond(secondHalf, 'attendanceRate') > avgFirst(firstHalf, 'attendanceRate') + 5 ? 'up' as const
          : avgSecond(secondHalf, 'attendanceRate') < avgFirst(firstHalf, 'attendanceRate') - 5 ? 'down' as const : 'stable' as const,
        completionRate: avgSecond(secondHalf, 'completionRate') > avgFirst(firstHalf, 'completionRate') + 5 ? 'up' as const
          : avgSecond(secondHalf, 'completionRate') < avgFirst(firstHalf, 'completionRate') - 5 ? 'down' as const : 'stable' as const,
        engagement: avgSecond(secondHalf, 'avgEngagementScore') > avgFirst(firstHalf, 'avgEngagementScore') + 5 ? 'up' as const
          : avgSecond(secondHalf, 'avgEngagementScore') < avgFirst(firstHalf, 'avgEngagementScore') - 5 ? 'down' as const : 'stable' as const,
      }

      const sessionsWithScore = sessionStats.map((s) => ({
        ...s,
        overallScore: (s.attendanceRate + s.completionRate + s.avgEngagementScore) / 3,
      }))
      const sortedSessions = [...sessionsWithScore].sort((a, b) => b.overallScore - a.overallScore)

      formattedCohortData = {
        sessions: sessionStats,
        trends,
        bestSession: sortedSessions[0] || null,
        worstSession: sortedSessions[sortedSessions.length - 1] || null,
      }
    }

    // ============================================
    // Comparative Analytics (benchmarking)
    // ============================================
    const comparativeData = {
      metrics: [
        {
          label: 'Attendance Rate',
          current: attendanceRate,
          average: 65,
          best: 85,
          unit: '%',
          percentile: attendanceRate >= 85 ? 90 : attendanceRate >= 65 ? 60 : attendanceRate >= 50 ? 40 : 20,
        },
        {
          label: 'Completion Rate',
          current: completionRate,
          average: 55,
          best: 75,
          unit: '%',
          percentile: completionRate >= 75 ? 90 : completionRate >= 55 ? 60 : completionRate >= 40 ? 40 : 20,
        },
        {
          label: 'Avg Watch Time',
          current: Math.round(avgWatchTimeSeconds / 60),
          average: 20,
          best: 35,
          unit: ' min',
          percentile: avgWatchTimeSeconds >= 2100 ? 90 : avgWatchTimeSeconds >= 1200 ? 60 : avgWatchTimeSeconds >= 600 ? 40 : 20,
        },
        {
          label: 'Engagement Score',
          current: engagementBreakdown.averageScore,
          average: 55,
          best: 80,
          unit: '',
          percentile: engagementBreakdown.averageScore >= 80 ? 90 : engagementBreakdown.averageScore >= 55 ? 60 : engagementBreakdown.averageScore >= 40 ? 40 : 20,
        },
      ],
      overallScore: Math.round((attendanceRate + completionRate + avgWatchPercent + engagementBreakdown.averageScore) / 4),
      rank: 'Top 10%',
    }

    // ============================================
    // Return response
    // ============================================
    return NextResponse.json({
      webinar: {
        id: webinar.id,
        title: webinar.title,
        slug: webinar.slug,
        status: webinar.status,
        videoDuration: webinar.videoDuration,
        hlsUrl: webinar.hlsUrl,
        thumbnailUrl: webinar.thumbnailUrl,
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
          type: r.session_type,
          count: r.count,
        })),
        byDate: registrationsByDate,
        bySource: sourceBreakdown.map((s) => ({
          source: s.source || 'direct',
          count: s.count,
        })),
      },
      engagement: {
        interactions: interactionsWithRates,
        watchTimeDistribution,
        eventBreakdown: eventBreakdown.map((e) => ({
          type: e.eventType,
          count: e._count.id,
        })),
        scores: engagementBreakdown,
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
      funnel: funnelData,
      chat: chatData,
      timeBased: timeBasedData,
      cohort: formattedCohortData,
      comparative: comparativeData,
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return errorResponse('Failed to fetch analytics')
  }
}
