/**
 * Poll Configuration Component
 *
 * Manages multiple choice options for poll interactions
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface PollConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function PollConfig({ config, onChange }: PollConfigProps) {
  const [options, setOptions] = useState<string[]>((config.options as string[]) || ['', ''])

  // Sync with parent when options change
  useEffect(() => {
    onChange({ ...config, options })
  }, [options])

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">Poll Options</label>
      {options.map((option, index) => (
        <div key={index} className="flex gap-2">
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
    </div>
  )
}
