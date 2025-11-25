import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin, getAuthToken } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface ImportContact {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  source?: string
  sourceDetails?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getAuthToken(request)
    const body = await request.json()
    const { contacts, source, sourceDetails, fileName } = body as {
      contacts: ImportContact[]
      source: string
      sourceDetails?: string
      fileName: string
    }

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts to import' },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; email: string; error: string }[],
    }

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      if (!contact.email) {
        results.failed++
        results.errors.push({
          row: i + 1,
          email: '',
          error: 'Email is required',
        })
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contact.email)) {
        results.failed++
        results.errors.push({
          row: i + 1,
          email: contact.email,
          error: 'Invalid email format',
        })
        continue
      }

      try {
        // Check if contact already exists
        const existing = await prisma.contact.findUnique({
          where: { email: contact.email.toLowerCase().trim() },
        })

        if (existing) {
          results.failed++
          results.errors.push({
            row: i + 1,
            email: contact.email,
            error: 'Contact already exists',
          })
          continue
        }

        await prisma.contact.create({
          data: {
            email: contact.email.toLowerCase().trim(),
            firstName: contact.firstName?.trim() || null,
            lastName: contact.lastName?.trim() || null,
            phone: contact.phone?.trim() || null,
            source: contact.source || source || 'import',
            sourceDetails: contact.sourceDetails || sourceDetails || fileName,
            notes: contact.notes?.trim() || null,
          },
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: i + 1,
          email: contact.email,
          error: 'Database error',
        })
      }
    }

    // Log the import
    await prisma.importLog.create({
      data: {
        fileName,
        totalRows: contacts.length,
        successCount: results.success,
        failedCount: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
        importedBy: token?.sub || 'unknown',
      },
    })

    return NextResponse.json({
      success: true,
      results: {
        total: contacts.length,
        imported: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 50), // Limit errors returned
      },
    })
  } catch (error) {
    console.error('Import failed:', error)
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    )
  }
}
