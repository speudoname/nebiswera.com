'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Modal } from '@/components/ui'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Layers,
  BookOpen,
  FileText,
  MoreVertical,
  Edit2,
  Save,
  X,
} from 'lucide-react'
import type { ContentBlock } from '@/lib/lms/types'

interface Part {
  id: string
  title: string
  description: string | null
  order: number
  contentBlocks: ContentBlock[]
}

interface Lesson {
  id: string
  title: string
  description: string | null
  order: number
  moduleId: string | null
  contentBlocks: ContentBlock[]
  parts: Part[]
}

interface Module {
  id: string
  title: string
  description: string | null
  order: number
  contentBlocks: ContentBlock[]
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  slug: string
  modules: Module[]
  lessons: Lesson[] // Direct lessons (no module)
}

export default function ContentBuilderPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  // Modal states
  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const [addLessonOpen, setAddLessonOpen] = useState<{ moduleId: string | null } | null>(null)
  const [addPartOpen, setAddPartOpen] = useState<{ lessonId: string } | null>(null)
  const [editItem, setEditItem] = useState<{
    type: 'module' | 'lesson' | 'part'
    id: string
    title: string
    description: string
  } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'module' | 'lesson' | 'part'
    id: string
    title: string
  } | null>(null)

  const [saving, setSaving] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCourse(data)
        // Expand all modules by default
        setExpandedModules(new Set(data.modules.map((m: Module) => m.id)))
      } else {
        router.push('/admin/courses')
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
      router.push('/admin/courses')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(lessonId)) {
        next.delete(lessonId)
      } else {
        next.add(lessonId)
      }
      return next
    })
  }

  const handleAddModule = async () => {
    if (!newItemTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle,
          description: newItemDescription || null,
        }),
      })
      if (res.ok) {
        await fetchCourse()
        setAddModuleOpen(false)
        setNewItemTitle('')
        setNewItemDescription('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add module')
      }
    } catch (error) {
      console.error('Failed to add module:', error)
      alert('Failed to add module')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLesson = async () => {
    if (!newItemTitle.trim() || !addLessonOpen) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle,
          description: newItemDescription || null,
          moduleId: addLessonOpen.moduleId,
        }),
      })
      if (res.ok) {
        await fetchCourse()
        setAddLessonOpen(null)
        setNewItemTitle('')
        setNewItemDescription('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add lesson')
      }
    } catch (error) {
      console.error('Failed to add lesson:', error)
      alert('Failed to add lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPart = async () => {
    if (!newItemTitle.trim() || !addPartOpen) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle,
          description: newItemDescription || null,
          lessonId: addPartOpen.lessonId,
        }),
      })
      if (res.ok) {
        await fetchCourse()
        setAddPartOpen(null)
        setNewItemTitle('')
        setNewItemDescription('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add part')
      }
    } catch (error) {
      console.error('Failed to add part:', error)
      alert('Failed to add part')
    } finally {
      setSaving(false)
    }
  }

  const handleEditItem = async () => {
    if (!editItem || !newItemTitle.trim()) return
    setSaving(true)
    try {
      const endpoint =
        editItem.type === 'module'
          ? `/api/admin/courses/${id}/modules/${editItem.id}`
          : editItem.type === 'lesson'
          ? `/api/admin/courses/${id}/lessons/${editItem.id}`
          : `/api/admin/courses/${id}/parts/${editItem.id}`

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle,
          description: newItemDescription || null,
        }),
      })
      if (res.ok) {
        await fetchCourse()
        setEditItem(null)
        setNewItemTitle('')
        setNewItemDescription('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update')
      }
    } catch (error) {
      console.error('Failed to update:', error)
      alert('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      const endpoint =
        deleteConfirm.type === 'module'
          ? `/api/admin/courses/${id}/modules/${deleteConfirm.id}`
          : deleteConfirm.type === 'lesson'
          ? `/api/admin/courses/${id}/lessons/${deleteConfirm.id}`
          : `/api/admin/courses/${id}/parts/${deleteConfirm.id}`

      const res = await fetch(endpoint, { method: 'DELETE' })
      if (res.ok) {
        await fetchCourse()
        setDeleteConfirm(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (type: 'module' | 'lesson' | 'part', id: string, title: string, description: string | null) => {
    setEditItem({ type, id, title, description: description || '' })
    setNewItemTitle(title)
    setNewItemDescription(description || '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!course) return null

  const totalParts = [
    ...course.modules.flatMap(m => m.lessons.flatMap(l => l.parts)),
    ...course.lessons.flatMap(l => l.parts),
  ].length

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/courses/${id}`}
          className="inline-flex items-center text-text-muted hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Content Builder</h1>
            <p className="text-text-muted">{course.title}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">
              {course.modules.length} modules · {course.modules.reduce((acc, m) => acc + m.lessons.length, 0) + course.lessons.length} lessons · {totalParts} parts
            </span>
            <Button onClick={() => setAddModuleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>
        </div>
      </div>

      {/* Content Structure */}
      <div className="space-y-4">
        {/* Modules */}
        {course.modules.map((module) => (
          <div key={module.id} className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
            {/* Module Header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-neu-base/50 transition-colors"
              onClick={() => toggleModule(module.id)}
            >
              <GripVertical className="w-5 h-5 text-text-muted cursor-grab" />
              <button className="p-1">
                {expandedModules.has(module.id) ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                )}
              </button>
              <Layers className="w-5 h-5 text-primary-600" />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">{module.title}</div>
                {module.description && (
                  <div className="text-sm text-text-muted">{module.description}</div>
                )}
              </div>
              <span className="text-xs text-text-muted bg-neu-base px-2 py-1 rounded">
                {module.lessons.length} lessons
              </span>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEdit('module', module.id, module.title, module.description)}
                  className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: 'module', id: module.id, title: module.title })}
                  className="p-1 text-text-muted hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Module Content (Lessons) */}
            {expandedModules.has(module.id) && (
              <div className="border-t border-neu-dark">
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className="border-b border-neu-dark last:border-b-0">
                    {/* Lesson Header */}
                    <div
                      className="flex items-center gap-3 p-3 pl-12 cursor-pointer hover:bg-neu-base/30 transition-colors"
                      onClick={() => toggleLesson(lesson.id)}
                    >
                      <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                      <button className="p-1">
                        {expandedLessons.has(lesson.id) ? (
                          <ChevronDown className="w-4 h-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-text-muted" />
                        )}
                      </button>
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">{lesson.title}</div>
                      </div>
                      <span className="text-xs text-text-muted bg-neu-base px-2 py-1 rounded">
                        {lesson.parts.length} parts
                      </span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit('lesson', lesson.id, lesson.title, lesson.description)}
                          className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'lesson', id: lesson.id, title: lesson.title })}
                          className="p-1 text-text-muted hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Parts */}
                    {expandedLessons.has(lesson.id) && (
                      <div className="bg-neu-base/20">
                        {lesson.parts.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-center gap-3 p-2 pl-20 hover:bg-neu-base/30 transition-colors"
                          >
                            <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <div className="text-sm text-text-primary">{part.title}</div>
                            </div>
                            <span className="text-xs text-text-muted">
                              {(part.contentBlocks || []).length} blocks
                            </span>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/admin/courses/${id}/content/${part.id}`}
                                className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                                title="Edit content"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'part', id: part.id, title: part.title })}
                                className="p-1 text-text-muted hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Add Part Button */}
                        <button
                          onClick={() => setAddPartOpen({ lessonId: lesson.id })}
                          className="w-full flex items-center gap-2 p-2 pl-20 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Part
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {/* Add Lesson Button */}
                <button
                  onClick={() => setAddLessonOpen({ moduleId: module.id })}
                  className="w-full flex items-center gap-2 p-3 pl-12 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Lesson
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Direct Lessons (no module) */}
        {course.lessons.length > 0 && (
          <div className="bg-neu-light rounded-neu shadow-neu overflow-hidden">
            <div className="p-4 border-b border-neu-dark">
              <div className="font-semibold text-text-primary">Standalone Lessons</div>
              <div className="text-sm text-text-muted">Lessons not in any module</div>
            </div>
            {course.lessons.map((lesson) => (
              <div key={lesson.id} className="border-b border-neu-dark last:border-b-0">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neu-base/30 transition-colors"
                  onClick={() => toggleLesson(lesson.id)}
                >
                  <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                  <button className="p-1">
                    {expandedLessons.has(lesson.id) ? (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">{lesson.title}</div>
                  </div>
                  <span className="text-xs text-text-muted bg-neu-base px-2 py-1 rounded">
                    {lesson.parts.length} parts
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit('lesson', lesson.id, lesson.title, lesson.description)}
                      className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'lesson', id: lesson.id, title: lesson.title })}
                      className="p-1 text-text-muted hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedLessons.has(lesson.id) && (
                  <div className="bg-neu-base/20">
                    {lesson.parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-center gap-3 p-2 pl-12 hover:bg-neu-base/30 transition-colors"
                      >
                        <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div className="flex-1">
                          <div className="text-sm text-text-primary">{part.title}</div>
                        </div>
                        <span className="text-xs text-text-muted">
                          {(part.contentBlocks || []).length} blocks
                        </span>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/courses/${id}/content/${part.id}`}
                            className="p-1 text-text-muted hover:text-primary-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'part', id: part.id, title: part.title })}
                            className="p-1 text-text-muted hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setAddPartOpen({ lessonId: lesson.id })}
                      className="w-full flex items-center gap-2 p-2 pl-12 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Part
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Standalone Lesson */}
        <button
          onClick={() => setAddLessonOpen({ moduleId: null })}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neu-dark rounded-neu text-text-muted hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Standalone Lesson
        </button>

        {/* Empty State */}
        {course.modules.length === 0 && course.lessons.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No content yet</p>
            <p className="text-sm mb-4">Start by adding a module or standalone lesson</p>
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      <Modal
        isOpen={addModuleOpen}
        onClose={() => {
          setAddModuleOpen(false)
          setNewItemTitle('')
          setNewItemDescription('')
        }}
        title="Add Module"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Module title..."
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description (optional)</label>
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddModuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddModule} disabled={saving || !newItemTitle.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Module
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal
        isOpen={!!addLessonOpen}
        onClose={() => {
          setAddLessonOpen(null)
          setNewItemTitle('')
          setNewItemDescription('')
        }}
        title="Add Lesson"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Lesson title..."
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description (optional)</label>
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddLessonOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddLesson} disabled={saving || !newItemTitle.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Lesson
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Part Modal */}
      <Modal
        isOpen={!!addPartOpen}
        onClose={() => {
          setAddPartOpen(null)
          setNewItemTitle('')
          setNewItemDescription('')
        }}
        title="Add Part"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Part title..."
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description (optional)</label>
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAddPartOpen(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddPart} disabled={saving || !newItemTitle.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Part
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => {
          setEditItem(null)
          setNewItemTitle('')
          setNewItemDescription('')
        }}
        title={`Edit ${editItem?.type ? editItem.type.charAt(0).toUpperCase() + editItem.type.slice(1) : ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Description (optional)</label>
            <textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              rows={3}
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={saving || !newItemTitle.trim()}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={`Delete ${deleteConfirm?.type ? deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1) : ''}`}
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-text-secondary mb-2">
            Are you sure you want to delete <strong>&quot;{deleteConfirm?.title}&quot;</strong>?
          </p>
          {deleteConfirm?.type === 'module' && (
            <p className="text-sm text-text-muted mb-4">
              This will also delete all lessons and parts within this module.
            </p>
          )}
          {deleteConfirm?.type === 'lesson' && (
            <p className="text-sm text-text-muted mb-4">
              This will also delete all parts within this lesson.
            </p>
          )}
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
