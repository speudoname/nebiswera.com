import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { getSettings } from '@/lib/settings'
import { isValidEmail, unauthorizedResponse, notFoundResponse, badRequestResponse, successResponse, errorResponse, logger } from '@/lib'
import { EmailType, EmailCategory } from '@prisma/client'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/campaigns/[id]/test-send - Send test email
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return badRequestResponse('Test email address is required')
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return badRequestResponse('Invalid email address format')
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return notFoundResponse('Campaign not found')
    }

    // Validate campaign has required content
    if (!campaign.htmlContent || !campaign.textContent) {
      return badRequestResponse('Campaign content is incomplete')
    }

    if (!campaign.subject) {
      return badRequestResponse('Campaign subject is required')
    }

    // Get settings for marketing server
    const settings = await getSettings()

    if (!settings.marketingServerToken) {
      return errorResponse('Marketing email server not configured')
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

    // Send via Postmark marketing stream
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
        MessageStream: settings.marketingStreamName || 'broadcast',
        TrackOpens: true,
        TrackLinks: 'HtmlAndText',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Postmark test send error:', errorData)
      return errorResponse(errorData.Message || 'Failed to send test email', response.status)
    }

    const result = await response.json()

    // Log the test email
    await prisma.emailLog.create({
      data: {
        messageId: result.MessageID,
        to: email,
        subject: subject,
        type: EmailType.CAMPAIGN,
        category: EmailCategory.MARKETING,
        metadata: {
          campaignId: campaign.id,
          isTest: true,
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail,
        },
      },
    })

    return successResponse({
      success: true,
      messageId: result.MessageID,
      to: email,
      message: `Test email sent to ${email}`,
    })
  } catch (error) {
    logger.error('Failed to send test email:', error)
    return errorResponse('Failed to send test email')
  }
}
