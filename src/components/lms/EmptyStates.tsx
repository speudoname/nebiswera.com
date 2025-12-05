'use client'

/**
 * LMS Empty State Components
 *
 * Displayed when there's no data to show
 */

import Link from 'next/link'
import { BookOpen, Award, GraduationCap, Search, FileQuestion } from 'lucide-react'

interface EmptyStateProps {
  locale?: string
}

/**
 * No courses enrolled
 */
export function NoCoursesEnrolled({ locale = 'en' }: EmptyStateProps) {
  const isKa = locale === 'ka'

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isKa ? 'კურსები ჯერ არ გაქვთ' : 'No courses yet'}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {isKa
          ? 'გამოიკვლიეთ ჩვენი კურსები და დაიწყეთ სწავლა დღესვე.'
          : 'Explore our courses and start learning today.'}
      </p>
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Search className="w-4 h-4" />
        {isKa ? 'კურსების ნახვა' : 'Browse Courses'}
      </Link>
    </div>
  )
}

/**
 * No certificates earned
 */
export function NoCertificates({ locale = 'en' }: EmptyStateProps) {
  const isKa = locale === 'ka'

  return (
    <div className="text-center py-8 px-4">
      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-yellow-100 flex items-center justify-center">
        <Award className="w-7 h-7 text-yellow-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {isKa ? 'სერტიფიკატები ჯერ არ გაქვთ' : 'No certificates yet'}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">
        {isKa
          ? 'დაასრულეთ კურსი სერტიფიკატის მისაღებად.'
          : 'Complete a course to earn your certificate.'}
      </p>
    </div>
  )
}

/**
 * No courses available (catalog)
 */
export function NoCoursesAvailable({ locale = 'en' }: EmptyStateProps) {
  const isKa = locale === 'ka'

  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
        <GraduationCap className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {isKa ? 'კურსები მალე დაემატება' : 'Courses coming soon'}
      </h2>
      <p className="text-gray-500 max-w-md mx-auto">
        {isKa
          ? 'ჩვენ მუშაობთ საინტერესო კურსებზე. მალე გამოჩნდება!'
          : "We're working on exciting courses. Check back soon!"}
      </p>
    </div>
  )
}

/**
 * No search results
 */
export function NoSearchResults({ locale = 'en', query }: EmptyStateProps & { query?: string }) {
  const isKa = locale === 'ka'

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isKa ? 'შედეგები ვერ მოიძებნა' : 'No results found'}
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        {query
          ? isKa
            ? `"${query}" - ის მიხედვით ვერაფერი მოიძებნა.`
            : `No results found for "${query}".`
          : isKa
            ? 'სცადეთ სხვა საძიებო სიტყვები.'
            : 'Try different search terms.'}
      </p>
    </div>
  )
}

/**
 * Content not found
 */
export function ContentNotFound({ locale = 'en' }: EmptyStateProps) {
  const isKa = locale === 'ka'

  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
        <FileQuestion className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {isKa ? 'კონტენტი ვერ მოიძებნა' : 'Content not found'}
      </h2>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {isKa
          ? 'მოთხოვნილი კონტენტი არ არსებობს ან წაიშალა.'
          : "The content you're looking for doesn't exist or has been removed."}
      </p>
      <Link
        href={`/${locale}/courses`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        {isKa ? 'კურსებზე დაბრუნება' : 'Back to Courses'}
      </Link>
    </div>
  )
}

/**
 * Quiz not available
 */
export function QuizNotAvailable({ locale = 'en', reason }: EmptyStateProps & { reason?: string }) {
  const isKa = locale === 'ka'

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-100 flex items-center justify-center">
        <FileQuestion className="w-6 h-6 text-yellow-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {isKa ? 'ტესტი მიუწვდომელია' : 'Quiz unavailable'}
      </h3>
      <p className="text-sm text-gray-600">
        {reason ||
          (isKa
            ? 'ეს ტესტი ამჟამად მიუწვდომელია.'
            : 'This quiz is currently unavailable.')}
      </p>
    </div>
  )
}

/**
 * Course locked
 */
export function CourseLocked({ locale = 'en' }: EmptyStateProps) {
  const isKa = locale === 'ka'

  return (
    <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isKa ? 'კონტენტი დაბლოკილია' : 'Content locked'}
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        {isKa
          ? 'ამ კონტენტზე წვდომისთვის გაიარეთ წინა გაკვეთილები.'
          : 'Complete previous lessons to unlock this content.'}
      </p>
    </div>
  )
}
