import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'
  const status = searchParams.get('status') || 'all'
  const tagId = searchParams.get('tagId') || ''

  const where: {
    status?: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'
    tags?: { some: { tagId: string } }
  } = {}

  if (status !== 'all') {
    where.status = status as 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'ARCHIVED'
  }

  if (tagId) {
    where.tags = { some: { tagId } }
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })

  if (format === 'json') {
    const jsonData = contacts.map((c) => ({
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      source: c.source,
      sourceDetails: c.sourceDetails,
      status: c.status,
      tags: c.tags.map((t) => t.tag.name),
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    }))

    return new NextResponse(JSON.stringify(jsonData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  }

  // CSV format
  const headers = [
    'email',
    'firstName',
    'lastName',
    'phone',
    'source',
    'sourceDetails',
    'status',
    'tags',
    'notes',
    'createdAt',
  ]

  const rows = contacts.map((c) => [
    c.email,
    c.firstName || '',
    c.lastName || '',
    c.phone || '',
    c.source,
    c.sourceDetails || '',
    c.status,
    c.tags.map((t) => t.tag.name).join('; '),
    (c.notes || '').replace(/"/g, '""'), // Escape quotes
    c.createdAt.toISOString(),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(',')
    ),
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
