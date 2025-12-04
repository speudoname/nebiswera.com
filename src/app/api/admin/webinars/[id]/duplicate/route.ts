import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to generate unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = `${baseSlug}-copy`
  let counter = 1

  while (true) {
    const existing = await prisma.webinar.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-copy-${counter}`
    counter++
  }
}

// POST /api/admin/webinars/[id]/duplicate - Duplicate a webinar
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get the original webinar with all related data
    const original = await prisma.webinar.findUnique({
      where: { id },
      include: {
        scheduleConfig: true,
        interactions: true,
        notifications: true,
        chatMessages: {
          where: { isSimulated: true }, // Only copy simulated chat messages
        },
      },
    })

    if (!original) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Generate unique slug
    const newSlug = await generateUniqueSlug(original.slug)

    // Create the duplicate webinar
    const duplicate = await prisma.webinar.create({
      data: {
        title: `${original.title} (Copy)`,
        slug: newSlug,
        description: original.description,
        hlsUrl: original.hlsUrl,
        videoDuration: original.videoDuration,
        thumbnailUrl: original.thumbnailUrl,
        landingPagePath: null, // Don't copy page paths
        thankYouPagePath: null,
        status: 'DRAFT', // Always start as draft
        timezone: original.timezone,
        presenterName: original.presenterName,
        presenterTitle: original.presenterTitle,
        presenterAvatar: original.presenterAvatar,
        presenterBio: original.presenterBio,
        completionPercent: original.completionPercent,
        // Copy schedule config if exists
        ...(original.scheduleConfig && {
          scheduleConfig: {
            create: {
              eventType: original.scheduleConfig.eventType,
              startsAt: new Date(), // Reset to now
              endsAt: original.scheduleConfig.endsAt,
              recurringDays: original.scheduleConfig.recurringDays,
              recurringTimes: original.scheduleConfig.recurringTimes,
              specificDates: [], // Reset specific dates
              onDemandEnabled: original.scheduleConfig.onDemandEnabled,
              onDemandUngated: original.scheduleConfig.onDemandUngated,
              justInTimeEnabled: original.scheduleConfig.justInTimeEnabled,
              justInTimeMinutes: original.scheduleConfig.justInTimeMinutes,
              replayEnabled: original.scheduleConfig.replayEnabled,
              replayUngated: original.scheduleConfig.replayUngated,
              replayExpiresAfterDays: original.scheduleConfig.replayExpiresAfterDays,
              maxSessionsToShow: original.scheduleConfig.maxSessionsToShow,
              blackoutDates: [],
              useAttendeeTimezone: original.scheduleConfig.useAttendeeTimezone,
            },
          },
        }),
        // Copy interactions
        interactions: {
          create: original.interactions.map((interaction) => ({
            type: interaction.type,
            triggersAt: interaction.triggersAt,
            duration: interaction.duration,
            title: interaction.title,
            description: interaction.description,
            content: interaction.content as object,
            pauseVideo: interaction.pauseVideo,
            required: interaction.required,
            showOnReplay: interaction.showOnReplay,
            dismissable: interaction.dismissable,
            position: interaction.position,
            sortOrder: interaction.sortOrder,
          })),
        },
        // Copy notification templates
        notifications: {
          create: original.notifications.map((notification) => ({
            triggerType: notification.triggerType,
            triggerMinutes: notification.triggerMinutes,
            conditions: notification.conditions || undefined,
            channel: notification.channel,
            subject: notification.subject,
            bodyHtml: notification.bodyHtml,
            bodyText: notification.bodyText,
            isActive: notification.isActive,
            isDefault: false, // Don't copy isDefault flag
            sortOrder: notification.sortOrder,
          })),
        },
        // Copy simulated chat messages
        chatMessages: {
          create: original.chatMessages.map((message) => ({
            isSimulated: true,
            appearsAt: message.appearsAt,
            senderName: message.senderName,
            message: message.message,
            isFromModerator: message.isFromModerator,
          })),
        },
      },
      include: {
        scheduleConfig: true,
        _count: {
          select: {
            registrations: true,
            sessions: true,
            interactions: true,
          },
        },
      },
    })

    return NextResponse.json(duplicate, { status: 201 })
  } catch (error) {
    console.error('Failed to duplicate webinar:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate webinar' },
      { status: 500 }
    )
  }
}
