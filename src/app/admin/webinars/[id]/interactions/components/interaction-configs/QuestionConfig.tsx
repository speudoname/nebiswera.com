/**
 * Question Configuration Component
 *
 * Simple description textarea for QUESTION and TIP interactions
 */

'use client'

interface QuestionConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function QuestionConfig({ config, onChange }: QuestionConfigProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
      <textarea
        value={(config.description as string) || ''}
        onChange={(e) => onChange({ ...config, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        rows={3}
        placeholder="Enter the content..."
      />
    </div>
  )
}
