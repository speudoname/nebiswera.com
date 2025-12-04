'use client'

import type { RichTextPart } from '../types'

interface RichTextRendererProps {
  parts: RichTextPart[] | null
  fallback?: string
  className?: string
  primaryColor?: string | null
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

/**
 * Renders rich text parts with styling (bold, italic, colors)
 * Falls back to plain text if no parts are provided
 */
export function RichTextRenderer({
  parts,
  fallback,
  className = '',
  primaryColor,
  as: Component = 'span',
}: RichTextRendererProps) {
  // If no parts, render fallback as plain text
  if (!parts || parts.length === 0) {
    if (!fallback) return null
    return <Component className={className}>{fallback}</Component>
  }

  // Color mapping
  const getColor = (color?: string): string | undefined => {
    if (!color || color === 'default') return undefined

    switch (color) {
      case 'primary':
        return primaryColor || '#8B5CF6'
      case 'secondary':
        return '#5B4478'
      case 'muted':
        return '#9CA3AF'
      case 'white':
        return '#FFFFFF'
      default:
        // Custom hex color
        return color.startsWith('#') ? color : undefined
    }
  }

  return (
    <Component className={className}>
      {parts.map((part, index) => {
        const style: React.CSSProperties = {}

        if (part.bold) {
          style.fontWeight = 'bold'
        }

        if (part.italic) {
          style.fontStyle = 'italic'
        }

        const color = getColor(part.color)
        if (color) {
          style.color = color
        }

        // If no styling, just return text
        if (Object.keys(style).length === 0) {
          return <span key={index}>{part.text}</span>
        }

        return (
          <span key={index} style={style}>
            {part.text}
          </span>
        )
      })}
    </Component>
  )
}

/**
 * Utility to parse markdown-like syntax to RichTextPart[]
 * Supports: **bold**, *italic*, {{primary:text}}, {{#HEX:text}}
 */
export function parseMarkdownToRichText(text: string): RichTextPart[] {
  if (!text) return []

  const parts: RichTextPart[] = []

  // Regex to match: **bold**, *italic*, {{color:text}}
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\{\{[^}]+:[^}]+\}\})/g

  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) })
    }

    const matched = match[0]

    if (matched.startsWith('**') && matched.endsWith('**')) {
      // Bold
      parts.push({ text: matched.slice(2, -2), bold: true })
    } else if (matched.startsWith('*') && matched.endsWith('*')) {
      // Italic
      parts.push({ text: matched.slice(1, -1), italic: true })
    } else if (matched.startsWith('{{') && matched.endsWith('}}')) {
      // Color: {{color:text}}
      const inner = matched.slice(2, -2)
      const colonIndex = inner.indexOf(':')
      if (colonIndex > 0) {
        const color = inner.slice(0, colonIndex)
        const colorText = inner.slice(colonIndex + 1)
        parts.push({ text: colorText, color })
      }
    }

    lastIndex = match.index + matched.length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ text }]
}

/**
 * Convert RichTextPart[] back to plain text
 */
export function richTextToPlain(parts: RichTextPart[] | null): string {
  if (!parts || parts.length === 0) return ''
  return parts.map(p => p.text).join('')
}

/**
 * Convert RichTextPart[] to markdown-like syntax
 */
export function richTextToMarkdown(parts: RichTextPart[] | null): string {
  if (!parts || parts.length === 0) return ''

  return parts.map(part => {
    let text = part.text

    if (part.bold) {
      text = `**${text}**`
    }
    if (part.italic) {
      text = `*${text}*`
    }
    if (part.color && part.color !== 'default') {
      text = `{{${part.color}:${text}}}`
    }

    return text
  }).join('')
}
