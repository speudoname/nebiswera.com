import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthToken } from '@/lib/auth/utils'
import bcrypt from 'bcryptjs'
import type { NextRequest } from 'next/server'
import { profileUpdateSchema, formatZodError } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { unauthorizedResponse, notFoundResponse, badRequestResponse } from '@/lib'

export async function GET(request: NextRequest) {
  // Rate limiting for profile reads
  const rateLimitResponse = await checkRateLimit(request, 'general')
  if (rateLimitResponse) return rateLimitResponse
  const token = await getAuthToken(request)

  if (!token?.email) {
    return unauthorizedResponse()
  }

  const user = await prisma.user.findUnique({
    where: { email: token.email },
    select: {
      id: true,
      name: true,
      nameKa: true,
      nameEn: true,
      email: true,
      image: true,
      emailVerified: true,
      preferredLocale: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    return notFoundResponse('User not found')
  }

  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  // Rate limiting - stricter for password changes
  const rateLimitResponse = await checkRateLimit(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  const token = await getAuthToken(request)

  if (!token?.email) {
    return unauthorizedResponse()
  }

  const body = await request.json()

  // Validate input with Zod
  const result = profileUpdateSchema.safeParse(body)
  if (!result.success) {
    return badRequestResponse(formatZodError(result.error))
  }

  const { name, nameKa, nameEn, preferredLocale, currentPassword, newPassword } = result.data

  const user = await prisma.user.findUnique({
    where: { email: token.email },
  })

  if (!user) {
    return notFoundResponse('User not found')
  }

  const updateData: {
    name?: string
    nameKa?: string
    nameEn?: string
    preferredLocale?: string
    password?: string
  } = {}

  // Update name if provided
  if (name !== undefined) {
    updateData.name = name
  }

  // Update nameKa if provided
  if (nameKa !== undefined) {
    updateData.nameKa = nameKa
  }

  // Update nameEn if provided
  if (nameEn !== undefined) {
    updateData.nameEn = nameEn
  }

  // Update preferred locale if provided
  if (preferredLocale) {
    updateData.preferredLocale = preferredLocale
  }

  // Update password if provided
  if (currentPassword && newPassword) {
    // Verify current password
    if (!user.password) {
      return badRequestResponse('Cannot change password for social login accounts')
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return badRequestResponse('Current password is incorrect')
    }

    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  const updatedUser = await prisma.user.update({
    where: { email: token.email },
    data: updateData,
    select: {
      id: true,
      name: true,
      nameKa: true,
      nameEn: true,
      email: true,
      image: true,
      emailVerified: true,
      preferredLocale: true,
      role: true,
      createdAt: true,
    },
  })

  return NextResponse.json(updatedUser)
}

export async function DELETE(request: NextRequest) {
  // Rate limiting for account deletion
  const rateLimitResponse = await checkRateLimit(request, 'auth')
  if (rateLimitResponse) return rateLimitResponse

  const token = await getAuthToken(request)

  if (!token?.email) {
    return unauthorizedResponse()
  }

  const user = await prisma.user.findUnique({
    where: { email: token.email },
  })

  if (!user) {
    return notFoundResponse('User not found')
  }

  // Delete user and related data
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ])

  return NextResponse.json({ success: true })
}
