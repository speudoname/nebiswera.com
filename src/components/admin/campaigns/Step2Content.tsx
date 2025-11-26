'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { FileText, Copy, FileImage, Save, Eye } from 'lucide-react'
import { CampaignData } from './CampaignEditor'
import { TemplatePicker } from './TemplatePicker'
import type { EmailTemplate } from '@/lib/email-templates'
import { EmailEditorWrapper, type EmailEditorRef } from './EmailEditorWrapper'

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
  const [activeTab, setActiveTab] = useState<'editor' | 'text'>('editor')
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const emailEditorRef = useRef<EmailEditorRef>(null)

  // Auto-save from editor when switching tabs or on interval
  const handleSaveFromEditor = async () => {
    if (!emailEditorRef.current?.exportHtml) return

    setSaving(true)
    try {
      const { design, html, text } = await emailEditorRef.current.exportHtml()

      // Ensure unsubscribe link is present
      const hasUnsubscribeLink = html.includes('{{{ pm:unsubscribe }}}') || html.includes('{{unsubscribe}}')

      if (!hasUnsubscribeLink) {
        // Append unsubscribe link at the end
        const htmlWithUnsubscribe = html.replace('</body>', '<footer style="text-align:center;padding:20px;font-size:12px;color:#666;"><a href="{{{ pm:unsubscribe }}}">Unsubscribe</a></footer></body>')
        const textWithUnsubscribe = text + '\n\nUnsubscribe: {{{ pm:unsubscribe }}}'

        onUpdate({
          designJson: design,
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
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    // Load template HTML into Easy Email editor
    // Since Easy Email expects design JSON (MJML structure), we'll load the HTML as raw content
    // Users can then edit it in the visual editor
    onUpdate({
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      designJson: null, // Clear design JSON when loading raw HTML template
      ...(template.suggestedSubject && !data.subject ? { subject: template.suggestedSubject } : {}),
      ...(template.suggestedPreviewText && !data.previewText ? { previewText: template.suggestedPreviewText } : {}),
    })
  }

  const insertVariable = (variable: string) => {
    // For now, show a tooltip telling users to use the editor's text tool
    alert(`To insert ${variable}, use the text block in the visual editor and type it directly. Variables like {{firstName}} will be replaced when sending.`)
  }

  const generatePlainText = () => {
    // Simple HTML to text conversion
    const text = data.htmlContent
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
    onUpdate({ textContent: text })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Email Content</h2>
          <p className="text-text-muted">
            Design your email with the visual editor
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
          {activeTab === 'editor' && (
            <Button
              variant="primary"
              onClick={handleSaveFromEditor}
              loading={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Design
            </Button>
          )}
        </div>
      </div>

      {/* Variable Reference Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📝 Personalization Variables</h3>
        <p className="text-xs text-blue-800 mb-2">
          Type these variables directly in your email content to personalize for each recipient:
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
            {'{{{ pm:unsubscribe }}}'} (Required)
          </code>
        </div>
      </div>

      {/* Editor Tabs */}
      <div>
        <div className="flex items-center gap-4 border-b border-neu-dark mb-4">
          <button
            type="button"
            onClick={() => {
              handleSaveFromEditor()
              setActiveTab('editor')
            }}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visual Editor
          </button>
          <button
            type="button"
            onClick={() => {
              handleSaveFromEditor()
              setActiveTab('text')
            }}
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

        {activeTab === 'editor' ? (
          <div>
            <EmailEditorWrapper
              ref={emailEditorRef}
              designJson={data.designJson}
              onReady={() => {
                // If we have HTML but no design, user can start editing HTML
                if (data.htmlContent && !data.designJson) {
                  console.log('Loaded existing HTML content')
                }
              }}
            />
            <p className="text-xs text-text-muted mt-3">
              💡 Click "Save Design" to export your design before moving to the next step
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

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">✏️ Content Tips</h3>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Unsubscribe link is automatically added if missing</li>
          <li>• Use personalization variables in text blocks (e.g., Hi {`{{firstName}}`}!)</li>
          <li>• Click "Save Design" before moving to next step</li>
          <li>• Design once, send to thousands - all personalized!</li>
          <li>• Mobile-responsive design is built-in</li>
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
