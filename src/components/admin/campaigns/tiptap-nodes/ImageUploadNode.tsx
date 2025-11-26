import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useCallback, useRef } from 'react'
import { Upload, Link as LinkIcon, X } from 'lucide-react'

export interface ImageUploadOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUploadNode: {
      setImageUpload: (options: { src?: string; alt?: string; width?: string; link?: string }) => ReturnType
    }
  }
}

export const ImageUploadNode = Node.create<ImageUploadOptions>({
  name: 'imageUploadNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      width: {
        default: '100%',
      },
      link: {
        default: '',
      },
      align: {
        default: 'center',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload-node"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload-node' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadComponent)
  },

  addCommands() {
    return {
      setImageUpload:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

function ImageUploadComponent({ node, updateAttributes, deleteNode, selected }: any) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        // Create FormData for upload
        const formData = new FormData()
        formData.append('file', file)

        // Upload to your API endpoint
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')

        const data = await response.json()
        updateAttributes({ src: data.url, alt: file.name })
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload image')
      } finally {
        setUploading(false)
      }
    },
    [updateAttributes]
  )

  const handleUrlInput = useCallback(() => {
    const url = prompt('Enter image URL:')
    if (url) {
      updateAttributes({ src: url })
    }
  }, [updateAttributes])

  if (!node.attrs.src) {
    return (
      <NodeViewWrapper className="image-upload-node-wrapper">
        <div className={`my-4 ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}>
          <div className="border-2 border-dashed border-neu-dark rounded-neu p-8 bg-neu-base">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-neu hover:bg-primary-600 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <button
                  type="button"
                  onClick={handleUrlInput}
                  className="flex items-center gap-2 px-4 py-2 border border-neu-dark rounded-neu hover:bg-neu-light"
                >
                  <LinkIcon className="w-4 h-4" />
                  URL
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-text-muted">Upload an image or paste a URL</p>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  const imgElement = (
    <img
      src={node.attrs.src}
      alt={node.attrs.alt}
      style={{ width: node.attrs.width, maxWidth: '100%', height: 'auto' }}
      className="rounded"
    />
  )

  return (
    <NodeViewWrapper className="image-upload-node-wrapper">
      <div
        className={`my-4 relative group ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
        style={{ textAlign: node.attrs.align }}
      >
        {node.attrs.link ? (
          <a href={node.attrs.link} target="_blank" rel="noopener noreferrer">
            {imgElement}
          </a>
        ) : (
          imgElement
        )}
      </div>
    </NodeViewWrapper>
  )
}
