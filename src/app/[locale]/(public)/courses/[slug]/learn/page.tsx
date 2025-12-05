import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { seoConfig } from '@/config/seo'
import { CoursePlayer } from './CoursePlayer'
import { parseCourseSettings, parseContentBlocks } from '@/lib/lms/types'
import type { ContentBlock } from '@/lib/lms/types'

interface PageParams {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ part?: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params
  const isKa = locale === 'ka'

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true },
  })

  if (!course) {
    return { title: isKa ? 'კურსი ვერ მოიძებნა' : 'Course not found' }
  }

  return {
    title: `${course.title} | ${isKa ? 'სწავლება' : 'Learn'} | ${isKa ? 'ნებისწერა' : 'Nebiswera'}`,
    robots: { index: false, follow: false }, // Don't index player pages
  }
}

// Type for the course structure we'll pass to the player
interface CourseStructure {
  id: string
  slug: string
  title: string
  settings: ReturnType<typeof parseCourseSettings>
  modules: {
    id: string
    title: string
    order: number
    lessons: {
      id: string
      title: string
      order: number
      parts: {
        id: string
        title: string
        order: number
        contentBlocks: ContentBlock[]
      }[]
    }[]
  }[]
  directLessons: {
    id: string
    title: string
    order: number
    parts: {
      id: string
      title: string
      order: number
      contentBlocks: ContentBlock[]
    }[]
  }[]
}

interface PartProgress {
  partId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  watchTime: number
  watchPercent: number
}

export default async function CourseLearnPage({ params, searchParams }: PageParams) {
  const { locale, slug } = await params
  const { part: requestedPartId } = await searchParams
  const session = await auth()

  // Fetch the course with full structure
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              parts: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
      lessons: {
        where: { moduleId: null },
        orderBy: { order: 'asc' },
        include: {
          parts: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // Check access based on course type
  const settings = parseCourseSettings(course.settings)
  let enrollment = null
  let partProgressMap: Map<string, PartProgress> = new Map()

  if (course.accessType === 'OPEN') {
    // Open courses don't require enrollment - progress is tracked via localStorage
    // We'll handle this in the client component
  } else {
    // FREE or PAID courses require login and enrollment
    if (!session?.user?.id) {
      redirect(`/login?callbackUrl=/${locale}/courses/${slug}/learn`)
    }

    enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
      include: {
        partProgress: true,
      },
    })

    if (!enrollment) {
      // Not enrolled - redirect to course page
      redirect(`/${locale}/courses/${slug}`)
    }

    // Check if enrollment has expired
    if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
      redirect(`/${locale}/courses/${slug}?expired=true`)
    }

    // Check if enrollment is suspended
    if (enrollment.status === 'SUSPENDED') {
      redirect(`/${locale}/courses/${slug}?suspended=true`)
    }

    // Build progress map
    for (const progress of enrollment.partProgress) {
      partProgressMap.set(progress.partId, {
        partId: progress.partId,
        status: progress.status,
        watchTime: progress.watchTime,
        watchPercent: progress.watchPercent,
      })
    }
  }

  // Build course structure for the player
  const courseStructure: CourseStructure = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    settings,
    modules: course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      order: module.order,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        parts: lesson.parts.map((part) => ({
          id: part.id,
          title: part.title,
          order: part.order,
          contentBlocks: parseContentBlocks(part.contentBlocks),
        })),
      })),
    })),
    directLessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      parts: lesson.parts.map((part) => ({
        id: part.id,
        title: part.title,
        order: part.order,
        contentBlocks: parseContentBlocks(part.contentBlocks),
      })),
    })),
  }

  // Get all parts in order for navigation
  const allParts: { id: string; title: string; lessonTitle: string; moduleTitle?: string }[] = []

  for (const module of courseStructure.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        allParts.push({
          id: part.id,
          title: part.title,
          lessonTitle: lesson.title,
          moduleTitle: module.title,
        })
      }
    }
  }

  for (const lesson of courseStructure.directLessons) {
    for (const part of lesson.parts) {
      allParts.push({
        id: part.id,
        title: part.title,
        lessonTitle: lesson.title,
      })
    }
  }

  // Determine which part to show
  let currentPartId = requestedPartId

  // If no part specified, find the first uncompleted part or the first part
  if (!currentPartId && allParts.length > 0) {
    if (enrollment) {
      // Find first incomplete part
      const firstIncompletePart = allParts.find((part) => {
        const progress = partProgressMap.get(part.id)
        return !progress || progress.status !== 'COMPLETED'
      })
      currentPartId = firstIncompletePart?.id || allParts[0].id
    } else {
      currentPartId = allParts[0].id
    }
  }

  // Find the current part data
  let currentPart = null
  let currentLesson = null
  let currentModule = null

  for (const module of courseStructure.modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        if (part.id === currentPartId) {
          currentPart = part
          currentLesson = lesson
          currentModule = module
          break
        }
      }
      if (currentPart) break
    }
    if (currentPart) break
  }

  if (!currentPart) {
    for (const lesson of courseStructure.directLessons) {
      for (const part of lesson.parts) {
        if (part.id === currentPartId) {
          currentPart = part
          currentLesson = lesson
          break
        }
      }
      if (currentPart) break
    }
  }

  // Get navigation info
  const currentIndex = allParts.findIndex((p) => p.id === currentPartId)
  const prevPart = currentIndex > 0 ? allParts[currentIndex - 1] : null
  const nextPart = currentIndex < allParts.length - 1 ? allParts[currentIndex + 1] : null

  return (
    <CoursePlayer
      course={courseStructure}
      allParts={allParts}
      currentPart={currentPart}
      currentLesson={currentLesson}
      currentModule={currentModule}
      prevPart={prevPart}
      nextPart={nextPart}
      enrollment={
        enrollment
          ? {
              id: enrollment.id,
              progressPercent: enrollment.progressPercent,
              status: enrollment.status,
            }
          : null
      }
      partProgress={Object.fromEntries(partProgressMap)}
      locale={locale}
      isOpenCourse={course.accessType === 'OPEN'}
    />
  )
}
