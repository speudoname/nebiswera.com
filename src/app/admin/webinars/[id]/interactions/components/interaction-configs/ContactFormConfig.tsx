/**
 * Contact Form Configuration Component
 *
 * Manages additional fields to collect and success message
 */

'use client'

import { Input } from '@/components/ui/Input'

interface ContactFormConfigProps {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function ContactFormConfig({ config, onChange }: ContactFormConfigProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Contact forms collect name and email by default.
      </p>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={(config.collectPhone as boolean) || false}
            onChange={(e) => onChange({ ...config, collectPhone: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Collect phone number</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={(config.collectCompany as boolean) || false}
            onChange={(e) => onChange({ ...config, collectCompany: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Collect company name</span>
        </label>
      </div>
      <Input
        label="Success Message (optional)"
        value={(config.successMessage as string) || ''}
        onChange={(e) => onChange({ ...config, successMessage: e.target.value })}
        placeholder="Thanks! We'll be in touch soon."
      />
    </div>
  )
}
