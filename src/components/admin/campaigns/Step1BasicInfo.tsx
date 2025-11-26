'use client'

import { Input } from '@/components/ui'
import { CampaignData } from './CampaignEditor'

interface Step1BasicInfoProps {
  data: CampaignData
  onUpdate: (updates: Partial<CampaignData>) => void
}

export function Step1BasicInfo({ data, onUpdate }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Basic Information</h2>
        <p className="text-text-muted">
          Set up the fundamental details of your email campaign
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            id="name"
            name="name"
            label="Campaign Name *"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., February Newsletter"
            required
          />
          <p className="text-xs text-text-muted mt-1">
            Internal name for your reference (not visible to recipients)
          </p>
        </div>

        <div>
          <Input
            id="subject"
            name="subject"
            label="Email Subject *"
            value={data.subject}
            onChange={(e) => onUpdate({ subject: e.target.value })}
            placeholder="e.g., New Georgian Language Workshop This Month"
            required
          />
          <p className="text-xs text-text-muted mt-1">
            Keep it under 50 characters for best open rates
          </p>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-secondary mb-1">
            Preview Text
          </label>
          <textarea
            value={data.previewText}
            onChange={(e) => onUpdate({ previewText: e.target.value })}
            rows={2}
            placeholder="This preview text appears in the inbox..."
            className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
          />
          <p className="text-xs text-text-muted mt-1">
            Optional preview snippet shown in email clients (40-90 characters recommended)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="fromName"
            name="fromName"
            label="From Name *"
            value={data.fromName}
            onChange={(e) => onUpdate({ fromName: e.target.value })}
            placeholder="Nebiswera"
            required
          />

          <div>
            <label className="block text-body-sm font-medium text-secondary mb-1">
              From Email *
            </label>
            <select
              value={data.fromEmail}
              onChange={(e) => onUpdate({ fromEmail: e.target.value })}
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              required
            >
              <option value="hello@nebiswera.ge">hello@nebiswera.ge</option>
              <option value="info@nebiswera.ge">info@nebiswera.ge</option>
              <option value="team@nebiswera.ge">team@nebiswera.ge</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              Must be a verified sender in Postmark
            </p>
          </div>
        </div>

        <div>
          <Input
            id="replyTo"
            name="replyTo"
            label="Reply-To Email"
            type="email"
            value={data.replyTo}
            onChange={(e) => onUpdate({ replyTo: e.target.value })}
            placeholder="hello@nebiswera.ge"
          />
          <p className="text-xs text-text-muted mt-1">
            Where replies should go (defaults to From Email)
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📧 Email Best Practices</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Subject lines under 50 characters have higher open rates</li>
          <li>• Preview text should complement, not repeat, your subject line</li>
          <li>• Use a recognizable from name to build trust</li>
          <li>• Test your subject lines before sending</li>
        </ul>
      </div>
    </div>
  )
}
