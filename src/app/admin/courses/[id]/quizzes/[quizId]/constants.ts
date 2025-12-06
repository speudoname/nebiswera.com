import {
  Circle,
  CheckCircle,
  CheckSquare,
  Type,
  FileText,
} from 'lucide-react'
import type { QuestionTypeInfo } from './types'

export const QUESTION_TYPES: QuestionTypeInfo[] = [
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

export function generateOptionId() {
  return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}
