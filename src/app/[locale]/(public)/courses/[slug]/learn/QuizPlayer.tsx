'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface QuizOption {
  id: string
  text: string
}

interface QuizQuestion {
  id: string
  type: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTIPLE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'
  question: string
  points: number
  options: QuizOption[]
}

interface QuizData {
  id: string
  title: string
  description: string | null
  passingScore: number
  maxAttempts: number | null
  cooldownMinutes: number | null
  showCorrectAnswers: boolean
}

interface AttemptHistory {
  id: string
  score: number | null
  passed: boolean | null
  completedAt: string | null
}

interface GradedAnswer {
  questionId: string
  isCorrect: boolean
  pointsAwarded: number
  correctAnswer?: string[]
  explanation?: string
}

interface QuizResult {
  score: number
  passed: boolean
  passingScore: number
  earnedPoints: number
  totalPoints: number
  answers: GradedAnswer[]
  attemptsRemaining: number | null
  canRetry: boolean
  cooldownMinutes: number | null
}

interface QuizPlayerProps {
  quizId: string
  courseSlug: string
  partId: string
  isGate?: boolean
  onComplete?: (passed: boolean) => void
  onPixelTrack?: (quizId: string, quizTitle: string, passed: boolean, score: number) => void
  locale: string
}

export function QuizPlayer({
  quizId,
  courseSlug,
  partId,
  isGate,
  onComplete,
  onPixelTrack,
  locale,
}: QuizPlayerProps) {
  const isKa = locale === 'ka'

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [attempts, setAttempts] = useState<AttemptHistory[]>([])
  const [canRetry, setCanRetry] = useState(true)
  const [cooldownEndsAt, setCooldownEndsAt] = useState<Date | null>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  // Quiz taking state
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[] | string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResult | null>(null)

  // View state
  const [view, setView] = useState<'intro' | 'quiz' | 'result'>('intro')

  // Load quiz data
  useEffect(() => {
    loadQuiz()
  }, [quizId, courseSlug])

  const loadQuiz = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/courses/${courseSlug}/quiz/${quizId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load quiz')
      }

      setQuiz(data.quiz)
      setQuestions(data.questions)
      setAttempts(data.attempts)
      setCanRetry(data.canRetry)
      setCooldownEndsAt(data.cooldownEndsAt ? new Date(data.cooldownEndsAt) : null)
      setAttemptsUsed(data.attemptsUsed)
      setAttemptsRemaining(data.attemptsRemaining)

      // If there's an in-progress attempt, resume it
      if (data.inProgressAttemptId) {
        setAttemptId(data.inProgressAttemptId)
        setView('quiz')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  // Start quiz
  const startQuiz = async () => {
    setError(null)

    try {
      const res = await fetch(`/api/courses/${courseSlug}/quiz/${quizId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start quiz')
      }

      setAttemptId(data.attemptId)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResult(null)
      setView('quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz')
    }
  }

  // Submit quiz
  const submitQuiz = async () => {
    if (!attemptId) return

    setSubmitting(true)
    setError(null)

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...(Array.isArray(answer)
          ? { selectedOptions: answer }
          : { textAnswer: answer }),
      }))

      const res = await fetch(`/api/courses/${courseSlug}/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answers: formattedAnswers,
          partId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quiz')
      }

      setResult(data)
      setView('result')
      setAttemptsRemaining(data.attemptsRemaining)
      setCanRetry(data.canRetry)

      if (onComplete) {
        onComplete(data.passed)
      }

      // Track quiz completion for pixel
      if (onPixelTrack && quiz) {
        onPixelTrack(quizId, quiz.title, data.passed, data.score)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle answer change
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // Check if all questions are answered
  const allQuestionsAnswered = questions.every((q) => {
    const answer = answers[q.id]
    if (!answer) return false
    if (Array.isArray(answer)) return answer.length > 0
    return answer.trim().length > 0
  })

  // Cooldown timer
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null)

  useEffect(() => {
    if (!cooldownEndsAt) {
      setCooldownRemaining(null)
      return
    }

    const updateCooldown = () => {
      const now = new Date()
      if (cooldownEndsAt <= now) {
        setCooldownRemaining(null)
        setCooldownEndsAt(null)
        setCanRetry(true)
        return
      }

      const diff = cooldownEndsAt.getTime() - now.getTime()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCooldownRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)
    return () => clearInterval(interval)
  }, [cooldownEndsAt])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Error state
  if (error && !quiz) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadQuiz}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {isKa ? 'ხელახლა ცდა' : 'Try Again'}
        </button>
      </div>
    )
  }

  if (!quiz) return null

  // Intro view
  if (view === 'intro') {
    const lastAttempt = attempts[0]

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-8 text-center">
          <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-primary-100">{quiz.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{questions.length}</div>
            <div className="text-sm text-text-secondary">
              {isKa ? 'კითხვა' : 'Questions'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{quiz.passingScore}%</div>
            <div className="text-sm text-text-secondary">
              {isKa ? 'გავლის ზღვარი' : 'Passing Score'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {quiz.maxAttempts || '∞'}
            </div>
            <div className="text-sm text-text-secondary">
              {isKa ? 'მცდელობა' : 'Attempts'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {attemptsUsed}
            </div>
            <div className="text-sm text-text-secondary">
              {isKa ? 'გამოყენებული' : 'Used'}
            </div>
          </div>
        </div>

        {/* Last attempt result */}
        {lastAttempt && (
          <div className={`px-6 py-4 border-b ${lastAttempt.passed ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-3">
              {lastAttempt.passed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-amber-500" />
              )}
              <div>
                <div className="font-medium">
                  {isKa ? 'ბოლო შედეგი' : 'Last Result'}: {lastAttempt.score}%
                </div>
                <div className="text-sm text-text-secondary">
                  {lastAttempt.passed
                    ? isKa ? 'გავლილი' : 'Passed'
                    : isKa ? 'ვერ გაიარა' : 'Not Passed'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {cooldownRemaining ? (
            <div className="text-center">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-text-secondary mb-2">
                {isKa ? 'ხელახლა ცდამდე დარჩა' : 'Retry available in'}
              </p>
              <p className="text-2xl font-mono font-bold text-amber-600">
                {cooldownRemaining}
              </p>
            </div>
          ) : canRetry ? (
            <button
              onClick={startQuiz}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              {attemptsUsed > 0
                ? isKa ? 'ხელახლა ცდა' : 'Try Again'
                : isKa ? 'ტესტის დაწყება' : 'Start Quiz'}
            </button>
          ) : (
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-text-secondary">
                {isKa ? 'მცდელობები ამოიწურა' : 'No more attempts available'}
              </p>
            </div>
          )}

          {isGate && !lastAttempt?.passed && (
            <p className="mt-4 text-sm text-amber-600 text-center">
              {isKa
                ? 'გასაგრძელებლად ტესტის გავლა აუცილებელია'
                : 'You must pass this quiz to continue'}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Quiz view
  if (view === 'quiz') {
    const currentQuestion = questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestion.id]

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gray-100 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {isKa ? 'კითხვა' : 'Question'} {currentQuestionIndex + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {currentQuestion.question}
              </h3>
              <span className="text-sm text-text-secondary whitespace-nowrap">
                {currentQuestion.points} {isKa ? 'ქულა' : 'pts'}
              </span>
            </div>

            {/* Question Type Renderer */}
            <QuestionRenderer
              question={currentQuestion}
              answer={currentAnswer}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              locale={locale}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={() => setCurrentQuestionIndex((i) => i - 1)}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              {isKa ? 'წინა' : 'Previous'}
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={!allQuestionsAnswered || submitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isKa ? 'იგზავნება...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    {isKa ? 'დასრულება' : 'Submit Quiz'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700"
              >
                {isKa ? 'შემდეგი' : 'Next'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Question dots */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 pt-4 border-t">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = i === currentQuestionIndex

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-primary-600 text-white'
                      : isAnswered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Result view
  if (view === 'result' && result) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Result Header */}
        <div
          className={`px-6 py-8 text-center ${
            result.passed ? 'bg-green-500' : 'bg-amber-500'
          }`}
        >
          {result.passed ? (
            <Award className="w-16 h-16 text-white mx-auto mb-3" />
          ) : (
            <XCircle className="w-16 h-16 text-white mx-auto mb-3" />
          )}
          <h2 className="text-3xl font-bold text-white mb-2">{result.score}%</h2>
          <p className="text-white/90">
            {result.passed
              ? isKa ? 'გილოცავთ! თქვენ გაიარეთ ტესტი' : 'Congratulations! You passed!'
              : isKa ? 'სამწუხაროდ, ვერ გაიარეთ' : 'Sorry, you did not pass'}
          </p>
        </div>

        {/* Score Details */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {result.earnedPoints}/{result.totalPoints}
              </div>
              <div className="text-sm text-text-secondary">
                {isKa ? 'ქულები' : 'Points'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {result.passingScore}%
              </div>
              <div className="text-sm text-text-secondary">
                {isKa ? 'საჭირო' : 'Required'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {result.attemptsRemaining ?? '∞'}
              </div>
              <div className="text-sm text-text-secondary">
                {isKa ? 'დარჩენილი' : 'Remaining'}
              </div>
            </div>
          </div>
        </div>

        {/* Answer Review */}
        {quiz.showCorrectAnswers && (
          <div className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">
              {isKa ? 'პასუხების მიმოხილვა' : 'Answer Review'}
            </h3>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const graded = result.answers.find((a) => a.questionId === q.id)
                const userAnswer = answers[q.id]

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border ${
                      graded?.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {graded?.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary mb-2">
                          {i + 1}. {q.question}
                        </p>
                        <div className="text-sm space-y-1">
                          <p className="text-text-secondary">
                            {isKa ? 'თქვენი პასუხი' : 'Your answer'}:{' '}
                            <span className={graded?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {formatAnswer(q, userAnswer)}
                            </span>
                          </p>
                          {!graded?.isCorrect && graded?.correctAnswer && (
                            <p className="text-green-700">
                              {isKa ? 'სწორი პასუხი' : 'Correct answer'}:{' '}
                              {formatCorrectAnswer(q, graded.correctAnswer)}
                            </p>
                          )}
                          {graded?.explanation && (
                            <p className="text-text-secondary italic mt-2">
                              {graded.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {graded?.pointsAwarded}/{q.points}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t">
          {result.canRetry && !result.passed ? (
            <button
              onClick={() => {
                setView('intro')
                setAttemptId(null)
                setAnswers({})
                setResult(null)
                loadQuiz()
              }}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              {isKa ? 'ხელახლა ცდა' : 'Try Again'}
            </button>
          ) : result.passed ? (
            <div className="text-center text-green-600 font-medium">
              {isKa ? 'შეგიძლიათ გააგრძელოთ' : 'You may continue to the next lesson'}
            </div>
          ) : (
            <div className="text-center text-text-secondary">
              {isKa ? 'მცდელობები ამოიწურა' : 'No more attempts available'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}

// Question Renderer Component
function QuestionRenderer({
  question,
  answer,
  onChange,
  locale,
}: {
  question: QuizQuestion
  answer: string | string[] | undefined
  onChange: (value: string | string[]) => void
  locale: string
}) {
  const isKa = locale === 'ka'

  switch (question.type) {
    case 'MULTIPLE_CHOICE_SINGLE':
    case 'TRUE_FALSE':
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                answer === option.id || (Array.isArray(answer) && answer[0] === option.id)
                  ? 'bg-primary-50 border-primary-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={answer === option.id || (Array.isArray(answer) && answer[0] === option.id)}
                onChange={() => onChange([option.id])}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-text-primary">{option.text}</span>
            </label>
          ))}
        </div>
      )

    case 'MULTIPLE_CHOICE_MULTIPLE':
      const selectedOptions = Array.isArray(answer) ? answer : []
      return (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary mb-2">
            {isKa ? 'აირჩიეთ ყველა სწორი პასუხი' : 'Select all correct answers'}
          </p>
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedOptions.includes(option.id)
                  ? 'bg-primary-50 border-primary-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedOptions, option.id])
                  } else {
                    onChange(selectedOptions.filter((id) => id !== option.id))
                  }
                }}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-text-primary">{option.text}</span>
            </label>
          ))}
        </div>
      )

    case 'SHORT_ANSWER':
      return (
        <div>
          <input
            type="text"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isKa ? 'შეიყვანეთ პასუხი...' : 'Enter your answer...'}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )

    case 'ESSAY':
      return (
        <div>
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isKa ? 'დაწერეთ თქვენი პასუხი...' : 'Write your answer...'}
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
          />
        </div>
      )

    default:
      return null
  }
}

// Helper to format user's answer for display
function formatAnswer(question: QuizQuestion, answer: string | string[] | undefined): string {
  if (!answer) return '-'

  if (question.type === 'SHORT_ANSWER' || question.type === 'ESSAY') {
    return typeof answer === 'string' ? answer : '-'
  }

  const selectedIds = Array.isArray(answer) ? answer : [answer]
  const selectedTexts = selectedIds
    .map((id) => question.options.find((o) => o.id === id)?.text)
    .filter(Boolean)

  return selectedTexts.join(', ') || '-'
}

// Helper to format correct answer for display
function formatCorrectAnswer(question: QuizQuestion, correctAnswer: string[]): string {
  if (question.type === 'SHORT_ANSWER') {
    return correctAnswer[0] || '-'
  }

  const correctTexts = correctAnswer
    .map((id) => question.options.find((o) => o.id === id)?.text)
    .filter(Boolean)

  return correctTexts.join(', ') || '-'
}
