import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/admin/webinars/[id]/chat/simulated/import
 * Import simulated chat messages from CSV
 *
 * CSV Format:
 * time,senderName,message,isFromModerator
 * 60,John Doe,This is amazing!,false
 * 120,Jane Smith,Great content,false
 * 180,Moderator,Thanks everyone!,true
 *
 * Time is in seconds from video start
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: webinarId } = await params

  try {
    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({
      where: { id: webinarId },
      select: { id: true },
    })

    if (!webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const body = await request.json()
    const { csvContent, replaceExisting } = body

    if (!csvContent) {
      return NextResponse.json(
        { error: 'Missing csvContent field' },
        { status: 400 }
      )
    }

    // Parse CSV
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have at least a header row and one data row' },
        { status: 400 }
      )
    }

    // Validate header (case-insensitive)
    const header = lines[0].toLowerCase().split(',').map((h: string) => h.trim())
    const timeIndex = header.indexOf('time')
    const senderNameIndex = header.indexOf('sendername')
    const messageIndex = header.indexOf('message')
    const isModeratorIndex = header.indexOf('isfrommoderator')

    if (timeIndex === -1 || senderNameIndex === -1 || messageIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must have columns: time, senderName, message (optional: isFromModerator)' },
        { status: 400 }
      )
    }

    // Parse data rows
    const messages: Array<{
      senderName: string
      message: string
      appearsAt: number
      isFromModerator: boolean
    }> = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines

      const cols = line.split(',').map((c: string) => c.trim())

      const time = parseInt(cols[timeIndex])
      const senderName = cols[senderNameIndex]
      const message = cols[messageIndex]
      const isFromModerator = isModeratorIndex !== -1
        ? cols[isModeratorIndex]?.toLowerCase() === 'true'
        : false

      // Validate
      if (isNaN(time) || !senderName || !message) {
        return NextResponse.json(
          { error: `Invalid data at row ${i + 1}: time must be a number, senderName and message are required` },
          { status: 400 }
        )
      }

      messages.push({
        senderName,
        message,
        appearsAt: time,
        isFromModerator,
      })
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No valid messages found in CSV' },
        { status: 400 }
      )
    }

    // Delete existing simulated messages if replaceExisting is true
    if (replaceExisting) {
      await prisma.webinarChatMessage.deleteMany({
        where: {
          webinarId,
          isSimulated: true,
        },
      })
    }

    // Create all messages
    const created = await prisma.webinarChatMessage.createMany({
      data: messages.map((m) => ({
        webinarId,
        senderName: m.senderName,
        message: m.message,
        appearsAt: m.appearsAt,
        isSimulated: true,
        isFromModerator: m.isFromModerator,
      })),
    })

    return NextResponse.json({
      success: true,
      imported: created.count,
      messages: `Successfully imported ${created.count} simulated chat messages`,
    })
  } catch (error) {
    console.error('Failed to import simulated messages:', error)
    return NextResponse.json(
      { error: 'Failed to import simulated messages' },
      { status: 500 }
    )
  }
}
