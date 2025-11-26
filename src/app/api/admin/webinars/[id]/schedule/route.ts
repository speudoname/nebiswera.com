import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { WebinarEventType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/schedule - Get schedule configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const config = await prisma.webinarScheduleConfig.findUnique({
      where: { webinarId: id },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    // Format dates for the frontend
    return NextResponse.json({
      config: {
        id: config.id,
        eventType: config.eventType,
        startsAt: config.startsAt.toISOString().split('T')[0],
        endsAt: config.endsAt?.toISOString().split('T')[0] || null,
        recurringDays: config.recurringDays,
        recurringTimes: config.recurringTimes,
        specificDates: config.specificDates.map((d) => d.toISOString()),
        onDemandEnabled: config.onDemandEnabled,
        onDemandUngated: config.onDemandUngated,
        justInTimeEnabled: config.justInTimeEnabled,
        justInTimeMinutes: config.justInTimeMinutes,
        replayEnabled: config.replayEnabled,
        replayUngated: config.replayUngated,
        replayExpiresAfterDays: config.replayExpiresAfterDays,
        maxSessionsToShow: config.maxSessionsToShow,
        blackoutDates: config.blackoutDates.map((d) => d.toISOString().split('T')[0]),
        useAttendeeTimezone: config.useAttendeeTimezone,
      },
    })
  } catch (error) {
    console.error('Failed to fetch schedule config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webinars/[id]/schedule - Create or update schedule configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      eventType,
      startsAt,
      endsAt,
      recurringDays,
      recurringTimes,
      specificDates,
      onDemandEnabled,
      onDemandUngated,
      justInTimeEnabled,
      justInTimeMinutes,
      replayEnabled,
      replayUngated,
      replayExpiresAfterDays,
      maxSessionsToShow,
      blackoutDates,
      useAttendeeTimezone,
    } = body

    // Validate event type
    const validEventTypes: WebinarEventType[] = [
      'RECURRING',
      'ONE_TIME',
      'SPECIFIC_DATES',
      'ON_DEMAND_ONLY',
    ]
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Validate required fields based on event type
    if (eventType !== 'ON_DEMAND_ONLY' && !startsAt) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    if (eventType === 'RECURRING' && (!recurringDays?.length || !recurringTimes?.length)) {
      return NextResponse.json(
        { error: 'Recurring schedule requires at least one day and one time' },
        { status: 400 }
      )
    }

    // Prepare data
    const configData = {
      eventType: eventType as WebinarEventType,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : null,
      recurringDays: recurringDays || [],
      recurringTimes: recurringTimes || [],
      specificDates: (specificDates || []).map((d: string) => new Date(d)),
      onDemandEnabled: onDemandEnabled || false,
      onDemandUngated: onDemandUngated || false,
      justInTimeEnabled: justInTimeEnabled || false,
      justInTimeMinutes: justInTimeMinutes || 15,
      replayEnabled: replayEnabled !== false, // default true
      replayUngated: replayUngated || false,
      replayExpiresAfterDays: replayExpiresAfterDays || null,
      maxSessionsToShow: maxSessionsToShow || 3,
      blackoutDates: (blackoutDates || []).map((d: string) => new Date(d)),
      useAttendeeTimezone: useAttendeeTimezone || false,
    }

    // Upsert schedule config
    const config = await prisma.webinarScheduleConfig.upsert({
      where: { webinarId: id },
      create: {
        webinarId: id,
        ...configData,
      },
      update: configData,
    })

    return NextResponse.json({
      config: {
        id: config.id,
        eventType: config.eventType,
        startsAt: config.startsAt.toISOString().split('T')[0],
        endsAt: config.endsAt?.toISOString().split('T')[0] || null,
        recurringDays: config.recurringDays,
        recurringTimes: config.recurringTimes,
        specificDates: config.specificDates.map((d) => d.toISOString()),
        onDemandEnabled: config.onDemandEnabled,
        onDemandUngated: config.onDemandUngated,
        justInTimeEnabled: config.justInTimeEnabled,
        justInTimeMinutes: config.justInTimeMinutes,
        replayEnabled: config.replayEnabled,
        replayUngated: config.replayUngated,
        replayExpiresAfterDays: config.replayExpiresAfterDays,
        maxSessionsToShow: config.maxSessionsToShow,
        blackoutDates: config.blackoutDates.map((d) => d.toISOString().split('T')[0]),
        useAttendeeTimezone: config.useAttendeeTimezone,
      },
    })
  } catch (error) {
    console.error('Failed to save schedule config:', error)
    return NextResponse.json(
      { error: 'Failed to save schedule configuration' },
      { status: 500 }
    )
  }
}
