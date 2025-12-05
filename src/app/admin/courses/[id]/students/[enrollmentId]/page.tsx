'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  TrendingUp,
  Play,
  Layers,
} from 'lucide-react'

type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'SUSPENDED'
type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

interface PartProgress {
  id: string
  status: ProgressStatus
  watchTime: number
  watchPercent: number
  completedAt: string | null
  lastAccessedAt: string
  part: {
    id: string
    title: string
    order: number
    lesson: {
      id: string
      title: string
      order: number
      module: {
        id: string
        title: string
        order: number
      } | null
    }
  }
}

interface QuizAttempt {
  id: string
  score: number | null
  passed: boolean | null
  startedAt: string
  completedAt: string | null
  quiz: {
    id: string
    title: string
    passingScore: number
  }
}

interface Enrollment {
  id: string
  userId: string
  status: EnrollmentStatus
  progressPercent: number
  enrolledAt: string
  completedAt: string | null
  expiresAt: string | null
  certificateUrl: string | null
  certificateIssuedAt: string | null
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    createdAt: string
  }
  course: {
    id: string
    title: string
    slug: string
    settings: Record<string, unknown>
  }
  partProgress: PartProgress[]
  quizAttempts: QuizAttempt[]
}

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string; bgColor: string }> = {
  ACTIVE: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
  COMPLETED: { label: 'Completed', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  EXPIRED: { label: 'Expired', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  SUSPENDED: { label: 'Suspended', color: 'text-red-600', bgColor: 'bg-red-100' },
}

const PROGRESS_STATUS_CONFIG: Record<ProgressStatus, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'text-text-muted' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-600' },
  COMPLETED: { label: 'Completed', color: 'text-green-600' },
}

export default function StudentProgressPage() {
  const params = useParams()
  const courseId = params.id as string
  const enrollmentId = params.enrollmentId as string
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    status: 'ACTIVE' as EnrollmentStatus,
    expiresAt: '',
    progressPercent: 0,
  })

  useEffect(() => {
    fetchEnrollment()
  }, [enrollmentId])

  const fetchEnrollment = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments/${enrollmentId}`)
      if (res.ok) {
        const data = await res.json()
        setEnrollment(data)
        setEditForm({
          status: data.status,
          expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
          progressPercent: data.progressPercent,
        })
      } else {
        router.push(`/admin/courses/${courseId}/students`)
      }
    } catch (error) {
      console.error('Failed to fetch enrollment:', error)
      router.push(`/admin/courses/${courseId}/students`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editForm.status,
          expiresAt: editForm.expiresAt || null,
          progressPercent: editForm.progressPercent,
        }),
      })

      if (res.ok) {
        await fetchEnrollment()
        setEditModalOpen(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update')
      }
    } catch (error) {
      console.error('Failed to update:', error)
      alert('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!enrollment) return null

  const statusConfig = STATUS_CONFIG[enrollment.status]

  // Group progress by module/lesson
  const progressByModule = new Map<string | null, Map<string, PartProgress[]>>()
  enrollment.partProgress.forEach(pp => {
    const moduleId = pp.part.lesson.module?.id || null
    const lessonId = pp.part.lesson.id

    if (!progressByModule.has(moduleId)) {
      progressByModule.set(moduleId, new Map())
    }
    const lessonMap = progressByModule.get(moduleId)!
    if (!lessonMap.has(lessonId)) {
      lessonMap.set(lessonId, [])
    }
    lessonMap.get(lessonId)!.push(pp)
  })

  // Calculate stats
  const totalParts = enrollment.partProgress.length
  const completedParts = enrollment.partProgress.filter(p => p.status === 'COMPLETED').length
  const inProgressParts = enrollment.partProgress.filter(p => p.status === 'IN_PROGRESS').length
  const totalWatchTime = enrollment.partProgress.reduce((acc, p) => acc + p.watchTime, 0)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${courseId}/students`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {enrollment.user.image ? (
              <img
                src={enrollment.user.image}
                alt=""
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-medium text-primary-600">
                  {(enrollment.user.name || enrollment.user.email)[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {enrollment.user.name || 'Unnamed User'}
              </h1>
              <p className="text-text-muted flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {enrollment.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
              Edit Enrollment
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-text-muted">Progress</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{enrollment.progressPercent}%</div>
          <div className="mt-2 w-full h-2 bg-neu-base rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${enrollment.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="text-sm text-text-muted">Parts Completed</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {completedParts} <span className="text-lg text-text-muted">/ {totalParts}</span>
          </div>
          <div className="text-sm text-text-muted mt-1">{inProgressParts} in progress</div>
        </div>

        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-text-muted">Time Spent</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{formatDuration(totalWatchTime)}</div>
          <div className="text-sm text-text-muted mt-1">
            Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-text-muted">Quiz Attempts</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{enrollment.quizAttempts.length}</div>
          <div className="text-sm text-text-muted mt-1">
            {enrollment.quizAttempts.filter(a => a.passed).length} passed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Part Progress */}
        <div className="col-span-2">
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Content Progress
            </h2>

            {enrollment.partProgress.length === 0 ? (
              <p className="text-text-muted text-center py-8">No progress yet</p>
            ) : (
              <div className="space-y-4">
                {Array.from(progressByModule.entries()).map(([moduleId, lessonMap]) => {
                  const firstLesson = lessonMap.values().next().value?.[0]?.part.lesson
                  const moduleName = firstLesson?.module?.title || 'Standalone Lessons'

                  return (
                    <div key={moduleId || 'standalone'} className="border border-neu-dark rounded-lg overflow-hidden">
                      <div className="bg-neu-base px-4 py-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-text-primary">{moduleName}</span>
                      </div>

                      <div className="divide-y divide-neu-dark">
                        {Array.from(lessonMap.entries()).map(([lessonId, parts]) => {
                          const lesson = parts[0]?.part.lesson
                          const lessonComplete = parts.every(p => p.status === 'COMPLETED')
                          const lessonProgress = parts.filter(p => p.status === 'COMPLETED').length / parts.length * 100

                          return (
                            <div key={lessonId} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {lessonComplete ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-text-muted" />
                                  )}
                                  <span className="font-medium text-text-primary">{lesson?.title}</span>
                                </div>
                                <span className="text-sm text-text-muted">
                                  {Math.round(lessonProgress)}% complete
                                </span>
                              </div>

                              <div className="space-y-1 ml-6">
                                {parts.sort((a, b) => a.part.order - b.part.order).map(pp => {
                                  const progressConfig = PROGRESS_STATUS_CONFIG[pp.status]
                                  return (
                                    <div key={pp.id} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        {pp.status === 'COMPLETED' ? (
                                          <CheckCircle className="w-3 h-3 text-green-600" />
                                        ) : pp.status === 'IN_PROGRESS' ? (
                                          <Play className="w-3 h-3 text-amber-600" />
                                        ) : (
                                          <div className="w-3 h-3 rounded-full border border-text-muted" />
                                        )}
                                        <span className={progressConfig.color}>{pp.part.title}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-text-muted">
                                        {pp.watchPercent > 0 && (
                                          <span>{pp.watchPercent}% watched</span>
                                        )}
                                        {pp.completedAt && (
                                          <span>{new Date(pp.completedAt).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Details */}
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Enrollment Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-muted">Enrolled</span>
                <span className="text-text-primary">{new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
              </div>
              {enrollment.completedAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Completed</span>
                  <span className="text-green-600">{new Date(enrollment.completedAt).toLocaleDateString()}</span>
                </div>
              )}
              {enrollment.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Expires</span>
                  <span className={new Date(enrollment.expiresAt) < new Date() ? 'text-red-600' : 'text-text-primary'}>
                    {new Date(enrollment.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">User Since</span>
                <span className="text-text-primary">{new Date(enrollment.user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quiz Attempts */}
          <div className="bg-neu-light rounded-neu shadow-neu p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              Quiz Attempts
            </h2>

            {enrollment.quizAttempts.length === 0 ? (
              <p className="text-text-muted text-center py-4">No quiz attempts</p>
            ) : (
              <div className="space-y-3">
                {enrollment.quizAttempts.map(attempt => (
                  <div key={attempt.id} className="p-3 bg-neu-base rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary text-sm">{attempt.quiz.title}</span>
                      {attempt.passed !== null && (
                        attempt.passed ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded">Passed</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">Failed</span>
                        )
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>
                        {attempt.score !== null ? `${attempt.score}%` : 'In Progress'} (Pass: {attempt.quiz.passingScore}%)
                      </span>
                      <span>{new Date(attempt.startedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificate */}
          {enrollment.certificateUrl && (
            <div className="bg-neu-light rounded-neu shadow-neu p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                Certificate
              </h2>
              <div className="text-sm text-text-muted mb-3">
                Issued {enrollment.certificateIssuedAt && new Date(enrollment.certificateIssuedAt).toLocaleDateString()}
              </div>
              <a
                href={enrollment.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <Award className="w-4 h-4" />
                View Certificate
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Enrollment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as EnrollmentStatus }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Expires At</label>
            <input
              type="date"
              value={editForm.expiresAt}
              onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Progress Percent</label>
            <input
              type="number"
              min="0"
              max="100"
              value={editForm.progressPercent}
              onChange={(e) => setEditForm(prev => ({ ...prev, progressPercent: parseInt(e.target.value) || 0 }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
