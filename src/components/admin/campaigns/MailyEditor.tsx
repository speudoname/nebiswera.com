'use client'

import '@maily-to/core/style.css'
import { Editor } from '@maily-to/core'
import { render } from '@maily-to/render'
import { forwardRef, useImperativeHandle, useState, useCallback } from 'react'
import type { Editor as TiptapEditor } from '@tiptap/core'

interface MailyEditorProps {
  initialContent?: string
  onReady?: () => void
}

export interface MailyEditorRef {
  exportHtml: () => Promise<{ design: string; html: string; text: string }>
  getContent: () => string
  setContent: (content: string) => void
}

export const MailyEditor = forwardRef<MailyEditorRef, MailyEditorProps>(
  ({ initialContent, onReady }, ref) => {
    const [editor, setEditor] = useState<TiptapEditor | null>(null)

    const handleEditorReady = useCallback((editorInstance: TiptapEditor) => {
      setEditor(editorInstance)
      if (initialContent) {
        try {
          editorInstance.commands.setContent(JSON.parse(initialContent))
        } catch (e) {
          // If not JSON, treat as HTML
          editorInstance.commands.setContent(initialContent)
        }
      }
      onReady?.()
    }, [initialContent, onReady])

    useImperativeHandle(ref, () => ({
      exportHtml: async () => {
        if (!editor) {
          return { design: '', html: '', text: '' }
        }

        // Get JSON content for storage
        const json = editor.getJSON()
        const design = JSON.stringify(json)

        // Render to HTML
        const html = await render(json)

        // Get plain text
        const text = editor.getText()

        return {
          design,
          html,
          text,
        }
      },
      getContent: () => {
        if (!editor) return ''
        return JSON.stringify(editor.getJSON())
      },
      setContent: (content: string) => {
        if (!editor) return
        try {
          const parsed = JSON.parse(content)
          editor.commands.setContent(parsed)
        } catch (e) {
          editor.commands.setContent(content)
        }
      },
    }), [editor])

    return (
      <div className="maily-editor-wrapper border border-neu-dark rounded-neu overflow-hidden">
        <Editor
          onCreate={handleEditorReady}
          onUpdate={setEditor}
        />
      </div>
    )
  }
)

MailyEditor.displayName = 'MailyEditor'
