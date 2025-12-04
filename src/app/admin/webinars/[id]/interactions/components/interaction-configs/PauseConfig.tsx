/**
 * Pause Configuration Component
 *
 * Manages pause message and auto-resume duration
 */

'use client'

import { Input } from '@/components/ui/Input'

interface PauseConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function PauseConfig({ config, onChange }: PauseConfigProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Pause Message"
        value={(config.message as string) || ''}
        onChange={(e) => onChange({ ...config, message: e.target.value })}
        placeholder="e.g., Take a moment to reflect..."
      />
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Auto-resume after (seconds)
        </label>
        <input
          type="number"
          min="0"
          value={(config.autoResume as number) || 0}
          onChange={(e) => onChange({ ...config, autoResume: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="0 = manual resume"
        />
        <p className="text-xs text-text-muted mt-1">
          Set to 0 for manual resume, or enter seconds for automatic resume
        </p>
      </div>
    </div>
  )
}
