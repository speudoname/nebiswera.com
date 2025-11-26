'use client'

import type { EmailBlock, TextBlock, ButtonBlock, ImageBlock, DividerBlock, SpacerBlock, SocialBlock } from '@/types/email-blocks'
import { Input } from '@/components/ui'
import { X } from 'lucide-react'

interface BlockPropertiesPanelProps {
  block: EmailBlock | null
  onUpdate: (updates: Partial<EmailBlock>) => void
  onClose: () => void
}

export function BlockPropertiesPanel({ block, onUpdate, onClose }: BlockPropertiesPanelProps) {
  if (!block) return null

  return (
    <div className="w-80 bg-neu-base border-l border-neu-dark p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary capitalize">{block.type} Properties</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neu-light"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {renderProperties(block, onUpdate)}
      </div>
    </div>
  )
}

function renderProperties(
  block: EmailBlock,
  onUpdate: (updates: Partial<EmailBlock>) => void
) {
  switch (block.type) {
    case 'text':
      return <TextProperties block={block} onUpdate={onUpdate} />
    case 'button':
      return <ButtonProperties block={block} onUpdate={onUpdate} />
    case 'image':
      return <ImageProperties block={block} onUpdate={onUpdate} />
    case 'divider':
      return <DividerProperties block={block} onUpdate={onUpdate} />
    case 'spacer':
      return <SpacerProperties block={block} onUpdate={onUpdate} />
    case 'social':
      return <SocialProperties block={block} onUpdate={onUpdate} />
    default:
      return null
  }
}

function TextProperties({
  block,
  onUpdate,
}: {
  block: TextBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Font Size</label>
        <Input
          type="text"
          value={block.fontSize || '14px'}
          onChange={(e) => onUpdate({ fontSize: e.target.value })}
          placeholder="14px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={block.color || '#333333'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-12 h-10 rounded border border-neu-dark cursor-pointer"
          />
          <Input
            type="text"
            value={block.color || '#333333'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            placeholder="#333333"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Alignment</label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onUpdate({ align })}
              className={`flex-1 py-2 px-3 rounded border ${
                block.align === align
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neu-dark bg-neu-base'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Font Weight</label>
        <div className="flex gap-2">
          {(['normal', 'bold'] as const).map((weight) => (
            <button
              key={weight}
              onClick={() => onUpdate({ fontWeight: weight })}
              className={`flex-1 py-2 px-3 rounded border ${
                block.fontWeight === weight
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neu-dark bg-neu-base'
              }`}
            >
              {weight}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Line Height</label>
        <Input
          type="text"
          value={block.lineHeight || '1.6'}
          onChange={(e) => onUpdate({ lineHeight: e.target.value })}
          placeholder="1.6"
        />
      </div>
    </>
  )
}

function ButtonProperties({
  block,
  onUpdate,
}: {
  block: ButtonBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Link URL</label>
        <Input
          type="url"
          value={block.href}
          onChange={(e) => onUpdate({ href: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Background Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={block.backgroundColor || '#8B5CF6'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-12 h-10 rounded border border-neu-dark cursor-pointer"
          />
          <Input
            type="text"
            value={block.backgroundColor || '#8B5CF6'}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            placeholder="#8B5CF6"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Text Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={block.color || '#FFFFFF'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-12 h-10 rounded border border-neu-dark cursor-pointer"
          />
          <Input
            type="text"
            value={block.color || '#FFFFFF'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Alignment</label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onUpdate({ align })}
              className={`flex-1 py-2 px-3 rounded border ${
                block.align === align
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neu-dark bg-neu-base'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Border Radius</label>
        <Input
          type="text"
          value={block.borderRadius || '4px'}
          onChange={(e) => onUpdate({ borderRadius: e.target.value })}
          placeholder="4px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Padding</label>
        <Input
          type="text"
          value={block.padding || '12px 24px'}
          onChange={(e) => onUpdate({ padding: e.target.value })}
          placeholder="12px 24px"
        />
      </div>
    </>
  )
}

function ImageProperties({
  block,
  onUpdate,
}: {
  block: ImageBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Image URL</label>
        <Input
          type="url"
          value={block.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Alt Text</label>
        <Input
          type="text"
          value={block.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Image description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Link URL (optional)</label>
        <Input
          type="url"
          value={block.href || ''}
          onChange={(e) => onUpdate({ href: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Width</label>
        <Input
          type="text"
          value={block.width || '600px'}
          onChange={(e) => onUpdate({ width: e.target.value })}
          placeholder="600px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Alignment</label>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onUpdate({ align })}
              className={`flex-1 py-2 px-3 rounded border ${
                block.align === align
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neu-dark bg-neu-base'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function DividerProperties({
  block,
  onUpdate,
}: {
  block: DividerBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Border Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={block.borderColor || '#E0E0E0'}
            onChange={(e) => onUpdate({ borderColor: e.target.value })}
            className="w-12 h-10 rounded border border-neu-dark cursor-pointer"
          />
          <Input
            type="text"
            value={block.borderColor || '#E0E0E0'}
            onChange={(e) => onUpdate({ borderColor: e.target.value })}
            placeholder="#E0E0E0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Border Width</label>
        <Input
          type="text"
          value={block.borderWidth || '1px'}
          onChange={(e) => onUpdate({ borderWidth: e.target.value })}
          placeholder="1px"
        />
      </div>
    </>
  )
}

function SpacerProperties({
  block,
  onUpdate,
}: {
  block: SpacerBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Height</label>
        <Input
          type="text"
          value={block.height || '20px'}
          onChange={(e) => onUpdate({ height: e.target.value })}
          placeholder="20px"
        />
      </div>
    </>
  )
}

function SocialProperties({
  block,
  onUpdate,
}: {
  block: SocialBlock
  onUpdate: (updates: Partial<EmailBlock>) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Social Links</label>
        <div className="space-y-2">
          {block.links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="text"
                value={link.platform}
                disabled
                className="flex-shrink-0 w-24"
              />
              <Input
                type="url"
                value={link.url}
                onChange={(e) => {
                  const newLinks = [...block.links]
                  newLinks[index] = { ...link, url: e.target.value }
                  onUpdate({ links: newLinks })
                }}
                placeholder="URL"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Icon Size</label>
        <Input
          type="text"
          value={block.iconSize || '30px'}
          onChange={(e) => onUpdate({ iconSize: e.target.value })}
          placeholder="30px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Mode</label>
        <div className="flex gap-2">
          {(['horizontal', 'vertical'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdate({ mode })}
              className={`flex-1 py-2 px-3 rounded border ${
                block.mode === mode
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neu-dark bg-neu-base'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
