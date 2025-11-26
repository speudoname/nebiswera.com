import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface TargetCriteria {
  segmentId?: string
  tagIds?: string[]
  filters?: {
    status?: string
    source?: string
  }
}

// POST /api/admin/campaigns/[id]/prepare - Generate recipient list
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Only prepare DRAFT campaigns
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only prepare draft campaigns' },
        { status: 400 }
      )
    }

    // Delete any existing recipients (in case of re-prepare)
    await prisma.campaignRecipient.deleteMany({
      where: { campaignId: id },
    })

    // Build the contact query based on target type
    const where = buildContactQuery(campaign.targetType, campaign.targetCriteria as TargetCriteria | null)

    // Fetch eligible contacts
    const contacts = await prisma.contact.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })

    if (contacts.length === 0) {
      return NextResponse.json({
        success: true,
        totalRecipients: 0,
        message: 'No eligible contacts found for this targeting',
      })
    }

    // Create recipient records with personalization variables
    const recipientData = contacts.map((contact) => ({
      campaignId: id,
      contactId: contact.id,
      email: contact.email,
      variables: {
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        fullName: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email,
      },
    }))

    // Batch insert recipients (Prisma handles chunking)
    await prisma.campaignRecipient.createMany({
      data: recipientData,
      skipDuplicates: true,
    })

    // Update campaign total
    await prisma.campaign.update({
      where: { id },
      data: { totalRecipients: contacts.length },
    })

    return NextResponse.json({
      success: true,
      totalRecipients: contacts.length,
      message: `Prepared ${contacts.length} recipients`,
    })
  } catch (error) {
    console.error('Failed to prepare campaign:', error)
    return NextResponse.json(
      { error: 'Failed to prepare campaign' },
      { status: 500 }
    )
  }
}

function buildContactQuery(
  targetType: string,
  targetCriteria: TargetCriteria | null
): Prisma.ContactWhereInput {
  // Base filter: only contacts who can receive marketing
  const baseWhere: Prisma.ContactWhereInput = {
    marketingStatus: 'SUBSCRIBED',
    status: { in: ['ACTIVE'] }, // Not archived or bounced
  }

  switch (targetType) {
    case 'ALL_CONTACTS':
      return baseWhere

    case 'REGISTERED_USERS':
      return {
        ...baseWhere,
        userId: { not: null }, // Has linked user account
      }

    case 'SEGMENT':
      if (targetCriteria?.segmentId) {
        // We need to fetch the segment and apply its filters
        // For now, return base - we'll enhance this
        return baseWhere
      }
      return baseWhere

    case 'TAG':
      if (targetCriteria?.tagIds && targetCriteria.tagIds.length > 0) {
        return {
          ...baseWhere,
          tags: {
            some: {
              tagId: { in: targetCriteria.tagIds },
            },
          },
        }
      }
      return baseWhere

    case 'CUSTOM_FILTER':
      if (targetCriteria?.filters) {
        const filters = targetCriteria.filters
        const customWhere: Prisma.ContactWhereInput = { ...baseWhere }

        if (filters.status) {
          customWhere.status = filters.status as Prisma.ContactWhereInput['status']
        }
        if (filters.source) {
          customWhere.source = filters.source
        }

        return customWhere
      }
      return baseWhere

    default:
      return baseWhere
  }
}

// GET /api/admin/campaigns/[id]/prepare - Get recipient count preview
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        targetType: true,
        targetCriteria: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Build query and count
    const where = buildContactQuery(campaign.targetType, campaign.targetCriteria as TargetCriteria | null)
    const count = await prisma.contact.count({ where })

    return NextResponse.json({
      estimatedRecipients: count,
    })
  } catch (error) {
    console.error('Failed to get recipient count:', error)
    return NextResponse.json(
      { error: 'Failed to get recipient count' },
      { status: 500 }
    )
  }
}
