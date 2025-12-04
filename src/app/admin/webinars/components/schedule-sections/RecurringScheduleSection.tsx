/**
 * RecurringScheduleSection Component
 *
 * Handles weekly recurring schedule configuration with day and time selection
 */

'use client'

import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { Clock, Plus, X } from 'lucide-react'

const DAYS = [
  { value: 0, label: 'Sun', shortLabel: 'S' },
  { value: 1, label: 'Mon', shortLabel: 'M' },
  { value: 2, label: 'Tue', shortLabel: 'T' },
  { value: 3, label: 'Wed', shortLabel: 'W' },
  { value: 4, label: 'Thu', shortLabel: 'T' },
  { value: 5, label: 'Fri', shortLabel: 'F' },
  { value: 6, label: 'Sat', shortLabel: 'S' },
]

interface RecurringScheduleSectionProps {
  recurringDays: number[]
  recurringTimes: string[]
  webinarTimezone: string
  onDaysChange: (days: number[]) => void
  onTimesChange: (times: string[]) => void
}

export function RecurringScheduleSection({
  recurringDays,
  recurringTimes,
  webinarTimezone,
  onDaysChange,
  onTimesChange,
}: RecurringScheduleSectionProps) {
  const [newTime, setNewTime] = useState('10:00')

  const toggleDay = (day: number) => {
    onDaysChange(
      recurringDays.includes(day)
        ? recurringDays.filter((d) => d !== day)
        : [...recurringDays, day].sort((a, b) => a - b)
    )
  }

  const addTime = () => {
    if (newTime && !recurringTimes.includes(newTime)) {
      onTimesChange([...recurringTimes, newTime].sort())
    }
  }

  const removeTime = (time: string) => {
    onTimesChange(recurringTimes.filter((t) => t !== time))
  }

  return (
    <Card variant="raised" padding="lg">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Weekly Schedule</h3>

      {/* Days */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-3">Days</label>
        <div className="flex gap-2">
          {DAYS.map((day) => {
            const isSelected = recurringDays.includes(day.value)
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-primary-500 text-white shadow-neu-pressed'
                    : 'bg-neu-base text-text-primary shadow-neu hover:shadow-neu-hover'
                }`}
              >
                {day.shortLabel}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-text-muted mt-2">
          Selected: {recurringDays.map((d) => DAYS[d].label).join(', ') || 'None'}
        </p>
      </div>

      {/* Times */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Times ({webinarTimezone})
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {recurringTimes.map((time) => (
            <div
              key={time}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              <Clock className="w-3 h-3" />
              {time}
              <button
                type="button"
                onClick={() => removeTime(time)}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addTime}>
            <Plus className="w-4 h-4 mr-1" />
            Add time
          </Button>
        </div>
      </div>
    </Card>
  )
}
