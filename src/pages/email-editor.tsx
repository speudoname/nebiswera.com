// This is a Pages Router page (not App Router) - works better for isolated editor
import { useRef, useEffect, useState } from 'react'
import { EmailEditor, EmailEditorProvider } from 'easy-email-editor'
import { StandardLayout } from 'easy-email-extensions'
import { AdvancedType } from 'easy-email-core'
import type { ExtensionProps } from 'easy-email-extensions'

// Import CSS
import 'easy-email-editor/lib/style.css'
import 'easy-email-extensions/lib/style.css'
import '@arco-themes/react-easy-email-theme/css/arco.css'

// Block categories for the editor
const categories: ExtensionProps['categories'] = [
  {
    label: 'Content',
    active: true,
    blocks: [
      { type: AdvancedType.TEXT },
      { type: AdvancedType.IMAGE },
      { type: AdvancedType.BUTTON },
      { type: AdvancedType.DIVIDER },
      { type: AdvancedType.SPACER },
      { type: AdvancedType.NAVBAR },
      { type: AdvancedType.SOCIAL },
    ],
  },
  {
    label: 'Layout',
    active: true,
    displayType: 'column',
    blocks: [
      { title: '1 column', payload: [['100%']] },
      { title: '2 columns', payload: [['50%', '50%'], ['33%', '67%'], ['67%', '33%']] },
      { title: '3 columns', payload: [['33.33%', '33.33%', '33.33%']] },
      { title: '4 columns', payload: [['25%', '25%', '25%', '25%']] },
    ],
  },
]

// Default template
const defaultTemplate = {
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
        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
        data: { value: { noWrap: false } },
        attributes: {
          padding: '20px 0px',
          'background-color': '#ffffff',
        },
        children: [
          {
            type: 'advanced_column',
            data: { value: {} },
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

function htmlToPlainText(html: string): string {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
  return text.trim()
}

export default function EmailEditorPage() {
  const [initialData, setInitialData] = useState(defaultTemplate)
  const valuesRef = useRef<any>(null)

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: only accept messages from same origin
      if (event.origin !== window.location.origin) return

      const { type, payload } = event.data

      if (type === 'LOAD_TEMPLATE') {
        // Load template into editor
        setInitialData(payload || defaultTemplate)
      } else if (type === 'GET_DESIGN') {
        // Export current design
        exportDesign()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const exportDesign = async () => {
    if (!valuesRef.current) {
      window.parent.postMessage(
        {
          type: 'DESIGN_ERROR',
          payload: { error: 'Editor not ready' },
        },
        window.location.origin
      )
      return
    }

    try {
      const values = valuesRef.current

      // Convert JSON to MJML
      const { JsonToMjml } = await import('easy-email-core')
      const mjml = JsonToMjml(values.content)

      // Convert MJML to HTML
      const mjmlTransform = (await import('mjml-browser')).default
      const { html } = mjmlTransform(mjml, {
        beautify: true,
        validationLevel: 'soft',
      })

      // Auto-generate plain text from HTML
      const text = htmlToPlainText(html)

      // Send back to parent
      window.parent.postMessage(
        {
          type: 'DESIGN_EXPORTED',
          payload: {
            design: values,
            html: html,
            text: text,
          },
        },
        window.location.origin
      )
    } catch (error) {
      console.error('Failed to export design:', error)
      window.parent.postMessage(
        {
          type: 'DESIGN_ERROR',
          payload: { error: (error as Error).message },
        },
        window.location.origin
      )
    }
  }

  // Notify parent that editor is ready
  useEffect(() => {
    window.parent.postMessage(
      {
        type: 'EDITOR_READY',
      },
      window.location.origin
    )
  }, [])

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <EmailEditorProvider
        data={initialData}
        height={'100vh'}
        autoComplete
        dashed={false}
      >
        {({ values }) => {
          valuesRef.current = values
          return (
            <StandardLayout categories={categories} showSourceCode={false}>
              <EmailEditor />
            </StandardLayout>
          )
        }}
      </EmailEditorProvider>
    </div>
  )
}
