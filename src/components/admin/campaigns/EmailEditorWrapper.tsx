'use client'

import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import EmailEditor to avoid SSR issues
const EmailEditor = dynamic(() => import('react-email-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-neu-base rounded-neu">
      <div className="text-text-muted">Loading email editor...</div>
    </div>
  ),
})

interface EmailEditorWrapperProps {
  designJson?: any
  onReady?: () => void
  onChange?: (design: any, html: string, text: string) => void
}

export function EmailEditorWrapper({
  designJson,
  onReady,
  onChange,
}: EmailEditorWrapperProps) {
  const emailEditorRef = useRef<any>(null)

  // Load design when editor is ready
  useEffect(() => {
    if (emailEditorRef.current?.editor && designJson) {
      emailEditorRef.current.editor.loadDesign(designJson)
    }
  }, [designJson])

  const handleLoad = () => {
    console.log('Email editor loaded')
    if (designJson && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign(designJson)
    }
    onReady?.()
  }

  // Method to export HTML and design
  const exportHtml = (): Promise<{ design: any; html: string; text: string }> => {
    return new Promise((resolve, reject) => {
      if (!emailEditorRef.current?.editor) {
        reject(new Error('Editor not ready'))
        return
      }

      emailEditorRef.current.editor.exportHtml((data: any) => {
        const { design, html } = data

        // Auto-generate plain text from HTML
        const text = htmlToPlainText(html)

        resolve({ design, html, text })
      })
    })
  }

  // Expose exportHtml method to parent via ref
  useEffect(() => {
    if (emailEditorRef.current) {
      emailEditorRef.current.exportHtml = exportHtml
    }
  }, [])

  return (
    <div className="w-full h-[600px]">
      <EmailEditor
        ref={emailEditorRef}
        onLoad={handleLoad}
        options={{
          displayMode: 'email',
          appearance: {
            theme: 'light',
          },
          features: {
            preview: true,
            undoRedo: true,
          },
          tools: {
            // Enable commonly used tools
            text: { enabled: true },
            image: { enabled: true },
            button: { enabled: true },
            divider: { enabled: true },
            html: { enabled: true },
            video: { enabled: true },
            social: { enabled: true },
          },
        }}
      />
    </div>
  )
}

// Utility function to convert HTML to plain text
function htmlToPlainText(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Replace <br> and </p> with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Remove excessive whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
  text = text.trim()

  return text
}

// Export the exportHtml method type for parent components
export type EmailEditorRef = {
  editor: any
  exportHtml: () => Promise<{ design: any; html: string; text: string }>
}
