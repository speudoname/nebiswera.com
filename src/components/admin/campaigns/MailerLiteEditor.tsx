'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react'
import { ButtonNode } from './tiptap-nodes/ButtonNode'
import { ImageUploadNode } from './tiptap-nodes/ImageUploadNode'
import { DividerNode } from './tiptap-nodes/DividerNode'
import { SpacerNode } from './tiptap-nodes/SpacerNode'
import { FloatingInsertMenu } from './FloatingInsertMenu'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Plus,
} from 'lucide-react'

interface MailerLiteEditorProps {
  initialContent?: string
  onReady?: () => void
}

export interface MailerLiteEditorRef {
  exportHtml: () => Promise<{ design: string; html: string; text: string }>
  getContent: () => string
  setContent: (content: string) => void
}

export const MailerLiteEditor = forwardRef<MailerLiteEditorRef, MailerLiteEditorProps>(
  ({ initialContent, onReady }, ref) => {
    const [showInsertMenu, setShowInsertMenu] = useState(false)
    const [insertMenuPosition, setInsertMenuPosition] = useState({ top: 0, left: 0 })
    const [selectedNode, setSelectedNode] = useState<any>(null)

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2],
          },
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            style: 'color: #8B5CF6; text-decoration: underline;',
          },
        }),
        Placeholder.configure({
          placeholder: 'Start writing your email...',
        }),
        Color,
        TextStyle,
        ButtonNode,
        ImageUploadNode,
        DividerNode,
        SpacerNode,
      ],
      content: initialContent || '<p></p>',
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-8 py-6',
        },
      },
      onUpdate: ({ editor }) => {
        // Track selection for properties panel
        const { from, to } = editor.state.selection
        const node = editor.state.doc.nodeAt(from)
        setSelectedNode(node)
      },
    })

    useEffect(() => {
      if (editor && onReady) {
        onReady()
      }
    }, [editor, onReady])

    useImperativeHandle(ref, () => ({
      exportHtml: async () => {
        const html = editor?.getHTML() || ''
        const text = editor?.getText() || ''
        return {
          design: html,
          html,
          text,
        }
      },
      getContent: () => editor?.getHTML() || '',
      setContent: (content: string) => {
        editor?.commands.setContent(content)
      },
    }))

    const handleInsertComponent = useCallback((type: string) => {
      if (!editor) return

      switch (type) {
        case 'text':
          editor.chain().focus().insertContent('<p></p>').run()
          break
        case 'button':
          editor.chain().focus().setButton({
            text: 'Click here',
            url: 'https://example.com',
            backgroundColor: '#8B5CF6',
            textColor: '#FFFFFF',
          }).run()
          break
        case 'image':
          editor.chain().focus().setImageUpload({}).run()
          break
        case 'divider':
          editor.chain().focus().setDivider().run()
          break
        case 'spacer':
          editor.chain().focus().setSpacer().run()
          break
      }
    }, [editor])

    const addLink = () => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor?.chain().focus().setLink({ href: url }).run()
      }
    }

    const setColor = () => {
      const color = window.prompt('Enter color (e.g., #FF0000 or red):')
      if (color) {
        editor?.chain().focus().setColor(color).run()
      }
    }

    if (!editor) {
      return <div className="animate-pulse bg-neu-base h-[400px] rounded-neu" />
    }

    return (
      <div className="relative">
        {/* Simplified Toolbar */}
        <div className="border-b border-neu-dark bg-neu-base p-2 flex flex-wrap gap-1 sticky top-0 z-10">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-neu-dark pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              icon={<Bold className="w-4 h-4" />}
              title="Bold"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              icon={<Italic className="w-4 h-4" />}
              title="Italic"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              icon={<UnderlineIcon className="w-4 h-4" />}
              title="Underline"
            />
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-neu-dark pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              icon={<Heading1 className="w-4 h-4" />}
              title="Heading 1"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              icon={<Heading2 className="w-4 h-4" />}
              title="Heading 2"
            />
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-neu-dark pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              icon={<AlignLeft className="w-4 h-4" />}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              icon={<AlignCenter className="w-4 h-4" />}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              icon={<AlignRight className="w-4 h-4" />}
              title="Align Right"
            />
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-neu-dark pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              icon={<List className="w-4 h-4" />}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              icon={<ListOrdered className="w-4 h-4" />}
              title="Numbered List"
            />
          </div>

          {/* Insert */}
          <div className="flex gap-1 border-r border-neu-dark pr-2">
            <ToolbarButton
              onClick={addLink}
              active={editor.isActive('link')}
              icon={<LinkIcon className="w-4 h-4" />}
              title="Add Link"
            />
            <ToolbarButton
              onClick={setColor}
              icon={<span className="w-4 h-4 flex items-center justify-center text-xs font-bold">A</span>}
              title="Text Color"
            />
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              icon={<Undo className="w-4 h-4" />}
              title="Undo"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              icon={<Redo className="w-4 h-4" />}
              title="Redo"
            />
          </div>
        </div>

        {/* Editor with insert button */}
        <div className="bg-white border border-neu-dark rounded-b-neu relative">
          {/* Floating Insert Button */}
          <div className="absolute left-2 top-6 z-20">
            <button
              type="button"
              onClick={() => setShowInsertMenu(!showInsertMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 shadow-lg transition-colors"
              title="Insert component"
            >
              <Plus className="w-4 h-4" />
            </button>
            {showInsertMenu && (
              <div className="absolute left-10 top-0 bg-white rounded-lg shadow-xl border border-neu-dark p-2 min-w-[240px]">
                <div className="space-y-1">
                  {[
                    { type: 'button', label: 'Button', desc: 'Add CTA button' },
                    { type: 'image', label: 'Image', desc: 'Upload image' },
                    { type: 'divider', label: 'Divider', desc: 'Add line' },
                    { type: 'spacer', label: 'Spacer', desc: 'Add space' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        handleInsertComponent(item.type)
                        setShowInsertMenu(false)
                      }}
                      className="w-full flex flex-col items-start p-2 rounded hover:bg-neu-light transition-colors text-left"
                    >
                      <div className="text-sm font-medium text-text-primary">{item.label}</div>
                      <div className="text-xs text-text-muted">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <EditorContent editor={editor} className="bg-white" />
        </div>
      </div>
    )
  }
)

MailerLiteEditor.displayName = 'MailerLiteEditor'

// Toolbar Button Component
function ToolbarButton({
  onClick,
  active,
  disabled,
  icon,
  title,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  icon: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700'
          : 'hover:bg-neu-light text-text-secondary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {icon}
    </button>
  )
}
