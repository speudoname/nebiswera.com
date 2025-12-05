import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, notFoundResponse, errorResponse } from '@/lib'
import type { NextRequest } from 'next/server'
import {
  getCourseTemplate,
  getTemplateMetadata,
  isValidTemplateKey,
  type CourseTemplateKey,
} from '@content/email-templates/courses'

interface RouteParams {
  params: Promise<{ id: string; templateKey: string }>
}

// GET /api/admin/courses/[id]/notifications/templates/[templateKey]
// Returns template content for preview/editing
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { templateKey } = await params
  const { searchParams } = new URL(request.url)
  const locale = (searchParams.get('locale') as 'en' | 'ka') || 'en'

  try {
    // Validate template key
    if (!isValidTemplateKey(templateKey)) {
      return notFoundResponse('Invalid template key')
    }

    // Get template metadata
    const metadata = getTemplateMetadata(templateKey as CourseTemplateKey)
    if (!metadata) {
      return notFoundResponse('Template metadata not found')
    }

    // Get template content with placeholder variables
    const placeholderVars = {
      firstName: '{{firstName}}',
      fullName: '{{fullName}}',
      email: '{{email}}',
      courseTitle: '{{courseTitle}}',
      courseUrl: '{{courseUrl}}',
      continueUrl: '{{continueUrl}}',
      progressPercent: 50,
      lessonsCompleted: 5,
      totalLessons: 10,
      timeSpent: '{{timeSpent}}',
      enrolledDate: '{{enrolledDate}}',
      expiresDate: '{{expiresDate}}',
      daysUntilExpiry: 7,
      quizTitle: '{{quizTitle}}',
      quizScore: 85,
      passingScore: 70,
      attemptsRemaining: 2,
      certificateUrl: '{{certificateUrl}}',
      certificateId: '{{certificateId}}',
      lastActivityDate: '{{lastActivityDate}}',
      daysInactive: 7,
      currentLesson: '{{currentLesson}}',
      unsubscribeUrl: '{{unsubscribeUrl}}',
    }

    const template = getCourseTemplate(templateKey as CourseTemplateKey, locale, placeholderVars)

    return NextResponse.json({
      templateKey,
      name: metadata.name,
      description: metadata.description,
      trigger: metadata.trigger,
      triggerMinutes: metadata.triggerMinutes,
      variables: metadata.variables,
      locale,
      subject: template.subject,
      previewText: template.previewText,
      bodyHtml: template.html,
      bodyText: template.text,
    })
  } catch (error) {
    console.error('Failed to fetch template:', error)
    return errorResponse('Failed to fetch template')
  }
}
