import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, badRequestResponse } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    return notFoundResponse('User not found')
  }

  return NextResponse.json(user)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const body = await request.json()
  const { name, email, role } = body

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    return notFoundResponse('User not found')
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    })
    if (emailTaken) {
      return badRequestResponse('Email is already taken')
    }
  }

  const updateData: { name?: string; email?: string; role?: 'USER' | 'ADMIN' } = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email
  if (role !== undefined && ['USER', 'ADMIN'].includes(role)) {
    updateData.role = role
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(user)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getAuthToken(request)

  if (token?.role !== 'ADMIN') {
    return unauthorizedResponse()
  }

  const { id } = await params

  // Prevent self-deletion
  if (id === token.sub) {
    return badRequestResponse('Cannot delete your own account')
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    return notFoundResponse('User not found')
  }

  // Delete user and related data
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.account.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
}
