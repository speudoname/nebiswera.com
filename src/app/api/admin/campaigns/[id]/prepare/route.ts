import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { logger } from '@/lib'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'
import type { Prisma, ContactStatus } from '@prisma/client'

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
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return notFoundResponse('Campaign not found')
    }

    // Only prepare DRAFT campaigns
    if (campaign.status !== 'DRAFT') {
      return badRequestResponse('Can only prepare draft campaigns')
    }

    // Delete any existing recipients (in case of re-prepare)
    await prisma.campaignRecipient.deleteMany({
      where: { campaignId: id },
    })

    // Build the contact query based on target type
    const where = await buildContactQuery(campaign.targetType, campaign.targetCriteria as TargetCriteria | null)

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
    logger.error('Failed to prepare campaign:', error)
    return errorResponse('Failed to prepare campaign')
  }
}

interface SegmentFilters {
  status?: ContactStatus | ContactStatus[]
  source?: string | string[]
  tags?: string[]
  createdAfter?: string
  createdBefore?: string
  webinarRegistered?: string // webinar ID
  webinarAttended?: string   // webinar ID
}

async function buildContactQuery(
  targetType: string,
  targetCriteria: TargetCriteria | null
): Promise<Prisma.ContactWhereInput> {
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
        // Fetch the segment and apply its filters
        const segment = await prisma.segment.findUnique({
          where: { id: targetCriteria.segmentId },
        })

        if (segment && segment.filters) {
          const filters = segment.filters as SegmentFilters
          const segmentWhere: Prisma.ContactWhereInput = { ...baseWhere }

          // Apply status filter
          if (filters.status) {
            if (Array.isArray(filters.status)) {
              segmentWhere.status = { in: filters.status }
            } else {
              segmentWhere.status = filters.status
            }
          }

          // Apply source filter
          if (filters.source) {
            if (Array.isArray(filters.source)) {
              segmentWhere.source = { in: filters.source }
            } else {
              segmentWhere.source = filters.source
            }
          }

          // Apply tag filter
          if (filters.tags && filters.tags.length > 0) {
            segmentWhere.tags = {
              some: {
                tagId: { in: filters.tags },
              },
            }
          }

          // Apply date filters
          if (filters.createdAfter) {
            segmentWhere.createdAt = {
              ...(segmentWhere.createdAt as Prisma.DateTimeFilter || {}),
              gte: new Date(filters.createdAfter),
            }
          }
          if (filters.createdBefore) {
            segmentWhere.createdAt = {
              ...(segmentWhere.createdAt as Prisma.DateTimeFilter || {}),
              lte: new Date(filters.createdBefore),
            }
          }

          // Apply webinar registration filter
          if (filters.webinarRegistered) {
            segmentWhere.customFields = {
              path: ['webinarStats', 'webinars', filters.webinarRegistered, 'registered'],
              equals: true,
            }
          }

          // Apply webinar attendance filter
          if (filters.webinarAttended) {
            segmentWhere.customFields = {
              path: ['webinarStats', 'webinars', filters.webinarAttended, 'attended'],
              equals: true,
            }
          }

          return segmentWhere
        }
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
    return unauthorizedResponse()
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
      return notFoundResponse('Campaign not found')
    }

    // Build query and count
    const where = await buildContactQuery(campaign.targetType, campaign.targetCriteria as TargetCriteria | null)
    const count = await prisma.contact.count({ where })

    return NextResponse.json({
      estimatedRecipients: count,
    })
  } catch (error) {
    logger.error('Failed to get recipient count:', error)
    return errorResponse('Failed to get recipient count')
  }
}
