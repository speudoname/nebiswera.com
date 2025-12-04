import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse } from '@/lib'
import type { NextRequest } from 'next/server'
import { getRawTemplateContent, type WebinarTemplateKey } from '@content/email-templates/webinar'

interface RouteParams {
  params: Promise<{ key: string }>
}

// GET /api/admin/webinars/templates/[key]?language=ka
// Returns raw template content (with variable placeholders) for editing
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { key } = await params
  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language') || 'ka'

  try {
    const content = getRawTemplateContent(key as WebinarTemplateKey, language)

    return NextResponse.json({
      templateKey: key,
      language,
      subject: content.subject,
      previewText: content.previewText,
      bodyHtml: content.html,
      bodyText: content.text,
    })
  } catch (error) {
    console.error('Failed to get template content:', error)
    return notFoundResponse('Template not found')
  }
}
