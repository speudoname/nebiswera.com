import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { getSettings } from '@/lib/settings'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/test-send - Send test email
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Validate campaign has required content
    if (!campaign.htmlContent || !campaign.textContent) {
      return NextResponse.json(
        { error: 'Campaign content is incomplete' },
        { status: 400 }
      )
    }

    if (!campaign.subject) {
      return NextResponse.json(
        { error: 'Campaign subject is required' },
        { status: 400 }
      )
    }

    // Get settings for marketing server
    const settings = await getSettings()

    if (!settings.marketingServerToken) {
      return NextResponse.json(
        { error: 'Marketing email server not configured' },
        { status: 500 }
      )
    }

    // Replace personalization variables with test values
    const testVariables = {
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      email: email,
    }

    let htmlContent = campaign.htmlContent
    let textContent = campaign.textContent
    let subject = campaign.subject

    // Replace variables in content
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      htmlContent = htmlContent.replace(regex, value)
      textContent = textContent.replace(regex, value)
      subject = subject.replace(regex, value)
    })

    // Add [TEST] prefix to subject
    subject = `[TEST] ${subject}`

    // Send via Postmark broadcast stream
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': settings.marketingServerToken,
      },
      body: JSON.stringify({
        From: `${campaign.fromName} <${campaign.fromEmail}>`,
        To: email,
        Subject: subject,
        HtmlBody: htmlContent,
        TextBody: textContent,
        ReplyTo: campaign.replyTo || undefined,
        MessageStream: 'broadcast',
        TrackOpens: true,
        TrackLinks: 'HtmlAndText',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Postmark test send error:', errorData)
      return NextResponse.json(
        { error: errorData.Message || 'Failed to send test email' },
        { status: response.status }
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      messageId: result.MessageID,
      to: email,
      message: `Test email sent to ${email}`,
    })
  } catch (error) {
    console.error('Failed to send test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
