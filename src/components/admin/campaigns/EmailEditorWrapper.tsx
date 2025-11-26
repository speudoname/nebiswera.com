'use client'

import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react'

interface EmailEditorWrapperProps {
  designJson?: any
  onReady?: () => void
  onChange?: (design: any, html: string, text: string) => void
}

export const EmailEditorWrapper = forwardRef<any, EmailEditorWrapperProps>(
  ({ designJson, onReady, onChange }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [isReady, setIsReady] = useState(false)
    const pendingDesign = useRef<any>(null)

    // Listen for messages from iframe
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Security: only accept messages from same origin
        if (event.origin !== window.location.origin) return

        const { type, payload } = event.data

        switch (type) {
          case 'EDITOR_READY':
            setIsReady(true)
            // Load initial design if provided
            if (designJson && iframeRef.current) {
              iframeRef.current.contentWindow?.postMessage(
                { type: 'LOAD_TEMPLATE', payload: designJson },
                window.location.origin
              )
            }
            onReady?.()
            break

          case 'DESIGN_EXPORTED':
            const { design, html, text } = payload
            onChange?.(design, html, text)
            break

          case 'DESIGN_ERROR':
            console.error('Email editor error:', payload.error)
            break
        }
      }

      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }, [designJson, onReady, onChange])

    // Expose exportHtml method to parent via ref
    useImperativeHandle(ref, () => ({
      exportHtml: async () => {
        return new Promise((resolve, reject) => {
          if (!isReady || !iframeRef.current) {
            reject(new Error('Editor not ready'))
            return
          }

          // Set up one-time listener for the response
          const handleResponse = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return

            const { type, payload } = event.data

            if (type === 'DESIGN_EXPORTED') {
              window.removeEventListener('message', handleResponse)
              resolve(payload)
            } else if (type === 'DESIGN_ERROR') {
              window.removeEventListener('message', handleResponse)
              reject(new Error(payload.error))
            }
          }

          window.addEventListener('message', handleResponse)

          // Request design export from iframe
          iframeRef.current.contentWindow?.postMessage(
            { type: 'GET_DESIGN' },
            window.location.origin
          )

          // Timeout after 5 seconds
          setTimeout(() => {
            window.removeEventListener('message', handleResponse)
            reject(new Error('Export timeout'))
          }, 5000)
        })
      },
    }))

    // Load template when designJson changes
    useEffect(() => {
      if (isReady && designJson && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          { type: 'LOAD_TEMPLATE', payload: designJson },
          window.location.origin
        )
      }
    }, [designJson, isReady])

    return (
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        {!isReady && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <div style={{ color: '#666' }}>Loading email editor...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/email-editor"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '8px',
            display: isReady ? 'block' : 'none',
          }}
          title="Email Editor"
        />
      </div>
    )
  }
)

EmailEditorWrapper.displayName = 'EmailEditorWrapper'

// Export the exportHtml method type for parent components
export type EmailEditorRef = {
  exportHtml: () => Promise<{ design: any; html: string; text: string }>
}
