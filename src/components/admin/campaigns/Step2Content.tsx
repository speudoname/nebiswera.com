'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { FileText, Copy, FileImage, Save, Eye, Code } from 'lucide-react'
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

const MJML_SNIPPETS = [
  {
    label: 'Button',
    code: `<mj-button background-color="#8B5CF6" href="https://example.com">
  Click Here
</mj-button>`,
  },
  {
    label: 'Image',
    code: `<mj-image src="https://via.placeholder.com/600x200" alt="Image description" />`,
  },
  {
    label: 'Divider',
    code: `<mj-divider border-color="#E0E0E0" border-width="1px" />`,
  },
  {
    label: 'Social',
    code: `<mj-social font-size="15px" icon-size="30px" mode="horizontal">
  <mj-social-element name="facebook" href="https://facebook.com/" />
  <mj-social-element name="twitter" href="https://twitter.com/" />
  <mj-social-element name="instagram" href="https://instagram.com/" />
</mj-social>`,
  },
]

export function Step2Content({ data, onUpdate }: Step2ContentProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'text'>('editor')
  const [saving, setSaving] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const emailEditorRef = useRef<EmailEditorRef>(null)

  // Save MJML and compile to HTML
  const handleSaveFromEditor = async () => {
    if (!emailEditorRef.current?.exportHtml) return

    setSaving(true)
    try {
      const { design, html, text } = await emailEditorRef.current.exportHtml()

      // Ensure unsubscribe link is present
      const hasUnsubscribeLink = html.includes('{{{ pm:unsubscribe }}}') || html.includes('{{unsubscribe}}')

      if (!hasUnsubscribeLink) {
        const htmlWithUnsubscribe = html.replace(
          '</body>',
          '<div style="text-align:center;padding:20px;font-size:12px;color:#666;"><a href="{{{ pm:unsubscribe }}}" style="color:#8B5CF6;">Unsubscribe</a></div></body>'
        )
        const textWithUnsubscribe = text + '\n\nUnsubscribe: {{{ pm:unsubscribe }}}'

        onUpdate({
          designJson: design, // MJML code
          htmlContent: htmlWithUnsubscribe,
          textContent: textWithUnsubscribe,
        })
      } else {
        onUpdate({
          designJson: design, // MJML code
          htmlContent: html,
          textContent: text,
        })
      }
    } catch (error) {
      console.error('Failed to export from editor:', error)
      alert(`Failed to compile MJML: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    // Load template HTML - user can then convert to MJML or edit
    onUpdate({
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      designJson: null, // Clear MJML when loading HTML template
      ...(template.suggestedSubject && !data.subject ? { subject: template.suggestedSubject } : {}),
      ...(template.suggestedPreviewText && !data.previewText ? { previewText: template.suggestedPreviewText } : {}),
    })
  }

  const insertSnippet = (snippet: typeof MJML_SNIPPETS[0]) => {
    if (!emailEditorRef.current) return
    const currentMjml = emailEditorRef.current.getMjml()
    // Insert before closing </mj-column> tag
    const insertPosition = currentMjml.lastIndexOf('</mj-column>')
    if (insertPosition !== -1) {
      const newMjml =
        currentMjml.slice(0, insertPosition) +
        '\n        ' + snippet.code + '\n        ' +
        currentMjml.slice(insertPosition)
      emailEditorRef.current.setMjml(newMjml)
    }
  }

  const generatePlainText = () => {
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
            Design your email with MJML code
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
              Compile & Save
            </Button>
          )}
        </div>
      </div>

      {/* Variable Reference Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📝 Personalization Variables</h3>
        <p className="text-xs text-blue-800 mb-2">
          Type these variables directly in your MJML content to personalize for each recipient:
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

      {/* MJML Snippets Panel */}
      {activeTab === 'editor' && (
        <div className="bg-purple-50 border border-purple-200 rounded-neu p-4">
          <h3 className="text-sm font-medium text-purple-900 mb-2">⚡ MJML Snippets</h3>
          <div className="flex flex-wrap gap-2">
            {MJML_SNIPPETS.map((snippet) => (
              <Button
                key={snippet.label}
                variant="ghost"
                size="sm"
                onClick={() => insertSnippet(snippet)}
              >
                <Code className="w-3 h-3 mr-1" />
                {snippet.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Tabs */}
      <div>
        <div className="flex items-center gap-4 border-b border-neu-dark mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Eye className="w-4 h-4" />
            MJML Editor
          </button>
          <button
            type="button"
            onClick={async () => {
              // Auto-save and generate plain text when switching tabs
              await handleSaveFromEditor()
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
              initialMjml={typeof data.designJson === 'string' ? data.designJson : undefined}
              onReady={() => {
                console.log('MJML editor ready')
              }}
            />
            <p className="text-xs text-text-muted mt-3">
              💡 Click "Compile & Save" to convert MJML to HTML before moving to the next step
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-body-sm font-medium text-secondary">
                Plain Text Version * (Auto-generated from HTML)
              </label>
              {data.htmlContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generatePlainText}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Regenerate from HTML
                </Button>
              )}
            </div>
            <textarea
              id="textContent"
              value={data.textContent}
              onChange={(e) => onUpdate({ textContent: e.target.value })}
              rows={20}
              placeholder="Plain text will be auto-generated when you compile and save the MJML..."
              className="block w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none font-mono"
              required
            />
            <p className="text-xs text-text-muted mt-2">
              This is automatically generated from your HTML. You can edit it manually if needed. Plain text version is for email clients that don't support HTML.
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">✏️ MJML Tips</h3>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• MJML is a responsive email framework - your emails will look great on all devices</li>
          <li>• Use the snippets above to quickly add common elements</li>
          <li>• Personalization variables work inside any MJML text element</li>
          <li>• Unsubscribe link is automatically added if missing</li>
          <li>• Learn more at <a href="https://mjml.io/documentation/" target="_blank" rel="noopener" className="underline">mjml.io</a></li>
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
