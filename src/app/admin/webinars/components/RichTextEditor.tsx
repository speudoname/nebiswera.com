'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui'
import { Bold, Italic, Palette, Plus, Trash2, Type, Code, Eye } from 'lucide-react'

// Rich text part type (matches the one in templates/types.ts)
export interface RichTextPart {
  text: string
  bold?: boolean
  italic?: boolean
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'white' | string
}

interface RichTextEditorProps {
  label: string
  value: RichTextPart[] | null
  plainValue: string | null  // Plain text fallback
  onChange: (parts: RichTextPart[] | null) => void
  onPlainChange?: (text: string) => void
  placeholder?: string
  primaryColor?: string
}

type EditorMode = 'visual' | 'markdown' | 'preview'

const COLOR_OPTIONS = [
  { value: 'default', label: 'Default', preview: '#2D1B4E' },
  { value: 'primary', label: 'Primary', preview: '#8B5CF6' },
  { value: 'secondary', label: 'Secondary', preview: '#5B4478' },
  { value: 'muted', label: 'Muted', preview: '#9CA3AF' },
  { value: 'white', label: 'White', preview: '#FFFFFF' },
]

/**
 * Rich Text Editor with 3 modes: Visual, Markdown, Preview
 * Visual mode: Add/edit parts with individual styling
 * Markdown mode: Quick syntax like **bold**, *italic*, {{primary:text}}
 * Preview mode: See how it will look
 */
export function RichTextEditor({
  label,
  value,
  plainValue,
  onChange,
  onPlainChange,
  placeholder = 'Enter text...',
  primaryColor = '#8B5CF6',
}: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>('visual')
  const [markdownText, setMarkdownText] = useState(() => richTextToMarkdown(value) || plainValue || '')

  // Get parts or convert from plain text
  const parts = value || (plainValue ? [{ text: plainValue }] : [])

  // Add a new part
  const addPart = () => {
    const newParts = [...parts, { text: '' }]
    onChange(newParts)
  }

  // Update a specific part
  const updatePart = (index: number, updates: Partial<RichTextPart>) => {
    const newParts = parts.map((part, i) =>
      i === index ? { ...part, ...updates } : part
    )
    onChange(newParts)
  }

  // Remove a part
  const removePart = (index: number) => {
    const newParts = parts.filter((_, i) => i !== index)
    onChange(newParts.length > 0 ? newParts : null)
  }

  // Handle markdown text change
  const handleMarkdownChange = (text: string) => {
    setMarkdownText(text)
    const parsed = parseMarkdownToRichText(text)
    onChange(parsed.length > 0 ? parsed : null)
    if (onPlainChange) {
      onPlainChange(richTextToPlain(parsed))
    }
  }

  // Sync markdown when switching modes
  const handleModeChange = (newMode: EditorMode) => {
    if (newMode === 'markdown') {
      setMarkdownText(richTextToMarkdown(value) || richTextToPlain(value) || plainValue || '')
    }
    setMode(newMode)
  }

  // Get display color
  const getDisplayColor = (color?: string) => {
    if (!color || color === 'default') return '#2D1B4E'
    const found = COLOR_OPTIONS.find(c => c.value === color)
    if (found) return found.preview
    if (color.startsWith('#')) return color
    return '#2D1B4E'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text-primary">{label}</label>

        {/* Mode Tabs */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleModeChange('visual')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              mode === 'visual'
                ? 'bg-primary-500 text-white'
                : 'bg-neu-base text-text-muted hover:bg-neu-dark'
            }`}
          >
            <Type className="w-3 h-3" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('markdown')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              mode === 'markdown'
                ? 'bg-primary-500 text-white'
                : 'bg-neu-base text-text-muted hover:bg-neu-dark'
            }`}
          >
            <Code className="w-3 h-3" />
            Markdown
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('preview')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              mode === 'preview'
                ? 'bg-primary-500 text-white'
                : 'bg-neu-base text-text-muted hover:bg-neu-dark'
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Visual Mode */}
      {mode === 'visual' && (
        <div className="space-y-2">
          {parts.length === 0 ? (
            <div className="text-sm text-text-muted italic p-3 bg-neu-base rounded-neu">
              No text parts. Click "Add Part" to start.
            </div>
          ) : (
            parts.map((part, index) => (
              <div key={index} className="flex gap-2 items-start p-3 bg-neu-base rounded-neu">
                {/* Text Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={part.text}
                    onChange={(e) => updatePart(index, { text: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-neu shadow-neu-inset-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    style={{
                      fontWeight: part.bold ? 'bold' : 'normal',
                      fontStyle: part.italic ? 'italic' : 'normal',
                      color: getDisplayColor(part.color),
                    }}
                  />
                </div>

                {/* Style Buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => updatePart(index, { bold: !part.bold })}
                    className={`p-2 rounded transition-colors ${
                      part.bold
                        ? 'bg-primary-500 text-white'
                        : 'bg-white shadow-neu-sm hover:bg-neu-light'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePart(index, { italic: !part.italic })}
                    className={`p-2 rounded transition-colors ${
                      part.italic
                        ? 'bg-primary-500 text-white'
                        : 'bg-white shadow-neu-sm hover:bg-neu-light'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  {/* Color Dropdown */}
                  <select
                    value={part.color || 'default'}
                    onChange={(e) => updatePart(index, { color: e.target.value as any })}
                    className="px-2 py-1 rounded bg-white shadow-neu-sm text-xs"
                    title="Color"
                  >
                    {COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removePart(index)}
                    className="p-2 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            type="button"
            onClick={addPart}
            className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-neu transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Part
          </button>
        </div>
      )}

      {/* Markdown Mode */}
      {mode === 'markdown' && (
        <div className="space-y-2">
          <textarea
            value={markdownText}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder={`${placeholder}

Syntax:
**bold text**
*italic text*
{{primary:colored text}}
{{#FF5733:custom color}}`}
            className="w-full px-3 py-2 rounded-neu shadow-neu-inset-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm font-mono min-h-[120px] resize-y"
          />
          <p className="text-xs text-text-muted">
            Use **bold**, *italic*, {`{{primary:text}}`} or {`{{#HEX:text}}`} for styling
          </p>
        </div>
      )}

      {/* Preview Mode */}
      {mode === 'preview' && (
        <div className="p-4 bg-neu-base rounded-neu min-h-[80px]">
          {parts.length === 0 ? (
            <span className="text-text-muted italic">{placeholder}</span>
          ) : (
            <span className="text-lg">
              {parts.map((part, index) => (
                <span
                  key={index}
                  style={{
                    fontWeight: part.bold ? 'bold' : 'normal',
                    fontStyle: part.italic ? 'italic' : 'normal',
                    color: getDisplayColor(part.color),
                  }}
                >
                  {part.text}
                </span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Utility functions
function parseMarkdownToRichText(text: string): RichTextPart[] {
  if (!text) return []

  const parts: RichTextPart[] = []
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\{\{[^}]+:[^}]+\}\})/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) })
    }

    const matched = match[0]

    if (matched.startsWith('**') && matched.endsWith('**')) {
      parts.push({ text: matched.slice(2, -2), bold: true })
    } else if (matched.startsWith('*') && matched.endsWith('*')) {
      parts.push({ text: matched.slice(1, -1), italic: true })
    } else if (matched.startsWith('{{') && matched.endsWith('}}')) {
      const inner = matched.slice(2, -2)
      const colonIndex = inner.indexOf(':')
      if (colonIndex > 0) {
        const color = inner.slice(0, colonIndex)
        const colorText = inner.slice(colonIndex + 1)
        parts.push({ text: colorText, color })
      }
    }

    lastIndex = match.index + matched.length
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) })
  }

  return parts
}

function richTextToPlain(parts: RichTextPart[] | null): string {
  if (!parts || parts.length === 0) return ''
  return parts.map(p => p.text).join('')
}

function richTextToMarkdown(parts: RichTextPart[] | null): string {
  if (!parts || parts.length === 0) return ''

  return parts.map(part => {
    let text = part.text

    if (part.color && part.color !== 'default') {
      text = `{{${part.color}:${text}}}`
    }
    if (part.italic) {
      text = `*${text}*`
    }
    if (part.bold) {
      text = `**${text}**`
    }

    return text
  }).join('')
}
