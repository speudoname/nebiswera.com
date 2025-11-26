'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { FileText, Copy, FileImage, Save, Eye, Code, Type } from 'lucide-react'
import { CampaignData } from './CampaignEditor'
import { TemplatePicker } from './TemplatePicker'
import type { EmailTemplate } from '@/lib/email-templates'
import { EmailEditorWrapper, type EmailEditorRef } from './EmailEditorWrapper'
import { TipTapEditor, type TipTapEditorRef } from './TipTapEditor'
import { wrapHtmlInMJML } from '@/lib/tiptap-to-mjml'

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
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual')
  const [activeTab, setActiveTab] = useState<'editor' | 'text'>('editor')
  const [saving, setSaving] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const visualEditorRef = useRef<TipTapEditorRef>(null)
  const codeEditorRef = useRef<EmailEditorRef>(null)

  // Save from editor
  const handleSaveFromEditor = async () => {
    const editorRef = editorMode === 'visual' ? visualEditorRef.current : codeEditorRef.current
    if (!editorRef?.exportHtml) return

    setSaving(true)
    try {
      if (editorMode === 'visual') {
        // TipTap editor - wrap HTML in MJML and compile
        const { design, html, text } = await editorRef.exportHtml()
        const mjmlCode = wrapHtmlInMJML(html)

        // Compile MJML to final HTML
        const mjml = (await import('mjml-browser')).default
        const result = mjml(mjmlCode, {
          validationLevel: 'soft',
          minify: false,
        })

        if (result.errors && result.errors.length > 0) {
          const errorMsg = result.errors[0].message
          throw new Error(errorMsg)
        }

        onUpdate({
          designJson: design, // Store TipTap HTML
          htmlContent: result.html, // Final compiled email HTML
          textContent: text,
        })
      } else {
        // Code editor - MJML code
        const { design, html, text } = await editorRef.exportHtml()

        // Ensure unsubscribe link is present
        const hasUnsubscribeLink = html.includes('{{{ pm:unsubscribe }}}') || html.includes('{{unsubscribe}}')

        if (!hasUnsubscribeLink) {
          const htmlWithUnsubscribe = html.replace(
            '</body>',
            '<div style="text-align:center;padding:20px;font-size:12px;color:#666;"><a href="{{{ pm:unsubscribe }}}" style="color:#8B5CF6;">Unsubscribe</a></div></body>'
          )
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

  // Get initial content for TipTap editor
  const initialTipTapContent = data.designJson ? (typeof data.designJson === 'string' ? data.designJson : '') : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Email Content</h2>
          <p className="text-text-muted">
            {editorMode === 'visual' ? 'Write your email with rich text formatting' : 'Write MJML code directly'}
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
              {editorMode === 'visual' ? 'Save & Compile' : 'Compile & Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Variable Reference Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📝 Personalization Variables</h3>
        <p className="text-xs text-blue-800 mb-2">
          {editorMode === 'visual'
            ? 'Type these variables in your content to personalize for each recipient:'
            : 'Use these variables in your MJML code:'}
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
          {/* Editor Mode Toggle */}
          <div className="flex items-center gap-2 border-r border-neu-dark pr-4 mr-2">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                editorMode === 'visual'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Type className="w-4 h-4" />
              Visual
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('code')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                editorMode === 'code'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Code className="w-4 h-4" />
              Code
            </button>
          </div>

          {/* Content Tabs */}
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
            {editorMode === 'visual' ? 'Rich Text Editor' : 'MJML Editor'}
          </button>
          <button
            type="button"
            onClick={async () => {
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
            {editorMode === 'visual' ? (
              <>
                <TipTapEditor
                  ref={visualEditorRef}
                  initialContent={initialTipTapContent}
                  onReady={() => console.log('TipTap editor ready')}
                />
                <p className="text-xs text-text-muted mt-3">
                  💡 Use toolbar buttons for formatting, add images and links, click "Save & Compile" when done
                </p>
              </>
            ) : (
              <>
                <EmailEditorWrapper
                  ref={codeEditorRef}
                  initialMjml={typeof data.designJson === 'string' ? data.designJson : undefined}
                  onReady={() => console.log('Code editor ready')}
                />
                <p className="text-xs text-text-muted mt-3">
                  💡 Click "Compile & Save" to convert MJML to HTML before moving to the next step
                </p>
              </>
            )}
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
              placeholder="Plain text will be auto-generated when you compile and save..."
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
        <h3 className="text-sm font-medium text-yellow-900 mb-2">✏️ Email Editor Tips</h3>
        <ul className="text-xs text-yellow-800 space-y-1">
          {editorMode === 'visual' ? (
            <>
              <li>• Use toolbar buttons for text formatting (bold, italic, underline, etc.)</li>
              <li>• Add headings, lists, links, images, and dividers</li>
              <li>• Change text alignment and colors</li>
              <li>• Undo/Redo available in the toolbar</li>
              <li>• Type personalization variables directly (they'll work in the final email)</li>
              <li>• Click "Save & Compile" to convert to email-safe HTML</li>
            </>
          ) : (
            <>
              <li>• MJML is a responsive email framework</li>
              <li>• Your emails will look great on all devices</li>
              <li>• Personalization variables work inside any MJML text element</li>
              <li>• Learn more at <a href="https://mjml.io/documentation/" target="_blank" rel="noopener" className="underline">mjml.io</a></li>
            </>
          )}
          <li>• Unsubscribe link is automatically added</li>
          <li>• Switch between Visual and Code modes anytime</li>
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
