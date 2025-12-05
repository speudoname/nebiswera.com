import { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Users, Clock, ArrowRight } from 'lucide-react'

// SEO metadata for courses catalog page
const coursesSeo = {
  ka: {
    title: 'კურსები — ონლაინ სწავლება | ნებისწერა',
    description:
      'გაიარეთ ონლაინ კურსები პიროვნული განვითარების, შეგნებული არჩევანის და ცხოვრების ტრანსფორმაციის შესახებ. ისწავლეთ თქვენი ტემპით.',
  },
  en: {
    title: 'Courses — Online Learning | Nebiswera',
    description:
      'Take online courses about personal development, conscious choice, and life transformation. Learn at your own pace.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isKa = locale === 'ka'
  const seo = isKa ? coursesSeo.ka : coursesSeo.en
  const canonicalUrl = `${seoConfig.siteUrl}/${locale}/courses`

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ka: `${seoConfig.siteUrl}/ka/courses`,
        en: `${seoConfig.siteUrl}/en/courses`,
      },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonicalUrl,
      siteName: isKa ? 'ნებისწერა' : 'Nebiswera',
      type: 'website',
      locale: isKa ? 'ka_GE' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  }
}

interface CourseWithStats {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail: string | null
  accessType: 'OPEN' | 'FREE' | 'PAID'
  price: number | null
  currency: string | null
  _count: {
    enrollments: number
  }
  modules: { lessons: { parts: { id: string }[] }[] }[]
  lessons: { parts: { id: string }[] }[]
}

function getPartsCount(course: CourseWithStats): number {
  let count = 0
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      count += lesson.parts.length
    }
  }
  for (const lesson of course.lessons) {
    count += lesson.parts.length
  }
  return count
}

function CourseCard({
  course,
  locale,
  featured,
}: {
  course: CourseWithStats
  locale: string
  featured?: boolean
}) {
  const isKa = locale === 'ka'
  const partsCount = getPartsCount(course)

  const accessLabel = {
    OPEN: isKa ? 'თავისუფალი' : 'Open',
    FREE: isKa ? 'უფასო' : 'Free',
    PAID: course.price
      ? `${course.price} ${course.currency || 'GEL'}`
      : isKa
        ? 'ფასიანი'
        : 'Paid',
  }

  const accessColorClass = {
    OPEN: 'bg-green-100 text-green-700',
    FREE: 'bg-blue-100 text-blue-700',
    PAID: 'bg-primary-100 text-primary-700',
  }

  if (featured) {
    return (
      <Link
        href={`/courses/${course.slug}`}
        className="group block bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
      >
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] md:aspect-auto bg-gray-100">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            {/* Access Badge */}
            <span
              className={`inline-block w-fit px-3 py-1 text-xs font-medium rounded-full mb-4 ${accessColorClass[course.accessType]}`}
            >
              {accessLabel[course.accessType]}
            </span>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
              {course.title}
            </h2>

            {/* Description */}
            {course.description && (
              <p className="text-text-secondary mb-4 line-clamp-3">{course.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {partsCount} {isKa ? 'გაკვეთილი' : 'lessons'}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {course._count.enrollments} {isKa ? 'სტუდენტი' : 'students'}
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 text-primary-600 font-medium group-hover:gap-3 transition-all">
              {isKa ? 'კურსის ნახვა' : 'View course'}
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {/* Access Badge */}
        <span
          className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full ${accessColorClass[course.accessType]}`}
        >
          {accessLabel[course.accessType]}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2 flex-1">
            {course.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {partsCount} {isKa ? 'გაკვ.' : 'lessons'}
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course._count.enrollments}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function CoursesPage() {
  const locale = await getLocale()
  const isKa = locale === 'ka'

  // Fetch published courses for the current locale
  const courses = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      locale: locale,
    },
    orderBy: { publishedAt: 'desc' },
    include: {
      _count: {
        select: { enrollments: true },
      },
      modules: {
        include: {
          lessons: {
            include: {
              parts: {
                select: { id: true },
              },
            },
          },
        },
      },
      lessons: {
        where: { moduleId: null },
        include: {
          parts: {
            select: { id: true },
          },
        },
      },
    },
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            {isKa ? 'ონლაინ კურსები' : 'Online Courses'}
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {isKa
              ? 'ისწავლეთ თქვენი ტემპით, სადაც და როცა გინდათ. გაიარეთ კურსები პიროვნული განვითარებისა და ცხოვრების ტრანსფორმაციის შესახებ.'
              : 'Learn at your own pace, wherever and whenever you want. Take courses on personal development and life transformation.'}
          </p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-neu-base">
        <div className="max-w-6xl mx-auto">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-text-secondary">
                {isKa ? 'კურსები მალე დაემატება...' : 'Courses coming soon...'}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Course (first one) */}
              {courses.length > 0 && (
                <CourseCard
                  course={courses[0] as unknown as CourseWithStats}
                  locale={locale}
                  featured
                />
              )}

              {/* Other Courses Grid */}
              {courses.length > 1 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.slice(1).map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course as unknown as CourseWithStats}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
