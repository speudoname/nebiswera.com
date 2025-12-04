/**
 * Download Configuration Component
 *
 * Manages download URL, file name, and description
 */

'use client'

import { Input } from '@/components/ui/Input'

interface DownloadConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function DownloadConfig({ config, onChange }: DownloadConfigProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Download URL"
        value={(config.downloadUrl as string) || ''}
        onChange={(e) => onChange({ ...config, downloadUrl: e.target.value })}
        placeholder="https://..."
      />
      <Input
        label="File Name"
        value={(config.fileName as string) || ''}
        onChange={(e) => onChange({ ...config, fileName: e.target.value })}
        placeholder="e.g., Cheatsheet.pdf"
      />
      <Input
        label="Description (optional)"
        value={(config.description as string) || ''}
        onChange={(e) => onChange({ ...config, description: e.target.value })}
        placeholder="Brief description..."
      />
    </div>
  )
}
