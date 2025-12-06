import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/sms/templates/[id]
 * Get a single SMS template
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { id } = await context.params

    const template = await prisma.smsTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    logger.error('Error fetching SMS template:', error)
    return errorResponse('Failed to fetch SMS template')
  }
}

/**
 * PATCH /api/admin/sms/templates/[id]
 * Update an SMS template
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const body = await request.json()

    const existing = await prisma.smsTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const {
      name,
      slug,
      messageKa,
      messageEn,
      category,
      description,
      isActive,
    } = body

    // If slug is being changed, check uniqueness
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.smsTemplate.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'A template with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (messageKa !== undefined) updateData.messageKa = messageKa
    if (messageEn !== undefined) updateData.messageEn = messageEn
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const template = await prisma.smsTemplate.update({
      where: { id },
      data: updateData,
    })

    logger.info('SMS template updated:', { id: template.id, slug: template.slug })

    return NextResponse.json({ template })
  } catch (error) {
    logger.error('Error updating SMS template:', error)
    return errorResponse('Failed to update SMS template')
  }
}

/**
 * DELETE /api/admin/sms/templates/[id]
 * Delete an SMS template
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const { id } = await context.params

    const existing = await prisma.smsTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of default templates
    if (existing.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default system templates. You can deactivate them instead.' },
        { status: 400 }
      )
    }

    // Check if template is in use
    const usageCount = await prisma.notificationRule.count({
      where: { smsTemplateId: id },
    })

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete template that is in use by notification rules',
          usageCount,
        },
        { status: 400 }
      )
    }

    await prisma.smsTemplate.delete({
      where: { id },
    })

    logger.info('SMS template deleted:', { id, slug: existing.slug })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting SMS template:', error)
    return errorResponse('Failed to delete SMS template')
  }
}
