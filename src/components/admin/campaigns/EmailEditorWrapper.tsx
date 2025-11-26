'use client'

import { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Monaco } from '@monaco-editor/react'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-neu-base">
      <div className="text-text-muted">Loading editor...</div>
    </div>
  ),
})

interface EmailEditorWrapperProps {
  initialMjml?: string
  onReady?: () => void
}

export const EmailEditorWrapper = forwardRef<any, EmailEditorWrapperProps>(
  ({ initialMjml, onReady }, ref) => {
    const [mjmlCode, setMjmlCode] = useState(initialMjml || getDefaultMjml())
    const [htmlPreview, setHtmlPreview] = useState('')
    const [compileError, setCompileError] = useState<string | null>(null)
    const [isCompiling, setIsCompiling] = useState(false)

    // Compile MJML to HTML for preview
    const compileMjml = async (code: string) => {
      if (!code.trim()) {
        setHtmlPreview('')
        setCompileError(null)
        return
      }

      setIsCompiling(true)
      try {
        const mjml = (await import('mjml-browser')).default
        const result = mjml(code, {
          validationLevel: 'soft',
          minify: false,
        })

        if (result.errors && result.errors.length > 0) {
          const errorMsg = result.errors
            .map((e: any) => `Line ${e.line}: ${e.message}`)
            .join('\n')
          setCompileError(errorMsg)
          setHtmlPreview(result.html) // Still show HTML even with errors
        } else {
          setCompileError(null)
          setHtmlPreview(result.html)
        }
      } catch (error) {
        setCompileError(error instanceof Error ? error.message : 'Failed to compile MJML')
        setHtmlPreview('')
      } finally {
        setIsCompiling(false)
      }
    }

    // Debounced compilation
    useEffect(() => {
      const timer = setTimeout(() => {
        compileMjml(mjmlCode)
      }, 500) // 500ms debounce

      return () => clearTimeout(timer)
    }, [mjmlCode])

    // Initial compilation
    useEffect(() => {
      compileMjml(mjmlCode)
      onReady?.()
    }, [])

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      exportHtml: async () => {
        try {
          const mjml = (await import('mjml-browser')).default
          const result = mjml(mjmlCode, {
            validationLevel: 'soft',
            minify: false,
          })

          if (result.errors && result.errors.length > 0) {
            const errorMsg = result.errors[0].message
            throw new Error(errorMsg)
          }

          // Generate plain text from HTML
          const text = result.html
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

          return {
            design: mjmlCode, // Store MJML code as design
            html: result.html,
            text,
          }
        } catch (error) {
          console.error('Failed to compile MJML:', error)
          throw error
        }
      },
      getMjml: () => mjmlCode,
      setMjml: (code: string) => setMjmlCode(code),
    }))

    return (
      <div className="w-full h-[600px] flex gap-4">
        {/* Left: MJML Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-text-primary">MJML Code</h3>
            {isCompiling && (
              <span className="text-xs text-text-muted">Compiling...</span>
            )}
          </div>
          <div className="flex-1 border rounded-neu overflow-hidden shadow-neu-inset">
            <MonacoEditor
              height="100%"
              defaultLanguage="xml"
              value={mjmlCode}
              onChange={(value) => setMjmlCode(value || '')}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                wrappingIndent: 'indent',
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
          {compileError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-neu">
              <div className="text-xs font-medium text-red-900 mb-1">MJML Errors:</div>
              <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                {compileError}
              </pre>
            </div>
          )}
        </div>

        {/* Right: HTML Preview */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-text-primary mb-2">Live Preview</h3>
          <div className="flex-1 border rounded-neu overflow-auto bg-white shadow-neu">
            {htmlPreview ? (
              <iframe
                srcDoc={htmlPreview}
                className="w-full h-full border-0"
                title="Email Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Preview will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

EmailEditorWrapper.displayName = 'EmailEditorWrapper'

// Export the ref type for parent components
export type EmailEditorRef = {
  exportHtml: () => Promise<{ design: any; html: string; text: string }>
  getMjml: () => string
  setMjml: (code: string) => void
}

// Default MJML template
function getDefaultMjml() {
  return `<mjml>
  <mj-head>
    <mj-title>Email Template</mj-title>
    <mj-preview>Preview text here</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="14px" color="#333333" line-height="1.6" />
      <mj-section padding="20px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold" align="center">
          Hello {{firstName|there}}!
        </mj-text>
        <mj-text>
          This is your email content. You can personalize it with variables like {{firstName}}, {{lastName}}, or {{email}}.
        </mj-text>
        <mj-button background-color="#8B5CF6" href="https://nebiswera.com">
          Call to Action
        </mj-button>
      </mj-column>
    </mj-section>

    <mj-section background-color="#f9f9f9">
      <mj-column>
        <mj-text font-size="12px" color="#666666" align="center">
          <a href="{{{ pm:unsubscribe }}}" style="color:#8B5CF6">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}
