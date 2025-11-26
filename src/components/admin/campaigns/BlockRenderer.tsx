'use client'

import type { EmailBlock, TextBlock, ButtonBlock, ImageBlock, DividerBlock, SpacerBlock, SocialBlock } from '@/types/email-blocks'
import { GripVertical, Trash2, Settings } from 'lucide-react'

interface BlockRendererProps {
  block: EmailBlock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<EmailBlock>) => void
  onDelete: () => void
  onEdit: () => void
  dragHandleProps?: any
}

export function BlockRenderer({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onEdit,
  dragHandleProps,
}: BlockRendererProps) {
  return (
    <div
      className={`group relative border-2 rounded-neu transition-all ${
        isSelected
          ? 'border-primary-500 shadow-neu-md'
          : 'border-transparent hover:border-primary-200'
      }`}
      onClick={onSelect}
    >
      {/* Block Actions */}
      <div className={`absolute -left-10 top-2 flex flex-col gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        <button
          {...dragHandleProps}
          className="p-1 rounded bg-neu-base shadow-neu hover:shadow-neu-hover cursor-move"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      <div className={`absolute -right-10 top-2 flex flex-col gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="p-1 rounded bg-neu-base shadow-neu hover:shadow-neu-hover"
          title="Edit properties"
        >
          <Settings className="w-4 h-4 text-primary-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 rounded bg-neu-base shadow-neu hover:shadow-neu-hover"
          title="Delete block"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Block Content */}
      <div className="p-4">
        {renderBlockContent(block, onUpdate)}
      </div>

      {/* Block Type Label */}
      {isSelected && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
          {block.type}
        </div>
      )}
    </div>
  )
}

function renderBlockContent(
  block: EmailBlock,
  onUpdate: (updates: Partial<EmailBlock>) => void
) {
  switch (block.type) {
    case 'text':
      return <TextBlockContent block={block} onUpdate={onUpdate} />
    case 'button':
      return <ButtonBlockContent block={block} onUpdate={onUpdate} />
    case 'image':
      return <ImageBlockContent block={block} onUpdate={onUpdate} />
    case 'divider':
      return <DividerBlockContent block={block} />
    case 'spacer':
      return <SpacerBlockContent block={block} />
    case 'social':
      return <SocialBlockContent block={block} />
    default:
      return null
  }
}

function TextBlockContent({
  block,
  onUpdate,
}: {
  block: TextBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <div
      style={{
        fontSize: block.fontSize,
        color: block.color,
        textAlign: block.align,
        fontWeight: block.fontWeight,
        lineHeight: block.lineHeight,
      }}
    >
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        className="w-full bg-transparent border-none outline-none resize-none font-inherit"
        style={{
          fontSize: 'inherit',
          color: 'inherit',
          textAlign: 'inherit' as any,
          fontWeight: 'inherit',
          lineHeight: 'inherit',
          minHeight: '40px',
        }}
        rows={Math.max(2, block.content.split('\n').length)}
        placeholder="Enter text..."
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function ButtonBlockContent({
  block,
  onUpdate,
}: {
  block: ButtonBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <div style={{ textAlign: block.align }}>
      <button
        type="button"
        style={{
          backgroundColor: block.backgroundColor,
          color: block.color,
          borderRadius: block.borderRadius,
          padding: block.padding,
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
        className="inline-flex items-center shadow-neu hover:shadow-neu-hover transition-shadow"
      >
        <input
          type="text"
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="bg-transparent border-none outline-none text-center"
          style={{ color: 'inherit', minWidth: '80px', maxWidth: '200px' }}
          placeholder="Button text"
          onClick={(e) => e.stopPropagation()}
        />
      </button>
    </div>
  )
}

function ImageBlockContent({
  block,
  onUpdate,
}: {
  block: ImageBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <div style={{ textAlign: block.align }}>
      {block.src ? (
        <img
          src={block.src}
          alt={block.alt}
          style={{ maxWidth: block.width, height: 'auto' }}
          className="rounded"
        />
      ) : (
        <div className="bg-neu-base border-2 border-dashed border-neu-dark rounded p-8 text-center">
          <p className="text-text-muted text-sm">No image selected</p>
        </div>
      )}
    </div>
  )
}

function DividerBlockContent({ block }: { block: DividerBlock }) {
  return (
    <hr
      style={{
        borderColor: block.borderColor,
        borderWidth: `${block.borderWidth} 0 0 0`,
        margin: '10px 0',
      }}
    />
  )
}

function SpacerBlockContent({ block }: { block: SpacerBlock }) {
  return (
    <div
      style={{ height: block.height }}
      className="bg-neu-base border border-dashed border-neu-dark rounded flex items-center justify-center"
    >
      <span className="text-xs text-text-muted">{block.height} spacer</span>
    </div>
  )
}

function SocialBlockContent({ block }: { block: SocialBlock }) {
  return (
    <div className="flex gap-2 justify-center">
      {block.links.map((link, idx) => (
        <div
          key={idx}
          className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs"
          title={`${link.platform}: ${link.url}`}
        >
          {link.platform[0].toUpperCase()}
        </div>
      ))}
    </div>
  )
}
