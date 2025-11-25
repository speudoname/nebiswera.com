import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthToken } from '@/lib/auth/utils'
import bcrypt from 'bcryptjs'
import type { NextRequest } from 'next/server'
import { profileUpdateSchema, formatZodError } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const token = await getAuthToken(request)

  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: token.email },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      preferredLocale: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest) {
  const token = await getAuthToken(request)

  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validate input with Zod
  const result = profileUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: formatZodError(result.error) },
      { status: 400 }
    )
  }

  const { name, preferredLocale, currentPassword, newPassword } = result.data

  const user = await prisma.user.findUnique({
    where: { email: token.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const updateData: {
    name?: string
    preferredLocale?: string
    password?: string
  } = {}

  // Update name if provided
  if (name !== undefined) {
    updateData.name = name
  }

  // Update preferred locale if provided
  if (preferredLocale) {
    updateData.preferredLocale = preferredLocale
  }

  // Update password if provided
  if (currentPassword && newPassword) {
    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Cannot change password for social login accounts' },
        { status: 400 }
      )
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  const updatedUser = await prisma.user.update({
    where: { email: token.email },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      preferredLocale: true,
      createdAt: true,
    },
  })

  return NextResponse.json(updatedUser)
}

export async function DELETE(request: NextRequest) {
  const token = await getAuthToken(request)

  if (!token?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: token.email },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Delete user and related data
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ])

  return NextResponse.json({ success: true })
}
