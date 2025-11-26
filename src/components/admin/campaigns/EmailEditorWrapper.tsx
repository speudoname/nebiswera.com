'use client'

import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Easy Email Editor to avoid SSR issues
const EmailEditor = dynamic(
  () => import('easy-email-editor').then((mod) => mod.EmailEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-neu-base rounded-neu">
        <div className="text-text-muted">Loading email editor...</div>
      </div>
    ),
  }
)

const EmailEditorProvider = dynamic(
  () => import('easy-email-editor').then((mod) => mod.EmailEditorProvider),
  { ssr: false }
)

interface EmailEditorWrapperProps {
  designJson?: any
  onReady?: () => void
  onChange?: (design: any, html: string, text: string) => void
}

export const EmailEditorWrapper = forwardRef<any, EmailEditorWrapperProps>(
  ({ designJson, onReady, onChange }, ref) => {
    const valuesRef = useRef<any>(null)

    // Expose exportHtml method to parent via ref
    useImperativeHandle(ref, () => ({
      exportHtml: async () => {
        if (!valuesRef.current) {
          throw new Error('Editor not ready')
        }

        try {
          // Get the current values from the ref
          const values = valuesRef.current

          // Convert JSON to MJML
          const JsonToMjmlFunc = (await import('easy-email-core')).JsonToMjml
          const mjml = JsonToMjmlFunc(values.content)

          // Convert MJML to HTML
          const mjmlTransform = (await import('mjml-browser')).default
          const { html } = mjmlTransform(mjml, {
            beautify: true,
            validationLevel: 'soft',
          })

          // Auto-generate plain text from HTML
          const text = htmlToPlainText(html)

          return {
            design: values,
            html: html,
            text: text,
          }
        } catch (error) {
          console.error('Failed to export from Easy Email:', error)
          throw error
        }
      },
    }))

    // Call onReady after a short delay to ensure editor is mounted
    useEffect(() => {
      const timer = setTimeout(() => {
        onReady?.()
      }, 1000)
      return () => clearTimeout(timer)
    }, [onReady])

    // Default MJML template for new campaigns
    const defaultTemplate = designJson || {
      subject: '',
      subTitle: '',
      content: {
        type: 'page',
        data: {
          value: {
            breakpoint: '480px',
            headAttributes: '',
            'font-size': '14px',
            'line-height': '1.7',
            headStyles: [],
            fonts: [],
            responsive: true,
            'font-family':
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'text-color': '#000000',
          },
        },
        attributes: {
          'background-color': '#efeeea',
          width: '600px',
        },
        children: [
          {
            type: 'advanced_section',
            data: {
              value: {
                noWrap: false,
              },
            },
            attributes: {
              padding: '20px 0px',
              'background-color': '#ffffff',
            },
            children: [
              {
                type: 'advanced_column',
                data: {
                  value: {},
                },
                attributes: {
                  padding: '0px 20px',
                  border: 'none',
                  'vertical-align': 'top',
                },
                children: [
                  {
                    type: 'advanced_text',
                    data: {
                      value: {
                        content:
                          '<h1 style="text-align: center;">Welcome!</h1><p style="text-align: center;">Start designing your email campaign here.</p><p style="text-align: center;">You can add images, buttons, and more using the tools on the left.</p>',
                      },
                    },
                    attributes: {
                      padding: '10px 25px',
                      align: 'left',
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    }

    return (
      <div className="w-full min-h-[600px] border-2 border-neu-dark rounded-neu">
        <div className="p-4 bg-blue-100 text-blue-900">
          Debug: EmailEditorWrapper is rendering
        </div>
        <EmailEditorProvider
          data={defaultTemplate}
          height={'600px'}
          autoComplete
          dashed={false}
        >
          {({ values }) => {
            // Store the latest values in the ref so exportHtml can access them
            valuesRef.current = values
            console.log('EmailEditorProvider render, values:', values)
            return (
              <div>
                <div className="p-2 bg-green-100 text-green-900">
                  Debug: EmailEditor about to render
                </div>
                <EmailEditor />
              </div>
            )
          }}
        </EmailEditorProvider>
      </div>
    )
  }
)

EmailEditorWrapper.displayName = 'EmailEditorWrapper'

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
  exportHtml: () => Promise<{ design: any; html: string; text: string }>
}
