import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { NextRequest } from 'next/server'
import type { RegistrationFieldConfig } from '@/types/registration-fields'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/webinars/[slug]/registration-fields - Get registration fields config (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  try {
    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        registrationFieldConfig: true,
      },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    if (webinar.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Webinar is not available' },
        { status: 403 }
      )
    }

    // If no config exists, return defaults
    if (!webinar.registrationFieldConfig) {
      const defaultConfig: RegistrationFieldConfig = {
        nameFormat: 'SPLIT',
        showPhone: false,
        phoneRequired: false,
        customFields: [],
      }
      return NextResponse.json({ config: defaultConfig })
    }

    // Convert DB format to API format
    const fieldConfig: RegistrationFieldConfig = {
      nameFormat: webinar.registrationFieldConfig.nameFormat as 'SPLIT' | 'FULL',
      showPhone: webinar.registrationFieldConfig.showPhone,
      phoneRequired: webinar.registrationFieldConfig.phoneRequired,
      customFields: webinar.registrationFieldConfig.customFields as any,
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
