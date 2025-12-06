import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { WebinarEventType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/schedule - Get schedule configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
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
        intervalMinutes: config.intervalMinutes,
        replayEnabled: config.replayEnabled,
        replayUngated: config.replayUngated,
        replayExpiresAfterDays: config.replayExpiresAfterDays,
        maxSessionsToShow: config.maxSessionsToShow,
        blackoutDates: config.blackoutDates.map((d) => d.toISOString().split('T')[0]),
        useAttendeeTimezone: config.useAttendeeTimezone,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch schedule config:', error)
    return errorResponse('Failed to fetch schedule configuration')
  }
}

// PUT /api/admin/webinars/[id]/schedule - Create or update schedule configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    // Check webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!webinar) {
      return notFoundResponse('Webinar not found')
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
      intervalMinutes,
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
      return badRequestResponse('Invalid event type')
    }

    // Validate required fields based on event type
    if (eventType !== 'ON_DEMAND_ONLY' && !startsAt) {
      return badRequestResponse('Start date is required')
    }

    if (eventType === 'RECURRING' && (!recurringDays?.length || !recurringTimes?.length)) {
      return badRequestResponse('Recurring schedule requires at least one day and one time')
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
      intervalMinutes: intervalMinutes || 15,
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
        intervalMinutes: config.intervalMinutes,
        replayEnabled: config.replayEnabled,
        replayUngated: config.replayUngated,
        replayExpiresAfterDays: config.replayExpiresAfterDays,
        maxSessionsToShow: config.maxSessionsToShow,
        blackoutDates: config.blackoutDates.map((d) => d.toISOString().split('T')[0]),
        useAttendeeTimezone: config.useAttendeeTimezone,
      },
    })
  } catch (error) {
    logger.error('Failed to save schedule config:', error)
    return errorResponse('Failed to save schedule configuration')
  }
}
