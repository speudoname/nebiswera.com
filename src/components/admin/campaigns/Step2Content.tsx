'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { Save, FileImage } from 'lucide-react'
import { CampaignData } from './CampaignEditor'
import { TemplatePicker } from './TemplatePicker'
import type { EmailTemplate } from '@/lib/email-templates'
import { MailyEditor, type MailyEditorRef } from './MailyEditor'

interface Step2ContentProps {
  data: CampaignData
  onUpdate: (updates: Partial<CampaignData>) => void
}

const VARIABLES = [
  { key: '{{email}}', label: 'Email', description: 'Recipient email address' },
  { key: '{{firstName}}', label: 'First Name', description: 'With fallback: {{firstName|there}}' },
  { key: '{{lastName}}', label: 'Last Name', description: 'With fallback: {{lastName|Friend}}' },
  { key: '{{fullName}}', label: 'Full Name', description: 'firstName + lastName or email' },
]

export function Step2Content({ data, onUpdate }: Step2ContentProps) {
  const [saving, setSaving] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const editorRef = useRef<MailyEditorRef>(null)

  // Save from Maily.to editor
  const handleSaveFromEditor = async () => {
    if (!editorRef.current?.exportHtml) return

    setSaving(true)
    try {
      // Maily.to already renders to responsive HTML
      const { design, html, text } = await editorRef.current.exportHtml()

      // Ensure unsubscribe link is present
      const hasUnsubscribeLink = html.includes('{{{ pm:unsubscribe }}}') || html.includes('{{unsubscribe}}')

      if (!hasUnsubscribeLink) {
        const htmlWithUnsubscribe = html.replace(
          '</body>',
          '<div style="text-align:center;padding:20px;font-size:12px;color:#666;"><a href="{{{ pm:unsubscribe }}}" style="color:#8B5CF6;">Unsubscribe</a></div></body>'
        )
        const textWithUnsubscribe = text + '\n\nUnsubscribe: {{{ pm:unsubscribe }}}'

        onUpdate({
          designJson: design, // Store Maily.to JSON
          htmlContent: htmlWithUnsubscribe,
          textContent: textWithUnsubscribe,
        })
      } else {
        onUpdate({
          designJson: design,
          htmlContent: html,
          textContent: text,
        })
      }
    } catch (error) {
      console.error('Failed to export from editor:', error)
      alert(`Failed to compile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    onUpdate({
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      designJson: null,
      ...(template.suggestedSubject && !data.subject ? { subject: template.suggestedSubject } : {}),
      ...(template.suggestedPreviewText && !data.previewText ? { previewText: template.suggestedPreviewText } : {}),
    })
  }

  // Get initial content for Maily.to editor
  const initialMailyContent = data.designJson ? (typeof data.designJson === 'string' ? data.designJson : '') : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Email Content</h2>
          <p className="text-text-muted">
            Design your email with our visual editor
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowTemplatePicker(true)}
          >
            <FileImage className="w-4 h-4 mr-2" />
            Choose Template
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveFromEditor}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Compile
          </Button>
        </div>
      </div>

      {/* Variable Reference Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📝 Personalization Variables</h3>
        <p className="text-xs text-blue-800 mb-2">
          Type these variables in your content to personalize for each recipient:
        </p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <code
              key={v.key}
              className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-xs font-mono"
              title={v.description}
            >
              {v.key}
            </code>
          ))}
          <code className="px-2 py-1 bg-red-100 text-red-900 rounded text-xs font-mono">
            {'{{{ pm:unsubscribe }}}'} (Auto-added)
          </code>
        </div>
      </div>

      {/* Maily.to Editor */}
      <div className="bg-white rounded-neu border-2 border-neu-dark overflow-hidden">
        <MailyEditor
          ref={editorRef}
          initialContent={initialMailyContent}
          onReady={() => console.log('Maily editor ready')}
        />
      </div>
      <p className="text-xs text-text-muted">
        💡 Use the toolbar to format text and insert email components (buttons, images, dividers, etc.)
      </p>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">✏️ Email Editor Tips</h3>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Use the toolbar to insert buttons, images, dividers, and other email components</li>
          <li>• Format text with bold, italic, headings, colors, alignment, and lists</li>
          <li>• Type personalization variables directly ({{'{'}firstName{'}'}}, {{'{'}email{'}'}}, etc.)</li>
          <li>• Click on components to edit their properties (links, colors, spacing, etc.)</li>
          <li>• Maily.to uses modern email framework for responsive, email-safe HTML</li>
          <li>• Plain text version is automatically generated from your content</li>
          <li>• Unsubscribe link is automatically added to comply with regulations</li>
          <li>• Click "Save & Compile" before moving to the next step</li>
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
