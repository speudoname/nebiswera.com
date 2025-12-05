'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Video,
  Music,
  Image,
  FileText,
  Code,
  Link as LinkIcon,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  X,
  Upload,
} from 'lucide-react'
import type {
  ContentBlock,
  ContentBlockType,
  TextContentBlock,
  VideoContentBlock,
  AudioContentBlock,
  ImageContentBlock,
  FileContentBlock,
  HtmlContentBlock,
  EmbedContentBlock,
  QuizContentBlock,
} from '@/lib/lms/types'
import { generateBlockId, createEmptyBlock } from '@/lib/lms/types'

interface Part {
  id: string
  title: string
  description: string | null
  order: number
  contentBlocks: ContentBlock[]
  lesson: {
    id: string
    title: string
    courseId: string
    course: {
      id: string
      title: string
    }
  }
}

const BLOCK_TYPES: { type: ContentBlockType; icon: typeof Type; label: string; description: string }[] = [
  { type: 'text', icon: Type, label: 'Text', description: 'Rich text content' },
  { type: 'video', icon: Video, label: 'Video', description: 'Upload or embed video' },
  { type: 'audio', icon: Music, label: 'Audio', description: 'Audio file' },
  { type: 'image', icon: Image, label: 'Image', description: 'Image with caption' },
  { type: 'file', icon: FileText, label: 'File', description: 'Downloadable file' },
  { type: 'html', icon: Code, label: 'HTML', description: 'Custom HTML/embed' },
  { type: 'embed', icon: LinkIcon, label: 'Embed', description: 'YouTube, Vimeo, etc.' },
  { type: 'quiz', icon: HelpCircle, label: 'Quiz', description: 'Quiz or assessment' },
]

export default function PartContentEditorPage() {
  const params = useParams()
  const courseId = params.id as string
  const partId = params.partId as string
  const router = useRouter()
  const [part, setPart] = useState<Part | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Modal states
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const [deleteBlockConfirm, setDeleteBlockConfirm] = useState<string | null>(null)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)

  useEffect(() => {
    fetchPart()
  }, [partId])

  const fetchPart = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/parts/${partId}`)
      if (res.ok) {
        const data = await res.json()
        setPart(data)
        setBlocks(data.contentBlocks || [])
      } else {
        router.push(`/admin/courses/${courseId}/content`)
      }
    } catch (error) {
      console.error('Failed to fetch part:', error)
      router.push(`/admin/courses/${courseId}/content`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/parts/${partId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentBlocks: blocks }),
      })

      if (res.ok) {
        setHasChanges(false)
        const data = await res.json()
        setPart(prev => prev ? { ...prev, contentBlocks: data.contentBlocks } : null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addBlock = (type: ContentBlockType) => {
    const newBlock = createEmptyBlock(type, blocks.length)
    setBlocks([...blocks, newBlock])
    setHasChanges(true)
    setAddBlockOpen(false)
    setEditingBlock(newBlock.id)
  }

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } as ContentBlock : block
    ))
    setHasChanges(true)
  }

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId).map((block, idx) => ({ ...block, order: idx })))
    setHasChanges(true)
    setDeleteBlockConfirm(null)
  }

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === blocks.length - 1) return

    const newBlocks = [...blocks]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]

    // Update order values
    newBlocks.forEach((block, i) => {
      block.order = i
    })

    setBlocks(newBlocks)
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!part) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${courseId}/content`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Content Builder
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{part.title}</h1>
            <p className="text-text-muted">
              {part.lesson.course.title} &gt; {part.lesson.title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
            )}
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Blocks */}
      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="text-center py-16 bg-neu-light rounded-neu shadow-neu">
            <FileText className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-lg font-medium text-text-secondary mb-2">No content yet</p>
            <p className="text-text-muted mb-6">Add content blocks to build this part</p>
            <Button onClick={() => setAddBlockOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content Block
            </Button>
          </div>
        ) : (
          <>
            {blocks.map((block, idx) => (
              <ContentBlockEditor
                key={block.id}
                block={block}
                isFirst={idx === 0}
                isLast={idx === blocks.length - 1}
                isEditing={editingBlock === block.id}
                onEdit={() => setEditingBlock(editingBlock === block.id ? null : block.id)}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onDelete={() => setDeleteBlockConfirm(block.id)}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
                courseId={courseId}
              />
            ))}

            {/* Add Block Button */}
            <button
              onClick={() => setAddBlockOpen(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neu-dark rounded-neu text-text-muted hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Content Block
            </button>
          </>
        )}
      </div>

      {/* Add Block Modal */}
      <Modal
        isOpen={addBlockOpen}
        onClose={() => setAddBlockOpen(false)}
        title="Add Content Block"
      >
        <div className="grid grid-cols-2 gap-3">
          {BLOCK_TYPES.map((blockType) => (
            <button
              key={blockType.type}
              onClick={() => addBlock(blockType.type)}
              className="flex items-start gap-3 p-4 rounded-lg border-2 border-transparent bg-neu-base hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
            >
              <blockType.icon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-text-primary">{blockType.label}</div>
                <div className="text-sm text-text-muted">{blockType.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteBlockConfirm}
        onClose={() => setDeleteBlockConfirm(null)}
        title="Delete Content Block"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-text-secondary mb-6">
            Are you sure you want to delete this content block? This action cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => setDeleteBlockConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleteBlockConfirm && deleteBlock(deleteBlockConfirm)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ===========================================
// Content Block Editor Component
// ===========================================

interface ContentBlockEditorProps {
  block: ContentBlock
  isFirst: boolean
  isLast: boolean
  isEditing: boolean
  onEdit: () => void
  onUpdate: (updates: Partial<ContentBlock>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  courseId: string
}

function ContentBlockEditor({
  block,
  isFirst,
  isLast,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  courseId,
}: ContentBlockEditorProps) {
  const blockType = BLOCK_TYPES.find(bt => bt.type === block.type)
  const Icon = blockType?.icon || FileText

  return (
    <div className={`bg-neu-light rounded-neu shadow-neu overflow-hidden ${isEditing ? 'ring-2 ring-primary-400' : ''}`}>
      {/* Block Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neu-dark">
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 text-text-muted hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 text-text-muted hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <Icon className="w-5 h-5 text-primary-600" />
        <div className="flex-1">
          <span className="font-medium text-text-primary">{blockType?.label || block.type}</span>
          <span className="ml-2 text-xs text-text-muted">{blockType?.description}</span>
        </div>

        <button
          onClick={onEdit}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isEditing
              ? 'bg-primary-100 text-primary-700'
              : 'text-text-muted hover:bg-neu-base'
          }`}
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>

        <button
          onClick={onDelete}
          className="p-1.5 text-text-muted hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Block Content / Editor */}
      {isEditing && (
        <div className="p-4">
          <BlockTypeEditor block={block} onUpdate={onUpdate} courseId={courseId} />
        </div>
      )}

      {/* Preview (when not editing) */}
      {!isEditing && (
        <div className="p-4 bg-neu-base/30">
          <BlockPreview block={block} />
        </div>
      )}
    </div>
  )
}

// ===========================================
// Block Type Specific Editors
// ===========================================

interface BlockEditorProps {
  block: ContentBlock
  onUpdate: (updates: Partial<ContentBlock>) => void
  courseId: string
}

function BlockTypeEditor({ block, onUpdate, courseId }: BlockEditorProps) {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onUpdate={onUpdate} />
    case 'video':
      return <VideoBlockEditor block={block} onUpdate={onUpdate} courseId={courseId} />
    case 'audio':
      return <AudioBlockEditor block={block} onUpdate={onUpdate} courseId={courseId} />
    case 'image':
      return <ImageBlockEditor block={block} onUpdate={onUpdate} courseId={courseId} />
    case 'file':
      return <FileBlockEditor block={block} onUpdate={onUpdate} courseId={courseId} />
    case 'html':
      return <HtmlBlockEditor block={block} onUpdate={onUpdate} />
    case 'embed':
      return <EmbedBlockEditor block={block} onUpdate={onUpdate} />
    case 'quiz':
      return <QuizBlockEditor block={block} onUpdate={onUpdate} courseId={courseId} />
    default:
      return <div className="text-text-muted">Unknown block type</div>
  }
}

// Text Block Editor
function TextBlockEditor({ block, onUpdate }: { block: TextContentBlock; onUpdate: (updates: Partial<TextContentBlock>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        Content (Markdown supported)
      </label>
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        rows={10}
        placeholder="Enter your text content here... You can use Markdown for formatting."
        className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-y font-mono text-sm"
      />
      <p className="mt-2 text-xs text-text-muted">
        Supports Markdown: **bold**, *italic*, # headings, - lists, [links](url), etc.
      </p>
    </div>
  )
}

// Video Block Editor
function VideoBlockEditor({ block, onUpdate, courseId }: { block: VideoContentBlock; onUpdate: (updates: Partial<VideoContentBlock>) => void; courseId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      formData.append('mediaType', 'video')

      const res = await fetch('/api/admin/courses/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onUpdate({
          url: data.url,
          bunnyVideoId: data.bunnyVideoId,
          duration: data.duration || 0,
          thumbnail: data.thumbnail,
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {block.url ? (
        <div className="space-y-3">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video src={block.url} controls className="w-full h-full" />
          </div>
          <Button variant="secondary" onClick={() => onUpdate({ url: '', bunnyVideoId: undefined, duration: 0, thumbnail: undefined })}>
            Remove Video
          </Button>
        </div>
      ) : (
        <div>
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neu-dark rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-primary-600 animate-spin" />
                <span className="text-sm text-text-muted">Uploading video...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-3 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Click to upload video</span>
                <span className="text-xs text-text-muted mt-1">MP4, WebM, or MOV</span>
              </>
            )}
          </label>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Or paste video URL
        </label>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://..."
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Duration (seconds)
          </label>
          <input
            type="number"
            min="0"
            value={block.duration}
            onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Thumbnail URL (optional)
          </label>
          <input
            type="url"
            value={block.thumbnail || ''}
            onChange={(e) => onUpdate({ thumbnail: e.target.value || undefined })}
            placeholder="https://..."
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// Audio Block Editor
function AudioBlockEditor({ block, onUpdate, courseId }: { block: AudioContentBlock; onUpdate: (updates: Partial<AudioContentBlock>) => void; courseId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      formData.append('mediaType', 'audio')

      const res = await fetch('/api/admin/courses/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onUpdate({
          url: data.url,
          duration: data.duration || 0,
          title: file.name.replace(/\.[^/.]+$/, ''),
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {block.url ? (
        <div className="space-y-3">
          <audio src={block.url} controls className="w-full" />
          <Button variant="secondary" onClick={() => onUpdate({ url: '', duration: 0, title: undefined })}>
            Remove Audio
          </Button>
        </div>
      ) : (
        <div>
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neu-dark rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-primary-600 animate-spin" />
                <span className="text-sm text-text-muted">Uploading audio...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-3 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Click to upload audio</span>
                <span className="text-xs text-text-muted mt-1">MP3, WAV, or OGG</span>
              </>
            )}
          </label>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Or paste audio URL
        </label>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://..."
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value || undefined })}
            placeholder="Audio title..."
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Duration (seconds)
          </label>
          <input
            type="number"
            min="0"
            value={block.duration}
            onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// Image Block Editor
function ImageBlockEditor({ block, onUpdate, courseId }: { block: ImageContentBlock; onUpdate: (updates: Partial<ImageContentBlock>) => void; courseId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      formData.append('mediaType', 'image')

      const res = await fetch('/api/admin/courses/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onUpdate({ url: data.url })
      } else {
        const data = await res.json()
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {block.url ? (
        <div className="space-y-3">
          <img src={block.url} alt={block.alt || ''} className="max-w-full max-h-64 rounded-lg" />
          <Button variant="secondary" onClick={() => onUpdate({ url: '', alt: undefined, caption: undefined })}>
            Remove Image
          </Button>
        </div>
      ) : (
        <div>
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neu-dark rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-primary-600 animate-spin" />
                <span className="text-sm text-text-muted">Uploading image...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-3 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Click to upload image</span>
                <span className="text-xs text-text-muted mt-1">PNG, JPG, GIF, or WebP</span>
              </>
            )}
          </label>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Or paste image URL
        </label>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://..."
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Alt Text
          </label>
          <input
            type="text"
            value={block.alt || ''}
            onChange={(e) => onUpdate({ alt: e.target.value || undefined })}
            placeholder="Describe the image..."
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Caption (optional)
          </label>
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => onUpdate({ caption: e.target.value || undefined })}
            placeholder="Image caption..."
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// File Block Editor
function FileBlockEditor({ block, onUpdate, courseId }: { block: FileContentBlock; onUpdate: (updates: Partial<FileContentBlock>) => void; courseId: string }) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', courseId)
      formData.append('mediaType', 'document')

      const res = await fetch('/api/admin/courses/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        onUpdate({
          url: data.url,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        })
      } else {
        const data = await res.json()
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {block.url ? (
        <div className="flex items-center gap-4 p-4 bg-neu-base rounded-lg">
          <FileText className="w-10 h-10 text-primary-600" />
          <div className="flex-1">
            <div className="font-medium text-text-primary">{block.filename}</div>
            <div className="text-sm text-text-muted">{formatFileSize(block.size)}</div>
          </div>
          <Button variant="secondary" onClick={() => onUpdate({ url: '', filename: '', size: 0, mimeType: '' })}>
            Remove
          </Button>
        </div>
      ) : (
        <div>
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neu-dark rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-3 text-primary-600 animate-spin" />
                <span className="text-sm text-text-muted">Uploading file...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-3 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Click to upload file</span>
                <span className="text-xs text-text-muted mt-1">PDF, DOC, XLS, or any file</span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  )
}

// HTML Block Editor
function HtmlBlockEditor({ block, onUpdate }: { block: HtmlContentBlock; onUpdate: (updates: Partial<HtmlContentBlock>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        HTML Content
      </label>
      <textarea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        rows={10}
        placeholder="<div>Your HTML content here...</div>"
        className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-y font-mono text-sm"
      />
      <p className="mt-2 text-xs text-text-muted">
        HTML will be sanitized for security. External scripts are not allowed.
      </p>
    </div>
  )
}

// Embed Block Editor
function EmbedBlockEditor({ block, onUpdate }: { block: EmbedContentBlock; onUpdate: (updates: Partial<EmbedContentBlock>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Provider
        </label>
        <select
          value={block.provider}
          onChange={(e) => onUpdate({ provider: e.target.value as 'youtube' | 'vimeo' | 'custom' })}
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="custom">Custom (iframe)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          {block.provider === 'youtube' ? 'YouTube Video ID or URL' :
           block.provider === 'vimeo' ? 'Vimeo Video ID or URL' :
           'Embed URL'}
        </label>
        <input
          type="text"
          value={block.embedUrl}
          onChange={(e) => onUpdate({ embedUrl: e.target.value })}
          placeholder={
            block.provider === 'youtube' ? 'dQw4w9WgXcQ or https://youtube.com/watch?v=...' :
            block.provider === 'vimeo' ? '123456789 or https://vimeo.com/...' :
            'https://...'
          }
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Aspect Ratio
          </label>
          <select
            value={block.aspectRatio || '16:9'}
            onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          >
            <option value="16:9">16:9 (Widescreen)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="9:16">9:16 (Vertical)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value || undefined })}
            placeholder="Video title..."
            className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}

// Quiz Block Editor
function QuizBlockEditor({ block, onUpdate, courseId }: { block: QuizContentBlock; onUpdate: (updates: Partial<QuizContentBlock>) => void; courseId: string }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Quiz ID
        </label>
        <input
          type="text"
          value={block.quizId}
          onChange={(e) => onUpdate({ quizId: e.target.value })}
          placeholder="Select or enter quiz ID..."
          className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
        />
        <p className="mt-2 text-xs text-text-muted">
          Create quizzes in the Quizzes section, then add their ID here.
        </p>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={block.isGate || false}
            onChange={(e) => onUpdate({ isGate: e.target.checked })}
            className="w-5 h-5 rounded border-2 border-neu-dark text-primary-600 focus:ring-primary-400"
          />
          <div>
            <div className="font-medium text-text-primary">Gate Content</div>
            <div className="text-sm text-text-muted">
              Student must pass this quiz to continue to next content
            </div>
          </div>
        </label>
      </div>

      <Link
        href={`/admin/courses/${courseId}/quizzes`}
        className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
      >
        <HelpCircle className="w-4 h-4 mr-1" />
        Manage Quizzes
      </Link>
    </div>
  )
}

// ===========================================
// Block Preview Component
// ===========================================

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="prose prose-sm max-w-none text-text-secondary line-clamp-3">
          {block.content || <span className="text-text-muted italic">No content</span>}
        </div>
      )
    case 'video':
      return block.url ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Video className="w-4 h-4" />
          <span>Video: {block.duration ? `${Math.floor(block.duration / 60)}:${(block.duration % 60).toString().padStart(2, '0')}` : 'Duration unknown'}</span>
        </div>
      ) : (
        <span className="text-text-muted italic">No video selected</span>
      )
    case 'audio':
      return block.url ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Music className="w-4 h-4" />
          <span>{block.title || 'Audio'}: {block.duration ? `${Math.floor(block.duration / 60)}:${(block.duration % 60).toString().padStart(2, '0')}` : 'Duration unknown'}</span>
        </div>
      ) : (
        <span className="text-text-muted italic">No audio selected</span>
      )
    case 'image':
      return block.url ? (
        <div className="flex items-center gap-3">
          <img src={block.url} alt={block.alt || ''} className="w-16 h-16 object-cover rounded" />
          <span className="text-sm text-text-secondary">{block.alt || block.caption || 'Image'}</span>
        </div>
      ) : (
        <span className="text-text-muted italic">No image selected</span>
      )
    case 'file':
      return block.url ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <FileText className="w-4 h-4" />
          <span>{block.filename}</span>
        </div>
      ) : (
        <span className="text-text-muted italic">No file selected</span>
      )
    case 'html':
      return (
        <div className="text-sm text-text-secondary">
          {block.content ? `${block.content.substring(0, 100)}...` : <span className="text-text-muted italic">No HTML content</span>}
        </div>
      )
    case 'embed':
      return block.embedUrl ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <LinkIcon className="w-4 h-4" />
          <span>{block.provider}: {block.embedUrl}</span>
        </div>
      ) : (
        <span className="text-text-muted italic">No embed URL</span>
      )
    case 'quiz':
      return block.quizId ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <HelpCircle className="w-4 h-4" />
          <span>Quiz ID: {block.quizId}</span>
          {block.isGate && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Gate</span>}
        </div>
      ) : (
        <span className="text-text-muted italic">No quiz selected</span>
      )
    default:
      return <span className="text-text-muted italic">Unknown block type</span>
  }
}
