import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import { logger, unauthorizedResponse, errorResponse } from '@/lib'

// Default SMS templates to seed
const DEFAULT_TEMPLATES = [
  // Webinar Templates
  {
    slug: 'webinar-registration',
    name: 'Webinar Registration',
    category: 'WEBINAR' as const,
    messageKa: 'მადლობა რეგისტრაციისთვის! "{{webinarTitle}}" - {{date}}, {{time}}. ლინკი: {{link}}',
    messageEn: 'Thanks for registering! "{{webinarTitle}}" - {{date}}, {{time}}. Link: {{link}}',
    description: 'Sent immediately after webinar registration',
  },
  {
    slug: 'webinar-reminder-24h',
    name: 'Webinar 24 Hour Reminder',
    category: 'WEBINAR' as const,
    messageKa: '{{firstName}}, შეხსენება: "{{webinarTitle}}" ხვალ {{time}}-ზე. ლინკი: {{link}}',
    messageEn: '{{firstName}}, reminder: "{{webinarTitle}}" tomorrow at {{time}}. Link: {{link}}',
    description: 'Sent 24 hours before webinar starts',
  },
  {
    slug: 'webinar-reminder-1h',
    name: 'Webinar 1 Hour Reminder',
    category: 'WEBINAR' as const,
    messageKa: '{{firstName}}, "{{webinarTitle}}" იწყება 1 საათში! ლინკი: {{link}}',
    messageEn: '{{firstName}}, "{{webinarTitle}}" starts in 1 hour! Link: {{link}}',
    description: 'Sent 1 hour before webinar starts',
  },
  {
    slug: 'webinar-reminder-15m',
    name: 'Webinar 15 Minute Reminder',
    category: 'WEBINAR' as const,
    messageKa: '{{firstName}}, "{{webinarTitle}}" იწყება 15 წუთში! შემოგვიერთდი: {{link}}',
    messageEn: '{{firstName}}, "{{webinarTitle}}" starts in 15 minutes! Join: {{link}}',
    description: 'Sent 15 minutes before webinar starts',
  },
  {
    slug: 'webinar-started',
    name: 'Webinar Started',
    category: 'WEBINAR' as const,
    messageKa: '{{firstName}}, "{{webinarTitle}}" დაიწყო! შემოდი ახლავე: {{link}}',
    messageEn: '{{firstName}}, "{{webinarTitle}}" has started! Join now: {{link}}',
    description: 'Sent when webinar begins',
  },
  {
    slug: 'webinar-replay',
    name: 'Webinar Replay Available',
    category: 'WEBINAR' as const,
    messageKa: '{{firstName}}, "{{webinarTitle}}" ჩანაწერი ხელმისაწვდომია: {{link}}',
    messageEn: '{{firstName}}, "{{webinarTitle}}" replay is available: {{link}}',
    description: 'Sent when replay becomes available',
  },

  // Course Templates
  {
    slug: 'course-enrollment',
    name: 'Course Enrollment Welcome',
    category: 'COURSE' as const,
    messageKa: 'კეთილი იყოს მობრძანება! "{{courseTitle}}" კურსი დაგელოდებათ: {{link}}',
    messageEn: 'Welcome! Your course "{{courseTitle}}" awaits: {{link}}',
    description: 'Sent when user enrolls in a course',
  },
  {
    slug: 'course-completed',
    name: 'Course Completion',
    category: 'COURSE' as const,
    messageKa: 'გილოცავთ, {{firstName}}! თქვენ წარმატებით დაასრულეთ "{{courseTitle}}"!',
    messageEn: 'Congratulations {{firstName}}! You completed "{{courseTitle}}"!',
    description: 'Sent when user completes a course',
  },
  {
    slug: 'course-certificate',
    name: 'Certificate Ready',
    category: 'COURSE' as const,
    messageKa: '{{firstName}}, თქვენი სერტიფიკატი მზადაა! ჩამოტვირთეთ: {{link}}',
    messageEn: '{{firstName}}, your certificate is ready! Download: {{link}}',
    description: 'Sent when certificate is generated',
  },
  {
    slug: 'course-inactive',
    name: 'Course Inactivity Reminder',
    category: 'COURSE' as const,
    messageKa: '{{firstName}}, გაგვენატრე! გააგრძელე "{{courseTitle}}" აქ: {{link}}',
    messageEn: '{{firstName}}, we miss you! Continue "{{courseTitle}}" here: {{link}}',
    description: 'Sent after inactivity period',
  },

  // Auth Templates
  {
    slug: 'auth-password-reset',
    name: 'Password Reset Code',
    category: 'AUTH' as const,
    messageKa: 'თქვენი პაროლის აღდგენის კოდი: {{code}}. ვადა: 10 წუთი.',
    messageEn: 'Your password reset code: {{code}}. Valid for 10 minutes.',
    description: 'Sent for password reset verification',
  },
  {
    slug: 'auth-verification',
    name: 'Email Verification Code',
    category: 'AUTH' as const,
    messageKa: 'თქვენი ვერიფიკაციის კოდი: {{code}}. ვადა: 30 წუთი.',
    messageEn: 'Your verification code: {{code}}. Valid for 30 minutes.',
    description: 'Sent for email/phone verification',
  },
]

/**
 * POST /api/admin/sms/templates/seed
 * Seed default SMS templates
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return unauthorizedResponse()
    }

    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    }

    for (const template of DEFAULT_TEMPLATES) {
      try {
        // Check if template already exists
        const existing = await prisma.smsTemplate.findUnique({
          where: { slug: template.slug },
        })

        if (existing) {
          results.skipped.push(template.slug)
          continue
        }

        // Create the template
        await prisma.smsTemplate.create({
          data: {
            ...template,
            isDefault: true,
            isActive: true,
          },
        })

        results.created.push(template.slug)
      } catch (err) {
        logger.error(`Error seeding template ${template.slug}:`, err)
        results.errors.push(template.slug)
      }
    }

    logger.info('SMS templates seeded:', results)

    return NextResponse.json({
      message: 'Default SMS templates seeded',
      results,
      totalDefaults: DEFAULT_TEMPLATES.length,
    })
  } catch (error) {
    logger.error('Error seeding SMS templates:', error)
    return errorResponse('Failed to seed SMS templates')
  }
}
