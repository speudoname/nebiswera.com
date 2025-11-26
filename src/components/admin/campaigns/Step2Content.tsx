'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import { Save, AlertCircle } from 'lucide-react'
import { CampaignData } from './CampaignEditor'
import { MailyEditor, type MailyEditorRef } from './MailyEditor'

interface Step2ContentProps {
  data: CampaignData
  onUpdate: (updates: Partial<CampaignData>) => void
  campaignId?: string
}

const VARIABLES = [
  { key: '{{email}}', label: 'Email', description: 'Recipient email address' },
  { key: '{{firstName}}', label: 'First Name', description: 'With fallback: {{firstName|there}}' },
  { key: '{{lastName}}', label: 'Last Name', description: 'With fallback: {{lastName|Friend}}' },
  { key: '{{fullName}}', label: 'Full Name', description: 'firstName + lastName or email' },
]

// localStorage key for auto-save
const getAutoSaveKey = (campaignId?: string) =>
  `campaign-content-${campaignId || 'new'}`

export function Step2Content({ data, onUpdate, campaignId }: Step2ContentProps) {
  const [saving, setSaving] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const editorRef = useRef<MailyEditorRef>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem(getAutoSaveKey(campaignId))
    if (savedContent && !data.designJson) {
      try {
        const parsed = JSON.parse(savedContent)
        if (editorRef.current && parsed.designJson) {
          editorRef.current.setContent(parsed.designJson)
        }
      } catch (e) {
        console.error('Failed to load auto-saved content:', e)
      }
    }
  }, [campaignId, data.designJson])

  // Auto-save to localStorage
  const handleAutoSave = () => {
    if (!editorRef.current) return

    setAutoSaveStatus('saving')
    const content = editorRef.current.getContent()

    try {
      localStorage.setItem(getAutoSaveKey(campaignId), JSON.stringify({
        designJson: content,
        timestamp: new Date().toISOString(),
      }))
      setAutoSaveStatus('saved')
    } catch (e) {
      console.error('Failed to auto-save:', e)
      setAutoSaveStatus('unsaved')
    }
  }

  // Trigger auto-save with debounce
  const triggerAutoSave = () => {
    setAutoSaveStatus('unsaved')
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    autoSaveTimeoutRef.current = setTimeout(handleAutoSave, 2000)
  }

  // Save to database
  const handleSaveToDatabase = async () => {
    if (!editorRef.current?.exportHtml) return

    setSaving(true)
    try {
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

      // Clear localStorage after successful save
      localStorage.removeItem(getAutoSaveKey(campaignId))
      setAutoSaveStatus('saved')
    } catch (error) {
      console.error('Failed to export from editor:', error)
      alert(`Failed to compile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  // Get initial content for Maily.to editor
  const initialMailyContent = data.designJson ? (typeof data.designJson === 'string' ? data.designJson : JSON.stringify(data.designJson)) : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Email Content</h2>
          <p className="text-text-muted">
            Design your email with the visual editor
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save status */}
          <div className="text-sm text-text-muted flex items-center gap-2">
            {autoSaveStatus === 'saved' && (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Auto-saved</span>
              </>
            )}
            {autoSaveStatus === 'saving' && (
              <>
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                <span>Saving...</span>
              </>
            )}
            {autoSaveStatus === 'unsaved' && (
              <>
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span>Unsaved changes</span>
              </>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSaveToDatabase}
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

      {/* Maily.to Editor with better styling */}
      <div className="bg-white rounded-neu border-2 border-neu-dark shadow-neu overflow-hidden">
        <div className="p-4 bg-neu-base border-b-2 border-neu-dark">
          <p className="text-sm text-text-muted flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Changes are auto-saved every 2 seconds. Click &quot;Save & Compile&quot; to finalize and generate HTML.
          </p>
        </div>
        <div className="h-[600px] overflow-auto">
          <MailyEditor
            ref={editorRef}
            initialContent={initialMailyContent}
            onReady={() => {
              console.log('Maily editor ready')
              setAutoSaveStatus('saved')
            }}
            onChange={triggerAutoSave}
          />
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-neu p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">✏️ Email Editor Tips</h3>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• Use the toolbar to insert buttons, images, dividers, and other email components</li>
          <li>• Format text with bold, italic, headings, colors, alignment, and lists</li>
          <li>• Type personalization variables directly (<code>{'{{firstName}}'}</code>, <code>{'{{email}}'}</code>, etc.)</li>
          <li>• Click on components to edit their properties (links, colors, spacing, etc.)</li>
          <li>• Content is auto-saved to browser storage - you won&apos;t lose your work on refresh</li>
          <li>• Plain text version is automatically generated from your content</li>
          <li>• Unsubscribe link is automatically added to comply with regulations</li>
          <li>• Click &quot;Save & Compile&quot; before moving to the next step</li>
        </ul>
      </div>
    </div>
  )
}
