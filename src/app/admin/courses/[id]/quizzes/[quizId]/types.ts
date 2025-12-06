import type { Circle } from 'lucide-react'

export type QuestionType =
  | 'MULTIPLE_CHOICE_SINGLE'
  | 'MULTIPLE_CHOICE_MULTIPLE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface Question {
  id: string
  type: QuestionType
  question: string
  explanation: string | null
  points: number
  order: number
  options: QuizOption[]
  correctAnswer: string | null
}

export interface Quiz {
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

export interface QuestionTypeInfo {
  type: QuestionType
  label: string
  icon: typeof Circle
  description: string
}
