import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/campaigns/[id]/stats - Get detailed campaign statistics
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        openedCount: true,
        clickedCount: true,
        bouncedCount: true,
        unsubscribedCount: true,
        sendingStartedAt: true,
        completedAt: true,
        createdAt: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get recipient status breakdown
    const recipientStats = await prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { status: true },
    })

    const statusBreakdown = recipientStats.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count.status
        return acc
      },
      {} as Record<string, number>
    )

    // Get link click stats
    const linkStats = await prisma.campaignLink.findMany({
      where: { campaignId: id },
      select: {
        id: true,
        url: true,
        clickCount: true,
        uniqueClickCount: true,
      },
      orderBy: { clickCount: 'desc' },
    })

    // Get recent activity (last 10 recipient updates)
    const recentActivity = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: id,
        status: { not: 'PENDING' },
      },
      select: {
        email: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        clickedAt: true,
        error: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 10,
    })

    // Calculate rates
    const totalSent = campaign.sentCount || 0
    const rates = {
      deliveryRate: totalSent > 0 ? ((campaign.deliveredCount || 0) / totalSent) * 100 : 0,
      openRate: totalSent > 0 ? ((campaign.openedCount || 0) / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? ((campaign.clickedCount || 0) / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? ((campaign.bouncedCount || 0) / totalSent) * 100 : 0,
      unsubscribeRate: totalSent > 0 ? ((campaign.unsubscribedCount || 0) / totalSent) * 100 : 0,
    }

    // Calculate click-to-open rate (CTOR)
    const clickToOpenRate =
      campaign.openedCount && campaign.openedCount > 0
        ? ((campaign.clickedCount || 0) / campaign.openedCount) * 100
        : 0

    // Calculate sending progress for in-progress campaigns
    const sendingProgress =
      campaign.totalRecipients > 0
        ? (campaign.sentCount / campaign.totalRecipients) * 100
        : 0

    // Calculate duration if campaign is completed or sending
    let durationMinutes: number | null = null
    if (campaign.sendingStartedAt) {
      const endTime = campaign.completedAt || new Date()
      durationMinutes = Math.round(
        (endTime.getTime() - campaign.sendingStartedAt.getTime()) / 60000
      )
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
      },
      totals: {
        recipients: campaign.totalRecipients,
        sent: campaign.sentCount,
        delivered: campaign.deliveredCount,
        opened: campaign.openedCount,
        clicked: campaign.clickedCount,
        bounced: campaign.bouncedCount,
        unsubscribed: campaign.unsubscribedCount,
      },
      rates: {
        delivery: Math.round(rates.deliveryRate * 100) / 100,
        open: Math.round(rates.openRate * 100) / 100,
        click: Math.round(rates.clickRate * 100) / 100,
        clickToOpen: Math.round(clickToOpenRate * 100) / 100,
        bounce: Math.round(rates.bounceRate * 100) / 100,
        unsubscribe: Math.round(rates.unsubscribeRate * 100) / 100,
      },
      recipientStatus: statusBreakdown,
      links: linkStats,
      recentActivity,
      timing: {
        createdAt: campaign.createdAt,
        startedAt: campaign.sendingStartedAt,
        completedAt: campaign.completedAt,
        durationMinutes,
      },
      progress: {
        percentage: Math.round(sendingProgress * 100) / 100,
        remaining: campaign.totalRecipients - campaign.sentCount,
      },
    })
  } catch (error) {
    console.error('Failed to get campaign stats:', error)
    return NextResponse.json(
      { error: 'Failed to get campaign stats' },
      { status: 500 }
    )
  }
}
