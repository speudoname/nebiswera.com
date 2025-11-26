'use client'

import { useState } from 'react'
import { Plus, Type, Square, Image as ImageIcon, Minus, Space } from 'lucide-react'
import type { Editor } from '@tiptap/react'

interface FloatingInsertMenuProps {
  editor: Editor | null
  position: { top: number; left: number }
  onInsert: (type: string) => void
  onClose: () => void
}

export function FloatingInsertMenu({ editor, position, onInsert, onClose }: FloatingInsertMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!editor) return null

  const menuItems = [
    { type: 'text', icon: Type, label: 'Text', description: 'Add a text block' },
    { type: 'button', icon: Square, label: 'Button', description: 'Add a call-to-action button' },
    { type: 'image', icon: ImageIcon, label: 'Image', description: 'Upload or add an image' },
    { type: 'divider', icon: Minus, label: 'Divider', description: 'Add a horizontal line' },
    { type: 'spacer', icon: Space, label: 'Spacer', description: 'Add vertical spacing' },
  ]

  const handleInsert = (type: string) => {
    onInsert(type)
    setIsOpen(false)
    onClose()
  }

  return (
    <div
      className="absolute z-50"
      style={{ top: position.top, left: position.left }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 shadow-lg transition-colors"
          title="Insert component"
        >
          <Plus className="w-4 h-4" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border border-neu-dark p-2 min-w-[240px]">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleInsert(item.type)}
                  className="w-full flex items-start gap-3 p-2 rounded hover:bg-neu-light transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{item.label}</div>
                    <div className="text-xs text-text-muted">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
