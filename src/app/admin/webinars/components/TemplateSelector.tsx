'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

// All 9 landing page templates
export type LandingPageTemplate =
  | 'IMAGE_RIGHT'
  | 'IMAGE_LEFT'
  | 'CENTERED_HERO'
  | 'CENTERED_MINIMAL'
  | 'IMAGE_BACKGROUND'
  | 'GRADIENT_OVERLAY'
  | 'VIDEO_FOCUS'
  | 'CARD_FLOAT'
  | 'SPLIT_DIAGONAL'

interface TemplateSelectorProps {
  value: LandingPageTemplate
  onChange: (template: LandingPageTemplate) => void
  primaryColor?: string
}

interface TemplateOption {
  id: LandingPageTemplate
  name: string
  description: string
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'IMAGE_RIGHT',
    name: 'Classic Right',
    description: 'Text left, image right - traditional layout',
  },
  {
    id: 'IMAGE_LEFT',
    name: 'Classic Left',
    description: 'Image left, text right - mirrored layout',
  },
  {
    id: 'CENTERED_HERO',
    name: 'Centered Hero',
    description: 'Centered text above image/video',
  },
  {
    id: 'CENTERED_MINIMAL',
    name: 'Minimal Center',
    description: 'Clean centered text, no hero media',
  },
  {
    id: 'IMAGE_BACKGROUND',
    name: 'Full Background',
    description: 'Full-bleed background image with overlay',
  },
  {
    id: 'GRADIENT_OVERLAY',
    name: 'Gradient Overlay',
    description: 'Image with gradient, text overlay',
  },
  {
    id: 'VIDEO_FOCUS',
    name: 'Video Focus',
    description: 'Large centered video as main element',
  },
  {
    id: 'CARD_FLOAT',
    name: 'Floating Card',
    description: 'Text in floating card over image',
  },
  {
    id: 'SPLIT_DIAGONAL',
    name: 'Split Diagonal',
    description: 'Diagonal split between content and media',
  },
]

/**
 * Template Selector with visual preview thumbnails
 */
export function TemplateSelector({ value, onChange, primaryColor = '#8B5CF6' }: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<LandingPageTemplate | null>(null)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {TEMPLATES.map((template) => {
          const isSelected = value === template.id
          const isHovered = hoveredTemplate === template.id

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className={`relative p-3 rounded-neu border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-neu'
                  : 'border-transparent bg-neu-base hover:border-gray-300 hover:shadow-neu-sm'
              }`}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Template Preview Thumbnail */}
              <div className="w-full aspect-[16/10] mb-3 rounded overflow-hidden bg-white shadow-neu-inset-sm">
                <TemplatePreview
                  template={template.id}
                  primaryColor={primaryColor}
                  isHovered={isHovered || isSelected}
                />
              </div>

              {/* Template Info */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary">{template.name}</h4>
                <p className="text-xs text-text-muted mt-0.5 leading-tight">{template.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Mini preview component that renders a simplified visual representation of each template
 */
function TemplatePreview({
  template,
  primaryColor,
  isHovered,
}: {
  template: LandingPageTemplate
  primaryColor: string
  isHovered: boolean
}) {
  // Common colors
  const bgColor = '#E8E0F0'
  const textColor = '#2D1B4E'
  const mutedColor = '#9CA3AF'
  const imageColor = isHovered ? primaryColor : '#D4C8E8'

  // Common elements
  const TextLines = ({ count = 3, align = 'left', width = 'full' }: { count?: number; align?: string; width?: string }) => (
    <div className={`flex flex-col gap-0.5 ${align === 'center' ? 'items-center' : ''}`}>
      {Array(count).fill(0).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full ${i === 0 ? 'bg-text-primary' : 'bg-gray-300'}`}
          style={{
            width: i === 0 ? (width === 'full' ? '80%' : '60%') : `${60 - i * 10}%`,
            backgroundColor: i === 0 ? textColor : mutedColor,
          }}
        />
      ))}
    </div>
  )

  const Button = () => (
    <div
      className="h-2 w-8 rounded-sm"
      style={{ backgroundColor: primaryColor }}
    />
  )

  const ImageBox = ({ className = '' }: { className?: string }) => (
    <div
      className={`rounded-sm transition-colors ${className}`}
      style={{ backgroundColor: imageColor }}
    />
  )

  switch (template) {
    case 'IMAGE_RIGHT':
      return (
        <div className="w-full h-full p-2 flex gap-2" style={{ backgroundColor: bgColor }}>
          <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
            <TextLines count={3} />
            <Button />
          </div>
          <ImageBox className="w-[45%] h-full" />
        </div>
      )

    case 'IMAGE_LEFT':
      return (
        <div className="w-full h-full p-2 flex gap-2" style={{ backgroundColor: bgColor }}>
          <ImageBox className="w-[45%] h-full" />
          <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
            <TextLines count={3} />
            <Button />
          </div>
        </div>
      )

    case 'CENTERED_HERO':
      return (
        <div className="w-full h-full p-2 flex flex-col items-center" style={{ backgroundColor: bgColor }}>
          <div className="flex flex-col items-center gap-1 py-1">
            <TextLines count={2} align="center" width="short" />
            <Button />
          </div>
          <ImageBox className="flex-1 w-[70%] mt-1.5" />
        </div>
      )

    case 'CENTERED_MINIMAL':
      return (
        <div className="w-full h-full p-2 flex flex-col items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: textColor }} />
            <TextLines count={2} align="center" />
            <div className="mt-1"><Button /></div>
          </div>
        </div>
      )

    case 'IMAGE_BACKGROUND':
      return (
        <div className="w-full h-full relative" style={{ backgroundColor: imageColor }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 w-full h-full p-2 flex flex-col justify-center">
            <div className="flex flex-col gap-1">
              <div className="h-1 w-[60%] rounded-full bg-white/90" />
              <div className="h-0.5 w-[45%] rounded-full bg-white/70" />
              <div className="h-0.5 w-[50%] rounded-full bg-white/60" />
              <div className="mt-1 h-2 w-8 rounded-sm bg-white" />
            </div>
          </div>
        </div>
      )

    case 'GRADIENT_OVERLAY':
      return (
        <div className="w-full h-full relative" style={{ backgroundColor: imageColor }}>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}CC 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10 w-full h-full p-2 flex flex-col justify-center">
            <div className="flex flex-col gap-1">
              <div className="h-1 w-[55%] rounded-full bg-white/90" />
              <div className="h-0.5 w-[40%] rounded-full bg-white/70" />
              <div className="mt-1 h-2 w-8 rounded-sm" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
        </div>
      )

    case 'VIDEO_FOCUS':
      return (
        <div className="w-full h-full p-2 flex flex-col items-center" style={{ backgroundColor: bgColor }}>
          <div className="flex flex-col items-center gap-0.5 py-0.5">
            <div className="h-1 w-12 rounded-full" style={{ backgroundColor: textColor }} />
            <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: mutedColor }} />
          </div>
          <div className="flex-1 w-[85%] mt-1 rounded-sm relative" style={{ backgroundColor: imageColor }}>
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white/80 flex items-center justify-center">
                <div
                  className="w-0 h-0 ml-0.5"
                  style={{
                    borderLeft: '4px solid ' + textColor,
                    borderTop: '2.5px solid transparent',
                    borderBottom: '2.5px solid transparent',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )

    case 'CARD_FLOAT':
      return (
        <div className="w-full h-full relative" style={{ backgroundColor: imageColor }}>
          {/* Floating card */}
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 w-[50%] p-1.5 rounded bg-white shadow-lg"
          >
            <div className="flex flex-col gap-0.5">
              <div className="h-1 w-[90%] rounded-full" style={{ backgroundColor: textColor }} />
              <div className="h-0.5 w-[70%] rounded-full" style={{ backgroundColor: mutedColor }} />
              <div className="h-0.5 w-[75%] rounded-full" style={{ backgroundColor: mutedColor }} />
              <div className="mt-0.5 h-1.5 w-6 rounded-sm" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
        </div>
      )

    case 'SPLIT_DIAGONAL':
      return (
        <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: bgColor }}>
          {/* Diagonal image section */}
          <div
            className="absolute right-0 top-0 w-[60%] h-full"
            style={{
              backgroundColor: imageColor,
              clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)',
            }}
          />
          {/* Content section */}
          <div className="relative z-10 w-[55%] h-full p-2 flex flex-col justify-center">
            <div className="flex flex-col gap-1">
              <TextLines count={3} />
              <Button />
            </div>
          </div>
        </div>
      )

    default:
      return <div className="w-full h-full" style={{ backgroundColor: bgColor }} />
  }
}

export { TEMPLATES }
