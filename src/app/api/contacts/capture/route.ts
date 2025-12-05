import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source = 'home_page_test' } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Get or create the tag
    const tag = await prisma.tag.upsert({
      where: { name: source },
      update: {},
      create: {
        name: source,
        description: `Contacts who started the ${source} test`,
        color: '#8B5CF6',
      },
    })

    if (existingContact) {
      // Contact exists - check if they already have this tag
      const hasTag = existingContact.tags.some((ct) => ct.tagId === tag.id)

      if (!hasTag) {
        // Add the tag
        await prisma.contactTag.create({
          data: {
            contactId: existingContact.id,
            tagId: tag.id,
          },
        })

        // Log activity
        await prisma.contactActivity.create({
          data: {
            contactId: existingContact.id,
            type: 'TAG_ADDED',
            description: `Tag "${source}" added from home page test capture`,
            metadata: {
              tagName: source,
              tagId: tag.id,
            },
          },
        })
      }

      return NextResponse.json({
        success: true,
        contact: {
          id: existingContact.id,
          email: existingContact.email,
          isNew: false,
        },
      })
    } else {
      // Create new contact
      const newContact = await prisma.contact.create({
        data: {
          email: email.toLowerCase(),
          source,
          sourceDetails: 'Captured from home page email form',
          status: 'ACTIVE',
          marketingStatus: 'SUBSCRIBED',
          tags: {
            create: {
              tagId: tag.id,
            },
          },
        },
      })

      // Log activity
      await prisma.contactActivity.create({
        data: {
          contactId: newContact.id,
          type: 'CREATED',
          description: `Contact created from ${source}`,
          metadata: {
            source,
            tagName: source,
            tagId: tag.id,
          },
        },
      })

      return NextResponse.json({
        success: true,
        contact: {
          id: newContact.id,
          email: newContact.email,
          isNew: true,
        },
      })
    }
  } catch (error) {
    logger.error('Error capturing contact:', error)
    return NextResponse.json(
      { error: 'Failed to capture contact' },
      { status: 500 }
    )
  }
}
