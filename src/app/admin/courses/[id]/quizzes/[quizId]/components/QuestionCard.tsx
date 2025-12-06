'use client'

import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  HelpCircle,
  CheckCircle,
  CheckSquare,
  Circle,
  Type,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { Question, QuizOption } from '../types'

// Question type display info
const QUESTION_TYPES: Array<{
  type: string
  label: string
  icon: LucideIcon
  description: string
}> = [
  {
    type: 'MULTIPLE_CHOICE_SINGLE',
    label: 'Multiple Choice (Single)',
    icon: Circle,
    description: 'One correct answer',
  },
  {
    type: 'MULTIPLE_CHOICE_MULTIPLE',
    label: 'Multiple Choice (Multiple)',
    icon: CheckSquare,
    description: 'Multiple correct answers',
  },
  {
    type: 'TRUE_FALSE',
    label: 'True/False',
    icon: CheckCircle,
    description: 'Binary choice',
  },
  {
    type: 'SHORT_ANSWER',
    label: 'Short Answer',
    icon: Type,
    description: 'Text input, auto-graded',
  },
  {
    type: 'ESSAY',
    label: 'Essay',
    icon: FileText,
    description: 'Long text, manual grading',
  },
]

interface QuestionCardProps {
  question: Question
  index: number
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function QuestionCard({
  question,
  index,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionCardProps) {
  const typeInfo = QUESTION_TYPES.find((qt) => qt.type === question.type)
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
            <span className="text-xs px-2 py-0.5 bg-neu-base rounded">
              {question.points} pt{question.points !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-text-primary">{question.question}</p>

          {/* Show options for multiple choice */}
          {['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'TRUE_FALSE'].includes(
            question.type
          ) && (
            <div className="mt-3 space-y-1">
              {(question.options as QuizOption[]).map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-2 text-sm ${
                    opt.isCorrect ? 'text-green-600' : 'text-text-muted'
                  }`}
                >
                  {opt.isCorrect ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Show correct answer for short answer */}
          {question.type === 'SHORT_ANSWER' && question.correctAnswer && (
            <div className="mt-2 text-sm text-green-600">Correct: {question.correctAnswer}</div>
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
