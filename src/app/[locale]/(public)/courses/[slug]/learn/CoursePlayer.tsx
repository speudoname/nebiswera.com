'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  PlayCircle,
  Lock,
  BookOpen,
  Home,
  User,
  XCircle,
} from 'lucide-react'
import { ContentRenderer } from './ContentRenderer'
import { useCoursePixelTracking } from './useCoursePixelTracking'
import type { ContentBlock, CourseSettings } from '@/lib/lms/types'
import {
  getAnonymousId,
  getCourseProgress,
  initializeCourseProgress,
  markPartCompleteLocal,
  unmarkPartCompleteLocal,
  updateVideoProgressLocal,
  calculateCourseProgressLocal,
} from '@/lib/lms/local-storage'

interface CourseStructure {
  id: string
  slug: string
  title: string
  settings: CourseSettings
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

interface PartInfo {
  id: string
  title: string
  lessonTitle: string
  moduleTitle?: string
}

interface PartProgress {
  partId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  watchTime: number
  watchPercent: number
}

interface CoursePlayerProps {
  course: CourseStructure
  allParts: PartInfo[]
  currentPart: {
    id: string
    title: string
    order: number
    contentBlocks: ContentBlock[]
  } | null
  currentLesson: { id: string; title: string } | null
  currentModule: { id: string; title: string } | null
  prevPart: PartInfo | null
  nextPart: PartInfo | null
  enrollment: {
    id: string
    progressPercent: number
    status: string
  } | null
  partProgress: Record<string, PartProgress>
  locale: string
  isOpenCourse: boolean
}

export function CoursePlayer({
  course,
  allParts,
  currentPart,
  currentLesson,
  currentModule,
  prevPart,
  nextPart,
  enrollment,
  partProgress,
  locale,
  isOpenCourse,
}: CoursePlayerProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [localProgress, setLocalProgress] = useState<Record<string, PartProgress>>(partProgress)
  const [localProgressPercent, setLocalProgressPercent] = useState(enrollment?.progressPercent ?? 0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isUncompleting, setIsUncompleting] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [anonymousId, setAnonymousId] = useState<string | null>(null)
  const isKa = locale === 'ka'

  // Facebook Pixel tracking
  const { trackLessonCompleted, trackQuizCompleted } = useCoursePixelTracking({
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    currentPartId: currentPart?.id || null,
    currentPartTitle: currentPart?.title || null,
    currentLessonTitle: currentLesson?.title || null,
    progressPercent: localProgressPercent,
  })

  // Calculate progress from local state (for optimistic updates)
  const calculateLocalProgress = (progressMap: Record<string, PartProgress>) => {
    const completedCount = Object.values(progressMap).filter(
      (p) => p.status === 'COMPLETED'
    ).length
    return allParts.length > 0 ? Math.round((completedCount / allParts.length) * 100) : 0
  }

  // Initialize progress for enrolled courses from partProgress prop
  useEffect(() => {
    if (!isOpenCourse && partProgress) {
      // Set local progress from server data
      setLocalProgress(partProgress)
      // Calculate and set progress percent
      const percent = calculateLocalProgress(partProgress)
      setLocalProgressPercent(percent)
    }
  }, []) // Only run on mount - eslint-disable-line react-hooks/exhaustive-deps

  // Load local storage progress for open courses
  useEffect(() => {
    if (isOpenCourse) {
      // Get or create anonymous ID
      const anonId = getAnonymousId()
      setAnonymousId(anonId)

      // Initialize course progress
      initializeCourseProgress(course.id)

      // Load existing progress
      const courseProgress = getCourseProgress(course.id)
      if (courseProgress) {
        // Convert localStorage format to component format
        const convertedProgress: Record<string, PartProgress> = {}
        for (const [partId, progress] of Object.entries(courseProgress.parts)) {
          convertedProgress[partId] = {
            partId,
            status: progress.status === 'completed' ? 'COMPLETED' :
                   progress.status === 'in_progress' ? 'IN_PROGRESS' : 'NOT_STARTED',
            watchTime: progress.watchTime,
            watchPercent: progress.watchPercent,
          }
        }
        setLocalProgress(convertedProgress)

        // Calculate progress percentage
        const percent = calculateCourseProgressLocal(course.id, allParts.length)
        setLocalProgressPercent(percent)
      }

      // Show save progress prompt after some engagement
      const hasProgress = Object.keys(courseProgress?.parts || {}).length > 0
      if (hasProgress) {
        // Show prompt after 30 seconds if user has progress
        const timer = setTimeout(() => setShowSavePrompt(true), 30000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOpenCourse, course.id, allParts.length])

  // Update localStorage and recalculate progress for open courses
  const updateLocalStorage = (partId: string, status: 'completed' | 'in_progress', watchTime: number = 0, watchPercent: number = 0) => {
    if (!isOpenCourse) return

    if (status === 'completed') {
      markPartCompleteLocal(course.id, partId)
    } else {
      updateVideoProgressLocal(course.id, partId, watchTime, watchPercent, course.settings.videoCompletionThreshold)
    }

    // Recalculate and update local state
    const courseProgress = getCourseProgress(course.id)
    if (courseProgress) {
      const convertedProgress: Record<string, PartProgress> = {}
      for (const [pId, progress] of Object.entries(courseProgress.parts)) {
        convertedProgress[pId] = {
          partId: pId,
          status: progress.status === 'completed' ? 'COMPLETED' :
                 progress.status === 'in_progress' ? 'IN_PROGRESS' : 'NOT_STARTED',
          watchTime: progress.watchTime,
          watchPercent: progress.watchPercent,
        }
      }
      setLocalProgress(convertedProgress)

      const percent = calculateCourseProgressLocal(course.id, allParts.length)
      setLocalProgressPercent(percent)
    }
  }

  // Check if part is completed
  const isPartCompleted = (partId: string) => {
    return localProgress[partId]?.status === 'COMPLETED'
  }

  // Check if part is locked (sequential lock)
  const isPartLocked = (partId: string) => {
    if (!course.settings.sequentialLock) return false

    const partIndex = allParts.findIndex((p) => p.id === partId)
    if (partIndex === 0) return false

    const prevPartId = allParts[partIndex - 1].id
    return !isPartCompleted(prevPartId)
  }

  // Mark part as complete with optimistic update
  const markPartComplete = async () => {
    if (!currentPart || isCompleting) return

    setIsCompleting(true)

    // Optimistic update - update local state immediately
    const newProgress: PartProgress = {
      partId: currentPart.id,
      status: 'COMPLETED',
      watchTime: 0,
      watchPercent: 100,
    }

    const updatedProgress = {
      ...localProgress,
      [currentPart.id]: newProgress,
    }
    setLocalProgress(updatedProgress)

    // Update progress bar immediately (optimistic)
    const newPercent = calculateLocalProgress(updatedProgress)
    setLocalProgressPercent(newPercent)

    // For open courses, save to localStorage
    if (isOpenCourse) {
      updateLocalStorage(currentPart.id, 'completed')
    }

    // For enrolled courses, save to server
    if (enrollment) {
      try {
        const response = await fetch(`/api/courses/${course.slug}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId: currentPart.id,
            lessonId: currentLesson?.id,
            lessonTitle: currentLesson?.title,
            action: 'complete',
          }),
        })

        if (!response.ok) {
          // Revert on error
          setLocalProgress(localProgress)
          setLocalProgressPercent(calculateLocalProgress(localProgress))
          console.error('Failed to save progress')
        }
        // Success - no need to refresh, we already updated optimistically
      } catch (error) {
        // Revert on error
        setLocalProgress(localProgress)
        setLocalProgressPercent(calculateLocalProgress(localProgress))
        console.error('Failed to save progress:', error)
      }
    }

    setIsCompleting(false)

    // Track lesson completion for pixel
    trackLessonCompleted(currentPart.id, currentPart.title)

    // Auto-advance to next part if available
    if (nextPart && !isPartLocked(nextPart.id)) {
      router.push(`/courses/${course.slug}/learn?part=${nextPart.id}`)
    }
  }

  // Unmark part as complete (uncomplete) with optimistic update
  const unmarkPartComplete = async () => {
    if (!currentPart || isUncompleting) return

    setIsUncompleting(true)

    // Store current state for potential rollback
    const previousProgress = { ...localProgress }
    const previousPercent = localProgressPercent

    // Optimistic update - remove completion immediately
    const updatedProgress = { ...localProgress }
    delete updatedProgress[currentPart.id]
    setLocalProgress(updatedProgress)

    // Update progress bar immediately
    const newPercent = calculateLocalProgress(updatedProgress)
    setLocalProgressPercent(newPercent)

    // For open courses, save to localStorage
    if (isOpenCourse) {
      unmarkPartCompleteLocal(course.id, currentPart.id)
    }

    // For enrolled courses, save to server
    if (enrollment) {
      try {
        const response = await fetch(`/api/courses/${course.slug}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partId: currentPart.id,
            action: 'uncomplete',
          }),
        })

        if (!response.ok) {
          // Revert on error
          setLocalProgress(previousProgress)
          setLocalProgressPercent(previousPercent)
          console.error('Failed to uncomplete part')
        }
      } catch (error) {
        // Revert on error
        setLocalProgress(previousProgress)
        setLocalProgressPercent(previousPercent)
        console.error('Failed to uncomplete part:', error)
      }
    }

    setIsUncompleting(false)
  }

  // Handle video progress update with optimistic updates
  const handleVideoProgress = async (
    partId: string,
    watchTime: number,
    duration: number,
    watchPercent: number
  ) => {
    const isComplete = watchPercent >= course.settings.videoCompletionThreshold
    const newProgress: PartProgress = {
      partId,
      status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
      watchTime,
      watchPercent,
    }

    const updatedProgress = {
      ...localProgress,
      [partId]: newProgress,
    }
    setLocalProgress(updatedProgress)

    // Update progress bar immediately (optimistic)
    const newPercent = calculateLocalProgress(updatedProgress)
    setLocalProgressPercent(newPercent)

    // For open courses, save to localStorage
    if (isOpenCourse) {
      updateLocalStorage(partId, isComplete ? 'completed' : 'in_progress', watchTime, watchPercent)
    }

    // For enrolled courses, save to server (no need to await for optimistic UX)
    if (enrollment) {
      fetch(`/api/courses/${course.slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          lessonId: currentLesson?.id,
          watchTime,
          duration,
          watchPercent,
        }),
      }).catch((error) => {
        console.error('Failed to save video progress:', error)
      })
    }
  }

  // Use local progress percent for immediate updates (optimistic)
  // This will be the server value initially, then updated optimistically
  const progress = localProgressPercent

  // Dismiss save progress prompt
  const dismissSavePrompt = () => {
    setShowSavePrompt(false)
    // Don't show again for this session
    sessionStorage.setItem(`save_prompt_dismissed_${course.id}`, 'true')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Save Progress Prompt for Open Courses */}
      {isOpenCourse && showSavePrompt && !enrollment && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-xl shadow-lg border p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-text-primary mb-1">
                {isKa ? 'შეინახე პროგრესი' : 'Save your progress'}
              </h4>
              <p className="text-sm text-text-secondary mb-3">
                {isKa
                  ? 'შექმენი ანგარიში რომ შეინახო პროგრესი და გააგრძელო ნებისმიერი მოწყობილობიდან.'
                  : 'Create an account to save your progress and continue from any device.'}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/register?callbackUrl=/${locale}/courses/${course.slug}/learn`}
                  className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                >
                  {isKa ? 'რეგისტრაცია' : 'Sign up'}
                </Link>
                <button
                  onClick={dismissSavePrompt}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
                >
                  {isKa ? 'მოგვიანებით' : 'Later'}
                </button>
              </div>
            </div>
            <button
              onClick={dismissSavePrompt}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left - Menu & Course Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
              <span className="text-sm font-medium">{isKa ? 'შინაარსი' : 'Contents'}</span>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-medium text-text-primary truncate max-w-[200px] md:max-w-[300px]">
                {course.title}
              </h1>
            </div>
          </div>

          {/* Center - Progress */}
          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary">{progress}%</span>
          </div>

          {/* Right - Home Link */}
          <Link
            href={`/courses/${course.slug}`}
            className="p-2 hover:bg-gray-100 rounded-lg text-text-secondary"
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white border-r transform transition-transform
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            top-14 lg:top-0
          `}
        >
          <div className="h-full overflow-y-auto p-4">
            {/* Course Title (mobile) */}
            <div className="lg:hidden mb-4 pb-4 border-b">
              <h2 className="font-semibold text-text-primary">{course.title}</h2>
            </div>

            {/* Modules & Lessons */}
            <nav className="space-y-4">
              {course.modules.map((module) => (
                <div key={module.id}>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
                    {module.title}
                  </h3>
                  <div className="space-y-1">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id}>
                        <div className="text-sm font-medium text-text-primary px-2 py-1">
                          {lesson.title}
                        </div>
                        <div className="ml-2 space-y-0.5">
                          {lesson.parts.map((part) => {
                            const isActive = currentPart?.id === part.id
                            const isCompleted = isPartCompleted(part.id)
                            const isLocked = isPartLocked(part.id)

                            return (
                              <button
                                key={part.id}
                                onClick={() => {
                                  if (!isLocked) {
                                    router.push(`/courses/${course.slug}/learn?part=${part.id}`)
                                    setSidebarOpen(false)
                                  }
                                }}
                                disabled={isLocked}
                                className={`
                                  w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm
                                  ${isActive ? 'bg-primary-50 text-primary-700' : ''}
                                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                                `}
                              >
                                {isLocked ? (
                                  <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : isActive ? (
                                  <PlayCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                )}
                                <span className="truncate">{part.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Direct Lessons */}
              {course.directLessons.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2">
                    {isKa ? 'გაკვეთილები' : 'Lessons'}
                  </h3>
                  <div className="space-y-1">
                    {course.directLessons.map((lesson) => (
                      <div key={lesson.id}>
                        <div className="text-sm font-medium text-text-primary px-2 py-1">
                          {lesson.title}
                        </div>
                        <div className="ml-2 space-y-0.5">
                          {lesson.parts.map((part) => {
                            const isActive = currentPart?.id === part.id
                            const isCompleted = isPartCompleted(part.id)
                            const isLocked = isPartLocked(part.id)

                            return (
                              <button
                                key={part.id}
                                onClick={() => {
                                  if (!isLocked) {
                                    router.push(`/courses/${course.slug}/learn?part=${part.id}`)
                                    setSidebarOpen(false)
                                  }
                                }}
                                disabled={isLocked}
                                className={`
                                  w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm
                                  ${isActive ? 'bg-primary-50 text-primary-700' : ''}
                                  ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                                `}
                              >
                                {isLocked ? (
                                  <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                ) : isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : isActive ? (
                                  <PlayCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                )}
                                <span className="truncate">{part.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {currentPart ? (
            <div className="max-w-4xl mx-auto px-4 py-8">
              {/* Breadcrumb */}
              <div className="text-sm text-text-secondary mb-4">
                {currentModule && <span>{currentModule.title} / </span>}
                {currentLesson && <span>{currentLesson.title}</span>}
              </div>

              {/* Part Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
                {currentPart.title}
              </h1>

              {/* Content Blocks */}
              <div className="space-y-6 mb-8">
                {currentPart.contentBlocks.map((block, index) => (
                  <ContentRenderer
                    key={block.id || index}
                    block={block}
                    courseSlug={course.slug}
                    partId={currentPart.id}
                    locale={locale}
                    onVideoProgress={(watchTime, duration, percent) =>
                      handleVideoProgress(currentPart.id, watchTime, duration, percent)
                    }
                    onQuizComplete={(passed) => {
                      if (passed) {
                        // Refresh to update progress
                        router.refresh()
                      }
                    }}
                    onQuizPixelTrack={trackQuizCompleted}
                  />
                ))}
              </div>

              {/* Mark Complete / Uncomplete Toggle Button */}
              <div className="flex justify-center mb-8">
                {isPartCompleted(currentPart.id) ? (
                  <button
                    onClick={unmarkPartComplete}
                    disabled={isUncompleting}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 border border-gray-300"
                  >
                    <XCircle className="w-5 h-5" />
                    {isUncompleting
                      ? isKa
                        ? 'ამოშლა...'
                        : 'Removing...'
                      : isKa
                        ? 'დასრულების მონიშვნის მოხსნა'
                        : 'Mark as Incomplete'}
                  </button>
                ) : (
                  <button
                    onClick={markPartComplete}
                    disabled={isCompleting}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isCompleting
                      ? isKa
                        ? 'მონიშვნა...'
                        : 'Marking...'
                      : isKa
                        ? 'მონიშვნა დასრულებულად'
                        : 'Mark as Complete'}
                  </button>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t">
                {prevPart ? (
                  <Link
                    href={`/courses/${course.slug}/learn?part=${prevPart.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-xs">{isKa ? 'წინა' : 'Previous'}</div>
                      <div className="text-sm font-medium truncate max-w-[150px]">
                        {prevPart.title}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}

                {nextPart ? (
                  <Link
                    href={
                      isPartLocked(nextPart.id)
                        ? '#'
                        : `/courses/${course.slug}/learn?part=${nextPart.id}`
                    }
                    className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                      isPartLocked(nextPart.id)
                        ? 'opacity-50 cursor-not-allowed text-text-secondary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    onClick={(e) => isPartLocked(nextPart.id) && e.preventDefault()}
                  >
                    <div className="text-right">
                      <div className="text-xs">{isKa ? 'შემდეგი' : 'Next'}</div>
                      <div className="text-sm font-medium truncate max-w-[150px]">
                        {nextPart.title}
                      </div>
                    </div>
                    {isPartLocked(nextPart.id) ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </Link>
                ) : (
                  <div className="text-sm text-green-600 font-medium">
                    {isKa ? 'კურსი დასრულებულია!' : 'Course Complete!'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-text-secondary">
                  {isKa ? 'აირჩიეთ გაკვეთილი დასაწყებად' : 'Select a lesson to begin'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
