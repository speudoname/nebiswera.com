'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  FileQuestion,
  Users,
  MoreVertical,
  Copy,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react'

interface Question {
  id: string
  type: string
  question: string
  points: number
  order: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  passingScore: number
  maxAttempts: number | null
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showCorrectAnswers: boolean
  questions: Question[]
  _count: {
    attempts: number
  }
  createdAt: string
}

interface Course {
  id: string
  title: string
  slug: string
}

export default function QuizzesPage() {
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal states
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Quiz | null>(null)
  const [newQuizTitle, setNewQuizTitle] = useState('')
  const [newQuizDescription, setNewQuizDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      const [courseRes, quizzesRes] = await Promise.all([
        fetch(`/api/admin/courses/${courseId}`),
        fetch(`/api/admin/courses/${courseId}/quizzes`),
      ])

      if (courseRes.ok) {
        const courseData = await courseRes.json()
        setCourse(courseData)
      } else {
        router.push('/admin/courses')
        return
      }

      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json()
        setQuizzes(quizzesData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      router.push('/admin/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQuizTitle,
          description: newQuizDescription || null,
        }),
      })

      if (res.ok) {
        const quiz = await res.json()
        // Navigate to the quiz editor
        router.push(`/admin/courses/${courseId}/quizzes/${quiz.id}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Failed to create quiz:', error)
      alert('Failed to create quiz')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== deleteConfirm.id))
        setDeleteConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    } finally {
      setSaving(false)
    }
  }

  const copyQuizId = (quizId: string) => {
    navigator.clipboard.writeText(quizId)
    // Could show a toast here
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!course) return null

  const totalQuestions = quizzes.reduce((acc, q) => acc + q.questions.length, 0)
  const totalAttempts = quizzes.reduce((acc, q) => acc + q._count.attempts, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${courseId}`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
              <FileQuestion className="w-8 h-8 text-primary-600" />
              Quizzes
            </h1>
            <p className="text-text-muted">{course.title}</p>
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="text-2xl font-bold text-text-primary">{quizzes.length}</div>
          <div className="text-sm text-text-muted">Total Quizzes</div>
        </div>
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="text-2xl font-bold text-text-primary">{totalQuestions}</div>
          <div className="text-sm text-text-muted">Total Questions</div>
        </div>
        <div className="bg-neu-light rounded-neu shadow-neu p-4">
          <div className="text-2xl font-bold text-text-primary">{totalAttempts}</div>
          <div className="text-sm text-text-muted">Total Attempts</div>
        </div>
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-neu-light rounded-neu shadow-neu">
          <FileQuestion className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
          <p className="text-lg font-medium text-text-secondary mb-2">No quizzes yet</p>
          <p className="text-text-muted mb-6">Create your first quiz to add assessments to your course</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-neu-light rounded-neu shadow-neu p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">{quiz.title}</h3>
                    <span className="text-xs px-2 py-1 bg-neu-base rounded text-text-muted font-mono">
                      {quiz.id}
                    </span>
                    <button
                      onClick={() => copyQuizId(quiz.id)}
                      className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                      title="Copy Quiz ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {quiz.description && (
                    <p className="text-text-secondary mb-3">{quiz.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-text-muted">
                      <HelpCircle className="w-4 h-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <CheckCircle className="w-4 h-4" />
                      <span>Pass: {quiz.passingScore}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <Users className="w-4 h-4" />
                      <span>{quiz._count.attempts} attempts</span>
                    </div>
                    {quiz.maxAttempts && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <span>Max {quiz.maxAttempts} attempts</span>
                      </div>
                    )}
                    {quiz.shuffleQuestions && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        Shuffle
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/courses/${courseId}/quizzes/${quiz.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(quiz)}
                    className="p-2 text-text-muted hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Preview */}
              {quiz.questions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neu-dark">
                  <div className="text-xs text-text-muted uppercase tracking-wide mb-2">
                    Questions Preview
                  </div>
                  <div className="space-y-1">
                    {quiz.questions.slice(0, 3).map((q, idx) => (
                      <div key={q.id} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="w-5 h-5 flex items-center justify-center bg-neu-base rounded text-xs">
                          {idx + 1}
                        </span>
                        <span className="truncate flex-1">{q.question}</span>
                        <span className="text-xs text-text-muted">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                    {quiz.questions.length > 3 && (
                      <div className="text-xs text-text-muted pl-7">
                        +{quiz.questions.length - 3} more questions
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Quiz Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setNewQuizTitle('')
          setNewQuizDescription('')
        }}
        title="Create Quiz"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={newQuizTitle}
              onChange={(e) => setNewQuizTitle(e.target.value)}
              placeholder="e.g., Module 1 Assessment"
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description (optional)
            </label>
            <textarea
              value={newQuizDescription}
              onChange={(e) => setNewQuizDescription(e.target.value)}
              placeholder="Brief description of what this quiz covers..."
              rows={3}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuiz} disabled={saving || !newQuizTitle.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Quiz"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-text-secondary mb-2">
            Are you sure you want to delete <strong>&quot;{deleteConfirm?.title}&quot;</strong>?
          </p>
          {deleteConfirm && deleteConfirm._count.attempts > 0 && (
            <p className="text-sm text-amber-600 mb-4">
              This quiz has {deleteConfirm._count.attempts} student attempts that will also be deleted.
            </p>
          )}
          <p className="text-sm text-text-muted mb-6">
            This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteQuiz} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
