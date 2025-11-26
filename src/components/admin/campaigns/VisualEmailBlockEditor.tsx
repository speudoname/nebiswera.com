'use client'

import { useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Undo, Redo, Code } from 'lucide-react'
import type { EmailBlock, EmailDesign, BlockType } from '@/types/email-blocks'
import { BLOCK_TEMPLATES } from '@/types/email-blocks'
import { generateMJMLFromBlocks, getDefaultEmailDesign } from '@/lib/email-block-generator'
import { BlockRenderer } from './BlockRenderer'
import { BlockPropertiesPanel } from './BlockPropertiesPanel'
import { Button } from '@/components/ui'

interface VisualEmailBlockEditorProps {
  initialDesign?: EmailDesign | null
  onReady?: () => void
}

export const VisualEmailBlockEditor = forwardRef<any, VisualEmailBlockEditorProps>(
  ({ initialDesign, onReady }, ref) => {
    const [design, setDesign] = useState<EmailDesign>(() => initialDesign || getDefaultEmailDesign())
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
    const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
    const [history, setHistory] = useState<EmailDesign[]>([design])
    const [historyIndex, setHistoryIndex] = useState(0)

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    )

    useEffect(() => {
      onReady?.()
    }, [onReady])

    // History management
    const pushHistory = useCallback((newDesign: EmailDesign) => {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newDesign)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      setDesign(newDesign)
    }, [history, historyIndex])

    const undo = useCallback(() => {
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1)
        setDesign(history[historyIndex - 1])
      }
    }, [history, historyIndex])

    const redo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1)
        setDesign(history[historyIndex + 1])
      }
    }, [history, historyIndex])

    // Block operations
    const addBlock = useCallback((type: BlockType) => {
      const id = `block-${Date.now()}`
      const newBlock = BLOCK_TEMPLATES[type](id)
      const newDesign = {
        ...design,
        blocks: [...design.blocks, newBlock],
      }
      pushHistory(newDesign)
      setSelectedBlockId(id)
    }, [design, pushHistory])

    const updateBlock = useCallback((id: string, updates: Partial<EmailBlock>) => {
      const newDesign = {
        ...design,
        blocks: design.blocks.map(block =>
          block.id === id ? { ...block, ...updates } as EmailBlock : block
        ),
      }
      pushHistory(newDesign)
    }, [design, pushHistory])

    const deleteBlock = useCallback((id: string) => {
      const newDesign = {
        ...design,
        blocks: design.blocks.filter(block => block.id !== id),
      }
      pushHistory(newDesign)
      if (selectedBlockId === id) {
        setSelectedBlockId(null)
        setShowPropertiesPanel(false)
      }
    }, [design, pushHistory, selectedBlockId])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = design.blocks.findIndex(block => block.id === active.id)
        const newIndex = design.blocks.findIndex(block => block.id === over.id)
        const newBlocks = arrayMove(design.blocks, oldIndex, newIndex)
        const newDesign = { ...design, blocks: newBlocks }
        pushHistory(newDesign)
      }
    }, [design, pushHistory])

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      exportHtml: async () => {
        try {
          const mjmlCode = generateMJMLFromBlocks(design)
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
            design: JSON.stringify(design), // Store block design
            html: result.html,
            text,
          }
        } catch (error) {
          console.error('Failed to compile blocks:', error)
          throw error
        }
      },
      getDesign: () => design,
      setDesign: (newDesign: EmailDesign) => pushHistory(newDesign),
    }))

    const selectedBlock = design.blocks.find(block => block.id === selectedBlockId) || null

    return (
      <div className="flex h-[600px] gap-4">
        {/* Left: Block Palette */}
        <div className="w-48 flex-shrink-0 bg-neu-base border border-neu-dark rounded-neu p-3 overflow-y-auto">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Add Block</h3>
          <div className="space-y-2">
            {[
              { type: 'text' as const, label: '📝 Text', desc: 'Add text content' },
              { type: 'button' as const, label: '🔘 Button', desc: 'Add a button' },
              { type: 'image' as const, label: '🖼️ Image', desc: 'Add an image' },
              { type: 'divider' as const, label: '➖ Divider', desc: 'Add a divider' },
              { type: 'spacer' as const, label: '📏 Spacer', desc: 'Add spacing' },
              { type: 'social' as const, label: '🌐 Social', desc: 'Social links' },
            ].map(({ type, label, desc }) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="w-full text-left p-2 rounded border border-neu-dark hover:border-primary-400 hover:bg-primary-50 transition-colors group"
                title={desc}
              >
                <div className="text-xs font-medium">{label}</div>
                <div className="text-xs text-text-muted group-hover:text-primary-600">{desc}</div>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="mt-4 pt-4 border-t border-neu-dark">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className="w-full flex items-center gap-2 p-2 rounded border border-neu-dark hover:bg-neu-light disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                title="Undo"
              >
                <Undo className="w-3 h-3" />
                Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="w-full flex items-center gap-2 p-2 rounded border border-neu-dark hover:bg-neu-light disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                title="Redo"
              >
                <Redo className="w-3 h-3" />
                Redo
              </button>
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className={`flex-1 bg-white border border-neu-dark rounded-neu overflow-y-auto p-8 ${showPropertiesPanel ? '' : 'mr-0'}`}>
          <div className="max-w-3xl mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={design.blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {design.blocks.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                      <p className="mb-2">No blocks yet</p>
                      <p className="text-sm">Click "+ Add Block" to start building your email</p>
                    </div>
                  ) : (
                    design.blocks.map(block => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onUpdate={(updates) => updateBlock(block.id, updates)}
                        onDelete={() => deleteBlock(block.id)}
                        onEdit={() => {
                          setSelectedBlockId(block.id)
                          setShowPropertiesPanel(true)
                        }}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Right: Properties Panel */}
        {showPropertiesPanel && (
          <BlockPropertiesPanel
            block={selectedBlock}
            onUpdate={(updates) => selectedBlock && updateBlock(selectedBlock.id, updates)}
            onClose={() => setShowPropertiesPanel(false)}
          />
        )}
      </div>
    )
  }
)

VisualEmailBlockEditor.displayName = 'VisualEmailBlockEditor'

// Sortable wrapper for blocks
function SortableBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onEdit,
}: {
  block: EmailBlock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<EmailBlock>) => void
  onDelete: () => void
  onEdit: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BlockRenderer
        block={block}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onEdit={onEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export type VisualEmailEditorRef = {
  exportHtml: () => Promise<{ design: any; html: string; text: string }>
  getDesign: () => EmailDesign
  setDesign: (design: EmailDesign) => void
}
