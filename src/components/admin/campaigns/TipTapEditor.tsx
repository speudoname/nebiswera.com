'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import { forwardRef, useImperativeHandle, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Quote,
  Minus,
  Undo,
  Redo,
} from 'lucide-react'

interface TipTapEditorProps {
  initialContent?: string
  onReady?: () => void
}

export interface TipTapEditorRef {
  exportHtml: () => Promise<{ design: string; html: string; text: string }>
  getContent: () => string
  setContent: (content: string) => void
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  ({ initialContent, onReady }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
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
        Image.configure({
          HTMLAttributes: {
            style: 'max-width: 100%; height: auto;',
          },
        }),
        Placeholder.configure({
          placeholder: 'Start typing your email content... Type / for commands',
        }),
        Color,
        TextStyle,
      ],
      content: initialContent || '',
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3',
        },
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

        // Generate plain text
        const text = editor?.getText() || ''

        return {
          design: html, // Store the HTML as design
          html,
          text,
        }
      },
      getContent: () => editor?.getHTML() || '',
      setContent: (content: string) => {
        editor?.commands.setContent(content)
      },
    }))

    if (!editor) {
      return <div className="animate-pulse bg-neu-base h-[400px] rounded-neu" />
    }

    const addLink = () => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor.chain().focus().setLink({ href: url }).run()
      }
    }

    const addImage = () => {
      const url = window.prompt('Enter image URL:')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    }

    const setColor = () => {
      const color = window.prompt('Enter color (e.g., #FF0000 or red):')
      if (color) {
        editor.chain().focus().setColor(color).run()
      }
    }

    return (
      <div className="border border-neu-dark rounded-neu bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-neu-dark bg-neu-base p-2 flex flex-wrap gap-1">
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
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              icon={<Strikethrough className="w-4 h-4" />}
              title="Strikethrough"
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
              onClick={addImage}
              icon={<ImageIcon className="w-4 h-4" />}
              title="Add Image"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              icon={<Minus className="w-4 h-4" />}
              title="Add Divider"
            />
          </div>

          {/* More */}
          <div className="flex gap-1 border-r border-neu-dark pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              icon={<Quote className="w-4 h-4" />}
              title="Quote"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              icon={<Code className="w-4 h-4" />}
              title="Code Block"
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

        {/* Bubble Menu - appears on text selection */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="flex gap-1 bg-gray-900 text-white rounded-lg p-1 shadow-lg"
          >
            <BubbleButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              icon={<Bold className="w-4 h-4" />}
            />
            <BubbleButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              icon={<Italic className="w-4 h-4" />}
            />
            <BubbleButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              icon={<UnderlineIcon className="w-4 h-4" />}
            />
            <div className="w-px bg-gray-700 mx-1" />
            <BubbleButton
              onClick={addLink}
              active={editor.isActive('link')}
              icon={<LinkIcon className="w-4 h-4" />}
            />
            <BubbleButton
              onClick={setColor}
              icon={<span className="text-xs font-bold">A</span>}
            />
          </BubbleMenu>
        )}

        {/* Editor Content */}
        <EditorContent editor={editor} className="bg-white" />
      </div>
    )
  }
)

TipTapEditor.displayName = 'TipTapEditor'

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

// Bubble Menu Button Component
function BubbleButton({
  onClick,
  active,
  icon,
}: {
  onClick: () => void
  active?: boolean
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded transition-colors ${
        active ? 'bg-white text-gray-900' : 'hover:bg-gray-800 text-white'
      }`}
    >
      {icon}
    </button>
  )
}
