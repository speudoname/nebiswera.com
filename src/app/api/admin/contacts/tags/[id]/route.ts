import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { name, color, description } = body

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return notFoundResponse('Tag not found')
    }

    // Check if name is being changed and already exists
    if (name && name !== existingTag.name) {
      const nameExists = await prisma.tag.findUnique({
        where: { name },
      })
      if (nameExists) {
        return badRequestResponse('A tag with this name already exists')
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        color,
        description,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    logger.error('Failed to update tag:', error)
    return errorResponse('Failed to update tag')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
    })

    if (!tag) {
      return notFoundResponse('Tag not found')
    }

    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete tag:', error)
    return errorResponse('Failed to delete tag')
  }
}
