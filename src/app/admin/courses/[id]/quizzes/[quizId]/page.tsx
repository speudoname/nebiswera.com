'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Settings,
  HelpCircle,
  CheckCircle,
  Circle,
  Square,
  CheckSquare,
  Type,
  FileText,
  Copy,
  Eye,
} from 'lucide-react'

type QuestionType =
  | 'MULTIPLE_CHOICE_SINGLE'
  | 'MULTIPLE_CHOICE_MULTIPLE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  type: QuestionType
  question: string
  explanation: string | null
  points: number
  order: number
  options: QuizOption[]
  correctAnswer: string | null
}

interface Quiz {
  id: string
  title: string
  description: string | null
  passingScore: number
  maxAttempts: number | null
  cooldownMinutes: number | null
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showCorrectAnswers: boolean
  questions: Question[]
  course: {
    id: string
    title: string
    slug: string
  }
  _count: {
    attempts: number
  }
}

const QUESTION_TYPES: { type: QuestionType; label: string; icon: typeof Circle; description: string }[] = [
  { type: 'MULTIPLE_CHOICE_SINGLE', label: 'Multiple Choice (Single)', icon: Circle, description: 'One correct answer' },
  { type: 'MULTIPLE_CHOICE_MULTIPLE', label: 'Multiple Choice (Multiple)', icon: CheckSquare, description: 'Multiple correct answers' },
  { type: 'TRUE_FALSE', label: 'True/False', icon: CheckCircle, description: 'Binary choice' },
  { type: 'SHORT_ANSWER', label: 'Short Answer', icon: Type, description: 'Text input, auto-graded' },
  { type: 'ESSAY', label: 'Essay', icon: FileText, description: 'Long text, manual grading' },
]

function generateOptionId() {
  return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}

export default function QuizEditorPage() {
  const params = useParams()
  const courseId = params.id as string
  const quizId = params.quizId as string
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Quiz settings form
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    passingScore: 70,
    maxAttempts: null as number | null,
    cooldownMinutes: null as number | null,
    shuffleQuestions: false,
    shuffleOptions: false,
    showCorrectAnswers: true,
  })

  // Modal states
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addQuestionOpen, setAddQuestionOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteQuestionConfirm, setDeleteQuestionConfirm] = useState<Question | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Question form
  const [questionForm, setQuestionForm] = useState({
    type: 'MULTIPLE_CHOICE_SINGLE' as QuestionType,
    question: '',
    explanation: '',
    points: 1,
    options: [
      { id: generateOptionId(), text: '', isCorrect: true },
      { id: generateOptionId(), text: '', isCorrect: false },
    ] as QuizOption[],
    correctAnswer: '',
  })

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}`)
      if (res.ok) {
        const data = await res.json()
        setQuiz(data)
        setSettings({
          title: data.title,
          description: data.description || '',
          passingScore: data.passingScore,
          maxAttempts: data.maxAttempts,
          cooldownMinutes: data.cooldownMinutes,
          shuffleQuestions: data.shuffleQuestions,
          shuffleOptions: data.shuffleOptions,
          showCorrectAnswers: data.showCorrectAnswers,
        })
      } else {
        router.push(`/admin/courses/${courseId}/quizzes`)
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error)
      router.push(`/admin/courses/${courseId}/quizzes`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        const data = await res.json()
        setQuiz(prev => prev ? { ...prev, ...data } : null)
        setSettingsOpen(false)
        setHasChanges(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetQuestionForm = (type: QuestionType = 'MULTIPLE_CHOICE_SINGLE') => {
    if (type === 'TRUE_FALSE') {
      setQuestionForm({
        type,
        question: '',
        explanation: '',
        points: 1,
        options: [
          { id: generateOptionId(), text: 'True', isCorrect: true },
          { id: generateOptionId(), text: 'False', isCorrect: false },
        ],
        correctAnswer: '',
      })
    } else if (type === 'SHORT_ANSWER' || type === 'ESSAY') {
      setQuestionForm({
        type,
        question: '',
        explanation: '',
        points: 1,
        options: [],
        correctAnswer: '',
      })
    } else {
      setQuestionForm({
        type,
        question: '',
        explanation: '',
        points: 1,
        options: [
          { id: generateOptionId(), text: '', isCorrect: true },
          { id: generateOptionId(), text: '', isCorrect: false },
        ],
        correctAnswer: '',
      })
    }
  }

  const handleAddQuestion = async () => {
    if (!questionForm.question.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: questionForm.type,
          question: questionForm.question,
          explanation: questionForm.explanation || null,
          points: questionForm.points,
          options: questionForm.options,
          correctAnswer: questionForm.correctAnswer || null,
        }),
      })

      if (res.ok) {
        await fetchQuiz()
        setAddQuestionOpen(false)
        resetQuestionForm()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add question')
      }
    } catch (error) {
      console.error('Failed to add question:', error)
      alert('Failed to add question')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !questionForm.question.trim()) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/quizzes/${quizId}/questions/${editingQuestion.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: questionForm.type,
            question: questionForm.question,
            explanation: questionForm.explanation || null,
            points: questionForm.points,
            options: questionForm.options,
            correctAnswer: questionForm.correctAnswer || null,
          }),
        }
      )

      if (res.ok) {
        await fetchQuiz()
        setEditingQuestion(null)
        resetQuestionForm()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update question')
      }
    } catch (error) {
      console.error('Failed to update question:', error)
      alert('Failed to update question')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionConfirm) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/quizzes/${quizId}/questions/${deleteQuestionConfirm.id}`,
        { method: 'DELETE' }
      )

      if (res.ok) {
        await fetchQuiz()
        setDeleteQuestionConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete question')
      }
    } catch (error) {
      console.error('Failed to delete question:', error)
      alert('Failed to delete question')
    } finally {
      setSaving(false)
    }
  }

  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!quiz) return
    const idx = quiz.questions.findIndex(q => q.id === questionId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === quiz.questions.length - 1) return

    const newQuestions = [...quiz.questions]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]]

    // Update order values
    const items = newQuestions.map((q, i) => ({ id: q.id, order: i }))

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes/${quizId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (res.ok) {
        await fetchQuiz()
      }
    } catch (error) {
      console.error('Failed to reorder questions:', error)
    }
  }

  const openEditQuestion = (question: Question) => {
    setQuestionForm({
      type: question.type,
      question: question.question,
      explanation: question.explanation || '',
      points: question.points,
      options: question.options || [],
      correctAnswer: question.correctAnswer || '',
    })
    setEditingQuestion(question)
  }

  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { id: generateOptionId(), text: '', isCorrect: false }],
    }))
  }

  const removeOption = (optionId: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter(o => o.id !== optionId),
    }))
  }

  const updateOption = (optionId: string, updates: Partial<QuizOption>) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map(o => (o.id === optionId ? { ...o, ...updates } : o)),
    }))
  }

  const setCorrectOption = (optionId: string) => {
    if (questionForm.type === 'MULTIPLE_CHOICE_SINGLE' || questionForm.type === 'TRUE_FALSE') {
      // Single correct answer - uncheck others
      setQuestionForm(prev => ({
        ...prev,
        options: prev.options.map(o => ({ ...o, isCorrect: o.id === optionId })),
      }))
    } else {
      // Multiple correct - toggle
      setQuestionForm(prev => ({
        ...prev,
        options: prev.options.map(o =>
          o.id === optionId ? { ...o, isCorrect: !o.isCorrect } : o
        ),
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!quiz) return null

  const totalPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${courseId}/quizzes`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{quiz.title}</h1>
            <p className="text-text-muted">
              {quiz.course.title} &middot; {quiz.questions.length} questions &middot; {totalPoints} points
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Quiz Info Bar */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-neu-base rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Pass: {quiz.passingScore}%</span>
        </div>
        {quiz.maxAttempts && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <span>Max {quiz.maxAttempts} attempts</span>
          </div>
        )}
        {quiz.cooldownMinutes && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>{quiz.cooldownMinutes}min cooldown</span>
          </div>
        )}
        {quiz.shuffleQuestions && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Shuffle Questions</span>
        )}
        {quiz.shuffleOptions && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Shuffle Options</span>
        )}
        <div className="flex items-center gap-2 text-sm text-text-muted ml-auto">
          <span className="font-mono text-xs">{quiz.id}</span>
          <button
            onClick={() => navigator.clipboard.writeText(quiz.id)}
            className="p-1 hover:text-primary-600 transition-colors"
            title="Copy Quiz ID"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.length === 0 ? (
          <div className="text-center py-16 bg-neu-light rounded-neu shadow-neu">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-lg font-medium text-text-secondary mb-2">No questions yet</p>
            <p className="text-text-muted mb-6">Add questions to your quiz</p>
            <Button onClick={() => { resetQuestionForm(); setAddQuestionOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        ) : (
          <>
            {quiz.questions.map((question, idx) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === quiz.questions.length - 1}
                onEdit={() => openEditQuestion(question)}
                onDelete={() => setDeleteQuestionConfirm(question)}
                onMoveUp={() => handleMoveQuestion(question.id, 'up')}
                onMoveDown={() => handleMoveQuestion(question.id, 'down')}
              />
            ))}

            <button
              onClick={() => { resetQuestionForm(); setAddQuestionOpen(true); }}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neu-dark rounded-neu text-text-muted hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Quiz Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.passingScore}
                onChange={(e) => setSettings(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Max Attempts</label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={settings.maxAttempts || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, maxAttempts: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cooldown (minutes)</label>
            <input
              type="number"
              min="0"
              placeholder="No cooldown"
              value={settings.cooldownMinutes || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, cooldownMinutes: e.target.value ? parseInt(e.target.value) : null }))}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-muted">Time between retry attempts</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shuffleQuestions}
                onChange={(e) => setSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                className="w-5 h-5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <span className="text-text-primary">Shuffle question order</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shuffleOptions}
                onChange={(e) => setSettings(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
                className="w-5 h-5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <span className="text-text-primary">Shuffle answer options</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showCorrectAnswers}
                onChange={(e) => setSettings(prev => ({ ...prev, showCorrectAnswers: e.target.checked }))}
                className="w-5 h-5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
              />
              <span className="text-text-primary">Show correct answers after submission</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Question Modal */}
      <Modal
        isOpen={addQuestionOpen || !!editingQuestion}
        onClose={() => {
          setAddQuestionOpen(false)
          setEditingQuestion(null)
          resetQuestionForm()
        }}
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Question Type</label>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TYPES.map((qt) => (
                <button
                  key={qt.type}
                  onClick={() => {
                    setQuestionForm(prev => ({ ...prev, type: qt.type }))
                    if (qt.type !== questionForm.type) {
                      resetQuestionForm(qt.type)
                    }
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors ${
                    questionForm.type === qt.type
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-transparent bg-neu-base hover:border-primary-200'
                  }`}
                >
                  <qt.icon className="w-5 h-5 text-primary-600" />
                  <div>
                    <div className="font-medium text-text-primary text-sm">{qt.label}</div>
                    <div className="text-xs text-text-muted">{qt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Question</label>
            <textarea
              value={questionForm.question}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
              placeholder="Enter your question..."
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>

          {/* Options for Multiple Choice */}
          {['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'TRUE_FALSE'].includes(questionForm.type) && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Answer Options
                <span className="text-xs text-text-muted ml-2">
                  {questionForm.type === 'MULTIPLE_CHOICE_SINGLE' ? '(Select one correct)' :
                   questionForm.type === 'MULTIPLE_CHOICE_MULTIPLE' ? '(Select all correct)' : ''}
                </span>
              </label>
              <div className="space-y-2">
                {questionForm.options.map((option, idx) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setCorrectOption(option.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        option.isCorrect
                          ? 'bg-green-100 text-green-600'
                          : 'bg-neu-base text-text-muted hover:text-primary-600'
                      }`}
                      title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
                    >
                      {questionForm.type === 'MULTIPLE_CHOICE_MULTIPLE' ? (
                        option.isCorrect ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />
                      ) : (
                        option.isCorrect ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, { text: e.target.value })}
                      placeholder={`Option ${idx + 1}`}
                      disabled={questionForm.type === 'TRUE_FALSE'}
                      className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none disabled:opacity-60"
                    />
                    {questionForm.type !== 'TRUE_FALSE' && questionForm.options.length > 2 && (
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-2 text-text-muted hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {questionForm.type !== 'TRUE_FALSE' && (
                  <button
                    onClick={addOption}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Correct Answer for Short Answer */}
          {questionForm.type === 'SHORT_ANSWER' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Correct Answer
                <span className="text-xs text-text-muted ml-2">(case-insensitive match)</span>
              </label>
              <input
                type="text"
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                placeholder="Enter the correct answer..."
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              />
            </div>
          )}

          {/* Essay note */}
          {questionForm.type === 'ESSAY' && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              Essay questions require manual grading. Students will receive &quot;pending&quot; until you grade their response.
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Explanation (optional)
              <span className="text-xs text-text-muted ml-2">Shown after answering</span>
            </label>
            <textarea
              value={questionForm.explanation}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              placeholder="Explain why the answer is correct..."
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Points</label>
            <input
              type="number"
              min="1"
              value={questionForm.points}
              onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              className="w-32 rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neu-dark">
            <Button
              variant="secondary"
              onClick={() => {
                setAddQuestionOpen(false)
                setEditingQuestion(null)
                resetQuestionForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
              disabled={saving || !questionForm.question.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {editingQuestion ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingQuestion ? 'Save Question' : 'Add Question'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Question Confirmation */}
      <Modal
        isOpen={!!deleteQuestionConfirm}
        onClose={() => setDeleteQuestionConfirm(null)}
        title="Delete Question"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-text-secondary mb-6">
            Are you sure you want to delete this question?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteQuestionConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteQuestion} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Quiz Preview"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {quiz.questions.length === 0 ? (
            <p className="text-center text-text-muted py-8">No questions to preview</p>
          ) : (
            quiz.questions.map((question, idx) => (
              <div key={question.id} className="p-4 bg-neu-base rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                    {idx + 1}
                  </span>
                  <p className="text-text-primary">{question.question}</p>
                </div>
                {['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'TRUE_FALSE'].includes(question.type) && (
                  <div className="space-y-2 ml-9">
                    {(question.options as QuizOption[]).map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-neu-light"
                      >
                        {question.type === 'MULTIPLE_CHOICE_MULTIPLE' ? (
                          <Square className="w-4 h-4 text-text-muted" />
                        ) : (
                          <Circle className="w-4 h-4 text-text-muted" />
                        )}
                        <span className="text-text-secondary">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {question.type === 'SHORT_ANSWER' && (
                  <div className="ml-9">
                    <input
                      type="text"
                      disabled
                      placeholder="Student enters answer here..."
                      className="w-full px-3 py-2 bg-neu-light rounded-lg text-text-muted"
                    />
                  </div>
                )}
                {question.type === 'ESSAY' && (
                  <div className="ml-9">
                    <textarea
                      disabled
                      placeholder="Student enters long-form answer here..."
                      rows={3}
                      className="w-full px-3 py-2 bg-neu-light rounded-lg text-text-muted resize-none"
                    />
                  </div>
                )}
              </div>
            ))
          )}
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Question Card Component
function QuestionCard({
  question,
  index,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: Question
  index: number
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const typeInfo = QUESTION_TYPES.find(qt => qt.type === question.type)
  const Icon = typeInfo?.icon || HelpCircle

  return (
    <div className="bg-neu-light rounded-neu shadow-neu p-4">
      <div className="flex items-start gap-4">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 text-text-muted hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 text-text-muted hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Question number */}
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full font-medium">
          {index + 1}
        </div>

        {/* Question content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-text-muted" />
            <span className="text-xs text-text-muted">{typeInfo?.label}</span>
            <span className="text-xs px-2 py-0.5 bg-neu-base rounded">{question.points} pt{question.points !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-text-primary">{question.question}</p>

          {/* Show options for multiple choice */}
          {['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'TRUE_FALSE'].includes(question.type) && (
            <div className="mt-3 space-y-1">
              {(question.options as QuizOption[]).map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-2 text-sm ${
                    opt.isCorrect ? 'text-green-600' : 'text-text-muted'
                  }`}
                >
                  {opt.isCorrect ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Show correct answer for short answer */}
          {question.type === 'SHORT_ANSWER' && question.correctAnswer && (
            <div className="mt-2 text-sm text-green-600">
              Correct: {question.correctAnswer}
            </div>
          )}

          {/* Show explanation if present */}
          {question.explanation && (
            <div className="mt-2 text-sm text-text-muted italic">
              Explanation: {question.explanation}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-text-muted hover:text-primary-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-text-muted hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
