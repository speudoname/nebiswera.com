/**
 * Quiz Configuration Component
 *
 * Manages quiz options with correct answer selection
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface QuizConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function QuizConfig({ config, onChange }: QuizConfigProps) {
  const [options, setOptions] = useState<string[]>((config.options as string[]) || ['', ''])
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(
    (config.correctAnswers as number[]) || []
  )

  // Sync with parent when options or answers change
  useEffect(() => {
    onChange({ ...config, options, correctAnswers })
  }, [options, correctAnswers])

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
      // Remove from correctAnswers if it was marked correct
      setCorrectAnswers(correctAnswers.filter((i) => i !== index))
    }
  }

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const toggleCorrectAnswer = (index: number) => {
    const newCorrect = correctAnswers.includes(index)
      ? correctAnswers.filter((i) => i !== index)
      : [...correctAnswers, index]
    setCorrectAnswers(newCorrect)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        Quiz Options (check the correct answer)
      </label>
      {options.map((option, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={correctAnswers.includes(index)}
            onChange={() => toggleCorrectAnswer(index)}
            className="rounded"
            title="Mark as correct answer"
          />
          <input
            type="text"
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder={`Option ${index + 1}`}
          />
          {options.length > 2 && (
            <button
              onClick={() => removeOption(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {options.length < 6 && (
        <button onClick={addOption} className="text-sm text-primary-500 hover:text-primary-600">
          + Add option
        </button>
      )}
      <p className="text-xs text-text-muted mt-2">Check the box next to the correct answer(s)</p>
    </div>
  )
}
