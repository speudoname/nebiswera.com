/**
 * Call-to-Action Configuration Component
 *
 * Manages button text, URL, and description for CTA interactions
 * Also used by SPECIAL_OFFER type
 */

'use client'

import { Input } from '@/components/ui/Input'

interface CTAConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function CTAConfig({ config, onChange }: CTAConfigProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Button Text"
        value={(config.buttonText as string) || ''}
        onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
        placeholder="e.g., Learn More"
      />
      <Input
        label="Button URL"
        value={(config.buttonUrl as string) || ''}
        onChange={(e) => onChange({ ...config, buttonUrl: e.target.value })}
        placeholder="https://..."
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
