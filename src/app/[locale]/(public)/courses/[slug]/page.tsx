import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'
import { auth } from '@/lib/auth/config'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  Lock,
  Play,
  ArrowRight,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Download,
  HelpCircle,
} from 'lucide-react'
import { parseCourseSettings, parseContentBlocks } from '@/lib/lms/types'
import { formatDuration } from '@/lib'
import { EnrollButton } from './EnrollButton'
import { CoursePageTracker } from './CoursePageTracker'

interface PageParams {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params
  const isKa = locale === 'ka'

  const course = await prisma.course.findUnique({
    where: { slug, status: 'PUBLISHED', locale },
    select: { title: true, description: true, thumbnail: true },
  })

  if (!course) {
    return { title: isKa ? 'კურსი ვერ მოიძებნა' : 'Course not found' }
  }

  const canonicalUrl = `${seoConfig.siteUrl}/${locale}/courses/${slug}`

  return {
    title: `${course.title} | ${isKa ? 'ნებისწერა' : 'Nebiswera'}`,
    description: course.description || undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: course.title,
      description: course.description || undefined,
      url: canonicalUrl,
      siteName: isKa ? 'ნებისწერა' : 'Nebiswera',
      type: 'website',
      locale: isKa ? 'ka_GE' : 'en_US',
      images: course.thumbnail ? [{ url: course.thumbnail }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: course.description || undefined,
      images: course.thumbnail ? [course.thumbnail] : undefined,
    },
  }
}

// Generate static params for published courses
export async function generateStaticParams() {
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, locale: true },
  })

  return courses.map((course) => ({
    locale: course.locale,
    slug: course.slug,
  }))
}

// Calculate total duration from content blocks
function calculateCourseDuration(
  modules: { lessons: { parts: { contentBlocks: unknown }[] }[] }[],
  directLessons: { parts: { contentBlocks: unknown }[] }[]
): number {
  let totalSeconds = 0

  const addDuration = (contentBlocks: unknown) => {
    const blocks = parseContentBlocks(contentBlocks)
    for (const block of blocks) {
      if (block.type === 'video' || block.type === 'audio') {
        totalSeconds += block.duration || 0
      }
    }
  }

  for (const module of modules) {
    for (const lesson of module.lessons) {
      for (const part of lesson.parts) {
        addDuration(part.contentBlocks)
      }
    }
  }

  for (const lesson of directLessons) {
    for (const part of lesson.parts) {
      addDuration(part.contentBlocks)
    }
  }

  return totalSeconds
}

// Get icon for content block type
function getContentIcon(type: string) {
  switch (type) {
    case 'video':
      return Video
    case 'audio':
      return Music
    case 'text':
      return FileText
    case 'image':
      return ImageIcon
    case 'file':
      return Download
    case 'quiz':
      return HelpCircle
    default:
      return FileText
  }
}

export default async function CourseLandingPage({ params }: PageParams) {
  const { locale, slug } = await params
  const isKa = locale === 'ka'
  const session = await auth()

  const course = await prisma.course.findUnique({
    where: { slug, status: 'PUBLISHED', locale },
    include: {
      _count: {
        select: { enrollments: true },
      },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              parts: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  contentBlocks: true,
                },
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
            select: {
              id: true,
              title: true,
              contentBlocks: true,
            },
          },
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // Check if user is enrolled
  let enrollment = null
  if (session?.user?.id) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
    })
  }

  const settings = parseCourseSettings(course.settings)
  const totalDuration = calculateCourseDuration(course.modules, course.lessons)

  // Count total parts
  let totalParts = 0
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      totalParts += lesson.parts.length
    }
  }
  for (const lesson of course.lessons) {
    totalParts += lesson.parts.length
  }

  // Build curriculum structure
  const curriculum: {
    title: string
    description?: string | null
    lessons: {
      title: string
      parts: { id: string; title: string; type: string }[]
    }[]
  }[] = []

  // Add modules
  for (const module of course.modules) {
    curriculum.push({
      title: module.title,
      description: module.description,
      lessons: module.lessons.map((lesson) => ({
        title: lesson.title,
        parts: lesson.parts.map((part) => {
          const blocks = parseContentBlocks(part.contentBlocks)
          const mainType = blocks[0]?.type || 'text'
          return { id: part.id, title: part.title, type: mainType }
        }),
      })),
    })
  }

  // Add direct lessons as a virtual module
  if (course.lessons.length > 0) {
    curriculum.push({
      title: isKa ? 'გაკვეთილები' : 'Lessons',
      lessons: course.lessons.map((lesson) => ({
        title: lesson.title,
        parts: lesson.parts.map((part) => {
          const blocks = parseContentBlocks(part.contentBlocks)
          const mainType = blocks[0]?.type || 'text'
          return { id: part.id, title: part.title, type: mainType }
        }),
      })),
    })
  }

  const accessLabel = {
    OPEN: isKa ? 'თავისუფალი წვდომა' : 'Open Access',
    FREE: isKa ? 'უფასო კურსი' : 'Free Course',
    PAID: course.price
      ? `${course.price} ${course.currency || 'GEL'}`
      : isKa
        ? 'ფასიანი კურსი'
        : 'Paid Course',
  }

  return (
    <div className="min-h-screen">
      {/* Pixel Tracking */}
      <CoursePageTracker courseId={course.id} courseTitle={course.title} />

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Content */}
            <div>
              {/* Access Badge */}
              <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-100 text-primary-700 rounded-full mb-4">
                {accessLabel[course.accessType]}
              </span>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-lg text-text-secondary mb-6">{course.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-8">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-500" />
                  <span>
                    {totalParts} {isKa ? 'გაკვეთილი' : 'lessons'}
                  </span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <span>{formatDuration(totalDuration)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  <span>
                    {course._count.enrollments} {isKa ? 'სტუდენტი' : 'students'}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <EnrollButton
                courseId={course.id}
                courseSlug={course.slug}
                courseTitle={course.title}
                accessType={course.accessType}
                price={course.price ? Number(course.price) : null}
                currency={course.currency}
                isEnrolled={!!enrollment}
                enrollmentProgress={enrollment?.progressPercent || 0}
                isLoggedIn={!!session?.user}
                locale={locale}
              />
            </div>

            {/* Thumbnail */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl bg-gray-100">
              {course.thumbnail ? (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-gray-300" />
                </div>
              )}
              {/* Play overlay for video courses */}
              {enrollment && (
                <Link
                  href={`/courses/${course.slug}/learn`}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary-600 ml-1" />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn / Features */}
      <section className="py-12 md:py-16 px-4 sm:px-6 md:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-8 text-center">
            {isKa ? 'რას ისწავლით' : "What You'll Learn"}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Placeholder features - these would ideally come from course metadata */}
            {[
              isKa ? 'პრაქტიკული ცოდნა და უნარები' : 'Practical knowledge and skills',
              isKa ? 'რეალური მაგალითები' : 'Real-world examples',
              isKa ? 'თქვენი ტემპით სწავლება' : 'Learn at your own pace',
              isKa ? 'უვადო წვდომა მასალებზე' : 'Lifetime access to materials',
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-text-secondary">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-12 md:py-16 px-4 sm:px-6 md:px-8 bg-neu-base">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-8 text-center">
            {isKa ? 'კურსის შინაარსი' : 'Course Curriculum'}
          </h2>

          <div className="space-y-4">
            {curriculum.map((module, moduleIndex) => (
              <div key={moduleIndex} className="bg-white rounded-xl shadow overflow-hidden">
                {/* Module Header */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-text-primary">{module.title}</h3>
                  {module.description && (
                    <p className="text-sm text-text-secondary mt-1">{module.description}</p>
                  )}
                </div>

                {/* Lessons */}
                <div className="divide-y divide-gray-100">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="px-6 py-3">
                      <div className="font-medium text-text-primary mb-2">{lesson.title}</div>
                      <div className="space-y-1">
                        {lesson.parts.map((part) => {
                          const Icon = getContentIcon(part.type)
                          return (
                            <div
                              key={part.id}
                              className="flex items-center gap-2 text-sm text-text-secondary pl-4"
                            >
                              <Icon className="w-4 h-4 text-gray-400" />
                              <span>{part.title}</span>
                              {!enrollment && course.accessType !== 'OPEN' && (
                                <Lock className="w-3 h-3 text-gray-300 ml-auto" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 md:py-16 px-4 sm:px-6 md:px-8 bg-primary-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {isKa ? 'მზად ხართ დასაწყებად?' : 'Ready to get started?'}
          </h2>
          <p className="text-primary-100 mb-8">
            {isKa
              ? 'შეუერთდით ჩვენს სტუდენტებს და დაიწყეთ თქვენი მოგზაურობა დღესვე.'
              : 'Join our students and start your journey today.'}
          </p>
          <EnrollButton
            courseId={course.id}
            courseSlug={course.slug}
            courseTitle={course.title}
            accessType={course.accessType}
            price={course.price ? Number(course.price) : null}
            currency={course.currency}
            isEnrolled={!!enrollment}
            enrollmentProgress={enrollment?.progressPercent || 0}
            isLoggedIn={!!session?.user}
            locale={locale}
            variant="light"
          />
        </div>
      </section>
    </div>
  )
}
