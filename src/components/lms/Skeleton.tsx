'use client'

/**
 * LMS Skeleton Components
 *
 * Skeleton loaders for various LMS components
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Thumbnail */}
      <Skeleton className="h-40 w-full rounded-none" />

      <div className="p-4 space-y-3">
        {/* Badge */}
        <Skeleton className="h-5 w-16 rounded-full" />

        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Button */}
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  )
}

export function CoursePlayerSkeleton() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar skeleton */}
      <div className="hidden md:flex md:w-80 flex-col bg-white border-r">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="pl-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Video placeholder */}
            <Skeleton className="aspect-video w-full rounded-lg" />

            {/* Text content */}
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white border-t p-4 flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

export function QuizSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      {/* Quiz header */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Question */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />

        {/* Options */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}

export function ProgressCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 rounded-lg bg-gray-50">
      {/* Thumbnail */}
      <Skeleton className="w-20 h-12 rounded-md flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      {/* Button */}
      <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
    </div>
  )
}

export function CertificateCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  )
}

export function SidebarItemSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="pl-6 space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}
