import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/sessions - Get all sessions for a webinar
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse('Unauthorized')
  }

  const { id } = await params

  try {
    const sessions = await prisma.webinarSession.findMany({
      where: {
        webinarId: id,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    })

    return successResponse({
      sessions: sessions.map((s) => ({
        id: s.id,
        scheduledAt: s.scheduledAt.toISOString(),
        type: s.type,
        registrationCount: s._count.registrations,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return errorResponse(error)
  }
}
