import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { getSettings } from '@/lib/settings'
import { logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// POST /api/admin/campaigns/[id]/validate - Validate campaign before sending
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const result = await validateCampaign(campaign)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Failed to validate campaign:', error)
    return NextResponse.json(
      { error: 'Failed to validate campaign' },
      { status: 500 }
    )
  }
}

interface CampaignData {
  subject: string
  htmlContent: string
  textContent: string
  fromName: string
  fromEmail: string
  targetType: string
  targetCriteria: unknown
}

async function validateCampaign(campaign: CampaignData): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check subject
  if (!campaign.subject || campaign.subject.trim().length === 0) {
    errors.push('Subject line is required')
  } else if (campaign.subject.length > 150) {
    warnings.push('Subject line is very long (>150 chars) - may be truncated in some email clients')
  } else if (campaign.subject.length > 78) {
    warnings.push('Subject line is longer than recommended (78 chars)')
  }

  // Check HTML content
  if (!campaign.htmlContent || campaign.htmlContent.trim().length === 0) {
    errors.push('HTML content is required')
  } else {
    // Check for unsubscribe link
    if (!campaign.htmlContent.includes('{{{ pm:unsubscribe }}}') &&
        !campaign.htmlContent.includes('{{pm:unsubscribe}}') &&
        !campaign.htmlContent.includes('{{{pm:unsubscribe}}}')) {
      errors.push('Unsubscribe link is required. Add {{{ pm:unsubscribe }}} to your HTML content.')
    }

    // Check for common HTML issues
    const htmlLower = campaign.htmlContent.toLowerCase()

    // Check for unclosed tags (basic check)
    const openTags = (htmlLower.match(/<[a-z][a-z0-9]*[^>]*>/g) || []).length
    const closeTags = (htmlLower.match(/<\/[a-z][a-z0-9]*>/g) || []).length
    if (Math.abs(openTags - closeTags) > 5) {
      warnings.push('HTML may have unclosed tags - please verify in preview')
    }

    // Check for images without alt text
    const imagesWithoutAlt = campaign.htmlContent.match(/<img(?![^>]*alt=)[^>]*>/gi)
    if (imagesWithoutAlt && imagesWithoutAlt.length > 0) {
      warnings.push(`${imagesWithoutAlt.length} image(s) without alt text - bad for accessibility and spam filters`)
    }
  }

  // Check plain text content
  if (!campaign.textContent || campaign.textContent.trim().length === 0) {
    errors.push('Plain text version is required for email deliverability')
  } else if (campaign.textContent.length < 50) {
    warnings.push('Plain text version is very short - consider adding more content')
  }

  // Check sender info
  if (!campaign.fromName || campaign.fromName.trim().length === 0) {
    errors.push('From name is required')
  }

  if (!campaign.fromEmail || campaign.fromEmail.trim().length === 0) {
    errors.push('From email is required')
  } else {
    // Verify from email is configured in settings
    const settings = await getSettings()
    if (campaign.fromEmail !== settings.marketingFromAddress) {
      warnings.push(`From email "${campaign.fromEmail}" differs from configured marketing sender "${settings.marketingFromAddress}"`)
    }
  }

  // Check targeting
  if (!campaign.targetType) {
    errors.push('Target audience is required')
  } else if (['SEGMENT', 'TAG'].includes(campaign.targetType)) {
    if (!campaign.targetCriteria) {
      errors.push(`Target criteria required for ${campaign.targetType} targeting`)
    }
  }

  // Spam trigger checks
  const spamChecks = checkSpamTriggers(campaign.subject, campaign.htmlContent)
  warnings.push(...spamChecks)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function checkSpamTriggers(subject: string, htmlContent: string): string[] {
  const warnings: string[] = []
  const combinedText = `${subject} ${htmlContent}`.toLowerCase()

  // Check for excessive caps in subject
  const capsCount = (subject.match(/[A-Z]/g) || []).length
  const totalChars = subject.replace(/[^a-zA-Z]/g, '').length
  if (totalChars > 10 && capsCount / totalChars > 0.5) {
    warnings.push('Subject has too many capital letters - may trigger spam filters')
  }

  // Check for excessive exclamation marks
  const exclamationCount = (combinedText.match(/!/g) || []).length
  if (exclamationCount > 3) {
    warnings.push('Too many exclamation marks - may trigger spam filters')
  }

  // Check for common spam words
  const spamWords = [
    'free',
    'winner',
    'congratulations',
    'urgent',
    'act now',
    'limited time',
    'click here',
    'buy now',
    'order now',
    'special offer',
    '100% free',
    'no cost',
    'risk free',
    'guarantee',
  ]

  const foundSpamWords = spamWords.filter(word => combinedText.includes(word))
  if (foundSpamWords.length > 2) {
    warnings.push(`Contains multiple spam trigger words: ${foundSpamWords.slice(0, 3).join(', ')}...`)
  }

  // Check for missing physical address (CAN-SPAM requirement)
  if (!htmlContent.includes('address') && !htmlContent.includes('თბილისი') && !htmlContent.includes('Tbilisi')) {
    warnings.push('Consider adding your physical address (CAN-SPAM compliance)')
  }

  return warnings
}
