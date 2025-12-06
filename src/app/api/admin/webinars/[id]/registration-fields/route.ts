import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { RegistrationFieldConfig } from '@/app/api/webinars/lib/registration-fields'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/registration-fields - Get registration fields config
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const config = await prisma.webinarRegistrationFieldConfig.findUnique({
      where: { webinarId: id },
    })

    if (!config) {
      return notFoundResponse('Config not found')
    }

    // Convert DB format to API format
    const fieldConfig: RegistrationFieldConfig = {
      nameFormat: config.nameFormat as 'SPLIT' | 'FULL',
      showPhone: config.showPhone,
      phoneRequired: config.phoneRequired,
      customFields: config.customFields as any,
    }

    return NextResponse.json({ config: fieldConfig })
  } catch (error) {
    logger.error('Failed to fetch registration fields config:', error)
    return errorResponse('Failed to fetch registration fields config')
  }
}

// PUT /api/admin/webinars/[id]/registration-fields - Update registration fields config
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body: RegistrationFieldConfig = await request.json()

    // Upsert the config
    const config = await prisma.webinarRegistrationFieldConfig.upsert({
      where: { webinarId: id },
      update: {
        nameFormat: body.nameFormat,
        showPhone: body.showPhone,
        phoneRequired: body.phoneRequired,
        customFields: body.customFields as any,
      },
      create: {
        webinarId: id,
        nameFormat: body.nameFormat,
        showPhone: body.showPhone,
        phoneRequired: body.phoneRequired,
        customFields: body.customFields as any,
      },
    })

    // Convert DB format to API format
    const fieldConfig: RegistrationFieldConfig = {
      nameFormat: config.nameFormat as 'SPLIT' | 'FULL',
      showPhone: config.showPhone,
      phoneRequired: config.phoneRequired,
      customFields: config.customFields as any,
    }

    return NextResponse.json({ config: fieldConfig })
  } catch (error) {
    logger.error('Failed to save registration fields config:', error)
    return errorResponse('Failed to save registration fields config')
  }
}
