/**
 * SpecificDatesSection Component
 *
 * Manages a list of specific dates and times for webinar sessions
 */

'use client'

import { Card, Button } from '@/components/ui'
import { Plus, X } from 'lucide-react'

interface SpecificDatesSectionProps {
  specificDates: string[]
  onDatesChange: (dates: string[]) => void
}

export function SpecificDatesSection({
  specificDates,
  onDatesChange,
}: SpecificDatesSectionProps) {
  const addSpecificDate = () => {
    const today = new Date().toISOString().split('T')[0]
    if (!specificDates.includes(today)) {
      onDatesChange([...specificDates, today].sort())
    }
  }

  const updateSpecificDate = (index: number, value: string) => {
    onDatesChange(specificDates.map((d, i) => (i === index ? value : d)).sort())
  }

  const removeSpecificDate = (index: number) => {
    onDatesChange(specificDates.filter((_, i) => i !== index))
  }

  return (
    <Card variant="raised" padding="lg">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Specific Dates & Times</h3>

      <div className="space-y-3 mb-4">
        {specificDates.map((date, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => updateSpecificDate(index, e.target.value)}
              className="flex-1 rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSpecificDate(index)}
              className="p-2 text-text-muted hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={addSpecificDate}>
        <Plus className="w-4 h-4 mr-1" />
        Add date
      </Button>
    </Card>
  )
}
