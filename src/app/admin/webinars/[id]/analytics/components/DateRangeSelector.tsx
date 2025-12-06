'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export interface DateRange {
  start: Date
  end: Date
  label: string
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1, isYesterday: true },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'All time', days: 9999 },
]

function getDateRange(days: number, isYesterday = false): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  if (isYesterday) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() - 1)
    end.setHours(23, 59, 59, 999)
    return { start: yesterday, end }
  }

  if (days === 0) {
    // Today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return { start: today, end }
  }

  if (days === 9999) {
    // All time - go back 2 years
    const start = new Date()
    start.setFullYear(start.getFullYear() - 2)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }

  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = getDateRange(preset.days, preset.isYesterday)
    onChange({
      ...range,
      label: preset.label,
    })
    setShowCustom(false)
  }

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return

    const start = new Date(customStart)
    start.setHours(0, 0, 0, 0)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59, 999)

    onChange({
      start,
      end,
      label: 'Custom range',
    })
    setShowCustom(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              value.label === preset.label
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-neu-base text-text-secondary hover:bg-neu-light hover:text-text-primary shadow-neu'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${
            value.label === 'Custom range'
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-neu-base text-text-secondary hover:bg-neu-light hover:text-text-primary shadow-neu'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Custom
        </button>
      </div>

      {showCustom && (
        <Card variant="raised" padding="md" className="mt-2">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-neu-dark rounded-lg bg-neu-base text-text-primary focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-neu-dark rounded-lg bg-neu-base text-text-primary focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </Card>
      )}

      <div className="text-xs text-text-secondary">
        {value.start.toLocaleDateString()} - {value.end.toLocaleDateString()}
      </div>
    </div>
  )
}
