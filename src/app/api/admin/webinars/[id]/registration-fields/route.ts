import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { RegistrationFieldConfig } from '@/types/registration-fields'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/webinars/[id]/registration-fields - Get registration fields config
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const config = await prisma.webinarRegistrationFieldConfig.findUnique({
      where: { webinarId: id },
    })

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 })
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
    console.error('Failed to fetch registration fields config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration fields config' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/webinars/[id]/registration-fields - Update registration fields config
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    console.error('Failed to save registration fields config:', error)
    return NextResponse.json(
      { error: 'Failed to save registration fields config' },
      { status: 500 }
    )
  }
}
