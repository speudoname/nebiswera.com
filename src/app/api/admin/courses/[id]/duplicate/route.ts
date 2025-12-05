import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/auth/utils'
import { unauthorizedResponse, successResponse, errorResponse, notFoundResponse, logger } from '@/lib'
import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to generate unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = `${baseSlug}-copy`
  let counter = 1

  while (true) {
    const existing = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-copy-${counter}`
    counter++
  }
}

// POST /api/admin/courses/[id]/duplicate - Duplicate course
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isAdmin(request))) {
    return unauthorizedResponse()
  }

  const { id } = await params

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                parts: true,
              },
            },
          },
        },
        lessons: {
          where: { moduleId: null },
          include: {
            parts: true,
          },
        },
        quizzes: {
          include: {
            questions: true,
          },
        },
        notifications: true,
        prerequisites: true,
      },
    })

    if (!course) {
      return notFoundResponse('Course not found')
    }

    const newSlug = await generateUniqueSlug(course.slug)

    // Create new course with all content
    const newCourse = await prisma.course.create({
      data: {
        title: `${course.title} (Copy)`,
        slug: newSlug,
        description: course.description,
        thumbnail: course.thumbnail,
        locale: course.locale,
        accessType: course.accessType,
        price: course.price,
        currency: course.currency,
        settings: course.settings as object,
        status: 'DRAFT',
        // Create modules with lessons and parts
        modules: {
          create: course.modules.map(module => ({
            title: module.title,
            description: module.description,
            order: module.order,
            availableAfterDays: module.availableAfterDays,
            contentBlocks: module.contentBlocks as object,
            lessons: {
              create: module.lessons.map(lesson => ({
                courseId: '', // Will be set by Prisma
                title: lesson.title,
                description: lesson.description,
                order: lesson.order,
                availableAfterDays: lesson.availableAfterDays,
                contentBlocks: lesson.contentBlocks as object,
                parts: {
                  create: lesson.parts.map(part => ({
                    title: part.title,
                    description: part.description,
                    order: part.order,
                    contentBlocks: part.contentBlocks as object,
                  })),
                },
              })),
            },
          })),
        },
        // Create direct lessons (no module)
        lessons: {
          create: course.lessons.map(lesson => ({
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            availableAfterDays: lesson.availableAfterDays,
            contentBlocks: lesson.contentBlocks as object,
            parts: {
              create: lesson.parts.map(part => ({
                title: part.title,
                description: part.description,
                order: part.order,
                contentBlocks: part.contentBlocks as object,
              })),
            },
          })),
        },
        // Create quizzes with questions
        quizzes: {
          create: course.quizzes.map(quiz => ({
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            maxAttempts: quiz.maxAttempts,
            cooldownMinutes: quiz.cooldownMinutes,
            shuffleQuestions: quiz.shuffleQuestions,
            shuffleOptions: quiz.shuffleOptions,
            showCorrectAnswers: quiz.showCorrectAnswers,
            questions: {
              create: quiz.questions.map(q => ({
                type: q.type,
                question: q.question,
                explanation: q.explanation,
                points: q.points,
                order: q.order,
                options: q.options as object,
                correctAnswer: q.correctAnswer,
              })),
            },
          })),
        },
        // Create notification configs
        notifications: {
          create: course.notifications.map(n => ({
            trigger: n.trigger,
            triggerMinutes: n.triggerMinutes,
            templateKey: n.templateKey,
            conditions: n.conditions as object | undefined,
            channel: n.channel,
            subject: n.subject,
            previewText: n.previewText,
            bodyHtml: n.bodyHtml,
            bodyText: n.bodyText,
            bodyDesign: n.bodyDesign,
            fromName: n.fromName,
            fromEmail: n.fromEmail,
            replyTo: n.replyTo,
            actions: n.actions as object | undefined,
            isActive: n.isActive,
            isDefault: false, // Duplicated notifications are not defaults
            sortOrder: n.sortOrder,
          })),
        },
      },
      include: {
        _count: {
          select: {
            modules: true,
            lessons: true,
            enrollments: true,
          },
        },
      },
    })

    return successResponse(newCourse, 201)
  } catch (error) {
    logger.error('Failed to duplicate course:', error)
    return errorResponse('Failed to duplicate course')
  }
}
