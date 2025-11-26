// Email Block Types for Visual Email Builder

export type BlockType = 'text' | 'button' | 'image' | 'divider' | 'spacer' | 'social'

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string
  fontSize?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  fontWeight?: 'normal' | 'bold'
  lineHeight?: string
}

export interface ButtonBlock extends BaseBlock {
  type: 'button'
  text: string
  href: string
  backgroundColor?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  borderRadius?: string
  padding?: string
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  src: string
  alt: string
  href?: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  borderColor?: string
  borderWidth?: string
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer'
  height?: string
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github'
  url: string
}

export interface SocialBlock extends BaseBlock {
  type: 'social'
  links: SocialLink[]
  iconSize?: string
  mode?: 'horizontal' | 'vertical'
}

export type EmailBlock =
  | TextBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | SocialBlock

export interface EmailDesign {
  blocks: EmailBlock[]
  globalStyles: {
    backgroundColor: string
    fontFamily: string
  }
}

// Block defaults
export const DEFAULT_BLOCK_STYLES = {
  text: {
    fontSize: '14px',
    color: '#333333',
    align: 'left' as const,
    fontWeight: 'normal' as const,
    lineHeight: '1.6',
  },
  button: {
    backgroundColor: '#8B5CF6',
    color: '#FFFFFF',
    align: 'center' as const,
    borderRadius: '4px',
    padding: '12px 24px',
  },
  image: {
    width: '600px',
    align: 'center' as const,
  },
  divider: {
    borderColor: '#E0E0E0',
    borderWidth: '1px',
  },
  spacer: {
    height: '20px',
  },
  social: {
    iconSize: '30px',
    mode: 'horizontal' as const,
  },
}

// Block templates
export const BLOCK_TEMPLATES = {
  text: (id: string): TextBlock => ({
    id,
    type: 'text',
    content: 'Edit this text...',
    ...DEFAULT_BLOCK_STYLES.text,
  }),
  button: (id: string): ButtonBlock => ({
    id,
    type: 'button',
    text: 'Click Here',
    href: 'https://nebiswera.com',
    ...DEFAULT_BLOCK_STYLES.button,
  }),
  image: (id: string): ImageBlock => ({
    id,
    type: 'image',
    src: 'https://via.placeholder.com/600x200',
    alt: 'Image description',
    ...DEFAULT_BLOCK_STYLES.image,
  }),
  divider: (id: string): DividerBlock => ({
    id,
    type: 'divider',
    ...DEFAULT_BLOCK_STYLES.divider,
  }),
  spacer: (id: string): SpacerBlock => ({
    id,
    type: 'spacer',
    ...DEFAULT_BLOCK_STYLES.spacer,
  }),
  social: (id: string): SocialBlock => ({
    id,
    type: 'social',
    links: [
      { platform: 'facebook', url: 'https://facebook.com/nebiswera' },
      { platform: 'twitter', url: 'https://twitter.com/nebiswera' },
      { platform: 'instagram', url: 'https://instagram.com/nebiswera' },
    ],
    ...DEFAULT_BLOCK_STYLES.social,
  }),
}
