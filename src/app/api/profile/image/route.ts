// API endpoint for uploading user profile images to Bunny Storage
import { NextRequest, NextResponse } from 'next/server'
import { uploadToBunnyStorage, deleteFromBunnyStorage, generateUserProfileKey } from '@/lib/storage'
import { getAuthToken } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, notFoundResponse, badRequestResponse, errorResponse } from '@/lib'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for profile images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// POST /api/profile/image - Upload profile image
export async function POST(request: NextRequest) {
  // Rate limiting for image uploads
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  const token = await getAuthToken(request)

  if (!token?.email) {
    return unauthorizedResponse()
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true, image: true },
    })

    if (!user) {
      return notFoundResponse('User not found')
    }

    const formData = await request.formData()
    const file = formData.get('file')

    // Validate file exists
    if (!file || typeof file === 'string' || !('size' in file) || !('type' in file)) {
      return badRequestResponse('Invalid or missing file')
    }

    const uploadFile = file as Blob & { name: string; size: number; type: string }

    // Validate file size
    if (uploadFile.size > MAX_IMAGE_SIZE) {
      return errorResponse('Image too large. Maximum size: 5MB', 413)
    }

    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(uploadFile.type)) {
      return badRequestResponse('Invalid image type. Allowed: JPEG, PNG, WebP')
    }

    // Delete old profile image if exists
    if (user.image && user.image.includes('user-profiles/')) {
      try {
        const oldPath = user.image.split('/').slice(-2).join('/')
        await deleteFromBunnyStorage(oldPath)
      } catch {
        // Ignore delete errors - old image may not exist
      }
    }

    // Convert file to buffer
    const arrayBuffer = await uploadFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique key and upload
    const key = generateUserProfileKey(user.id, uploadFile.name)
    const url = await uploadToBunnyStorage(buffer, key)

    // Update user with new image URL
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: url },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        preferredLocale: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      image: url,
      user: updatedUser,
    })
  } catch (error: unknown) {
    logger.error('Error uploading profile image:', error)
    return errorResponse('Failed to upload image')
  }
}

// DELETE /api/profile/image - Remove profile image
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse

  const token = await getAuthToken(request)

  if (!token?.email) {
    return unauthorizedResponse()
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true, image: true },
    })

    if (!user) {
      return notFoundResponse('User not found')
    }

    // Delete from Bunny Storage if it's a user-profiles image
    if (user.image && user.image.includes('user-profiles/')) {
      try {
        const path = user.image.split('/').slice(-2).join('/')
        await deleteFromBunnyStorage(path)
      } catch {
        // Ignore delete errors
      }
    }

    // Clear image from user record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        preferredLocale: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error: unknown) {
    logger.error('Error deleting profile image:', error)
    return errorResponse('Failed to delete image')
  }
}
