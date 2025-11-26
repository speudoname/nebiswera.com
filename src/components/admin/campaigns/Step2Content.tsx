'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Code, FileText, Eye, Copy, FileImage } from 'lucide-react'
import { CampaignData } from './CampaignEditor'
import { TemplatePicker } from './TemplatePicker'
import type { EmailTemplate } from '@/lib/email-templates'

interface Step2ContentProps {
  data: CampaignData
  onUpdate: (updates: Partial<CampaignData>) => void
}

const VARIABLES = [
  { key: '{{email}}', label: 'Email', description: 'Recipient email address' },
  { key: '{{firstName}}', label: 'First Name', description: 'With fallback: {{firstName|there}}' },
  { key: '{{lastName}}', label: 'Last Name', description: 'With fallback: {{lastName|Friend}}' },
  { key: '{{fullName}}', label: 'Full Name', description: 'firstName + lastName or email' },
  { key: '{{{ pm:unsubscribe }}}', label: 'Unsubscribe Link', description: 'Required for CAN-SPAM compliance' },
]

export function Step2Content({ data, onUpdate }: Step2ContentProps) {
  const [activeTab, setActiveTab] = useState<'html' | 'text'>('html')
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  const handleTemplateSelect = (template: EmailTemplate) => {
    onUpdate({
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      ...(template.suggestedSubject && !data.subject ? { subject: template.suggestedSubject } : {}),
      ...(template.suggestedPreviewText && !data.previewText ? { previewText: template.suggestedPreviewText } : {}),
    })
  }

  const insertVariable = (variable: string) => {
    if (activeTab === 'html') {
      const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = data.htmlContent
        const newText = text.substring(0, start) + variable + text.substring(end)
        onUpdate({ htmlContent: newText })

        // Set cursor position after inserted variable
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + variable.length, start + variable.length)
        }, 0)
      }
    } else {
      const textarea = document.getElementById('textContent') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = data.textContent
        const newText = text.substring(0, start) + variable + text.substring(end)
        onUpdate({ textContent: newText })

        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + variable.length, start + variable.length)
        }, 0)
      }
    }
  }

  const generatePlainText = () => {
    // Simple HTML to text conversion
    const text = data.htmlContent
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s\s+/g, ' ')
      .trim()
    onUpdate({ textContent: text })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Email Content</h2>
          <p className="text-text-muted">
            Craft your email content using HTML and plain text
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowTemplatePicker(true)}
        >
          <FileImage className="w-4 h-4 mr-2" />
          Choose Template
        </Button>
      </div>

      {/* Variable Insertion Panel */}
      <div className="bg-neu-base rounded-neu p-4 border-2 border-neu-dark">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-primary">Available Variables</h3>
          <span className="text-xs text-text-muted">Click to insert</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="group relative px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-neu text-xs font-mono transition-colors"
              title={v.description}
            >
              {v.label}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {v.key}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Tabs */}
      <div>
        <div className="flex items-center justify-between border-b border-neu-dark mb-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'html'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Code className="w-4 h-4" />
              HTML Version
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'text'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              Plain Text Version
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>

        {activeTab === 'html' ? (
          <div>
            <label className="block text-body-sm font-medium text-secondary mb-2">
              HTML Content *
            </label>
            <textarea
              id="htmlContent"
              value={data.htmlContent}
              onChange={(e) => onUpdate({ htmlContent: e.target.value })}
              rows={20}
              placeholder="<html>
<body>
  <h1>Hello {{firstName|there}}!</h1>
  <p>Your email content here...</p>

  <footer>
    <a href='{{{ pm:unsubscribe }}}'>Unsubscribe</a>
  </footer>
</body>
</html>"
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none font-mono"
              required
            />
            <p className="text-xs text-text-muted mt-2">
              ⚠️ Must include unsubscribe link: <code className="bg-neu-base px-1 rounded">{'{{{ pm:unsubscribe }}}'}</code>
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-body-sm font-medium text-secondary">
                Plain Text Version *
              </label>
              {data.htmlContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generatePlainText}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Generate from HTML
                </Button>
              )}
            </div>
            <textarea
              id="textContent"
              value={data.textContent}
              onChange={(e) => onUpdate({ textContent: e.target.value })}
              rows={20}
              placeholder="Hello {{firstName|there}}!

Your plain text email content here...

Unsubscribe: {{{ pm:unsubscribe }}}"
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none font-mono"
              required
            />
            <p className="text-xs text-text-muted mt-2">
              Plain text version for email clients that don't support HTML
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-white border-2 border-neu-dark rounded-neu p-6">
          <h3 className="text-sm font-medium text-text-primary mb-4">Preview (HTML)</h3>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: data.htmlContent }}
          />
        </div>
      )}

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">✏️ Content Tips</h3>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Always include an unsubscribe link (required by law)</li>
          <li>• Use variables to personalize content (e.g., Hi {`{{firstName}}`}!)</li>
          <li>• Keep your content concise and scannable</li>
          <li>• Test your email on different devices before sending</li>
          <li>• Add alt text to images for accessibility</li>
        </ul>
      </div>

      {/* Template Picker Modal */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  )
}
