'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  FileText,
  Search,
} from 'lucide-react'
import { getSmsCharacterInfo } from '@/lib/sms/utils'

interface SmsTemplate {
  id: string
  name: string
  slug: string
  messageKa: string
  messageEn: string
  category: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  WEBINAR: 'Webinar',
  COURSE: 'Course',
  AUTH: 'Authentication',
  MARKETING: 'Marketing',
  TRANSACTIONAL: 'Transactional',
}

const CATEGORY_COLORS: Record<string, string> = {
  WEBINAR: 'bg-blue-100 text-blue-700',
  COURSE: 'bg-green-100 text-green-700',
  AUTH: 'bg-amber-100 text-amber-700',
  MARKETING: 'bg-purple-100 text-purple-700',
  TRANSACTIONAL: 'bg-gray-100 text-gray-700',
}

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [seeding, setSeeding] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    messageKa: '',
    messageEn: '',
    category: 'TRANSACTIONAL',
    description: '',
  })

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sms/templates')
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setTemplates(data.templates)
    } catch (err) {
      setError('Failed to load templates')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const seedDefaults = async () => {
    setSeeding(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/sms/templates/seed', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to seed templates')
      }

      setSuccess(
        `Seeded ${data.results.created.length} templates (${data.results.skipped.length} already existed)`
      )
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed templates')
    } finally {
      setSeeding(false)
    }
  }

  const openCreateModal = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      slug: '',
      messageKa: '',
      messageEn: '',
      category: 'TRANSACTIONAL',
      description: '',
    })
    setShowModal(true)
  }

  const openEditModal = (template: SmsTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      slug: template.slug,
      messageKa: template.messageKa,
      messageEn: template.messageEn,
      category: template.category,
      description: template.description || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const url = editingTemplate
        ? `/api/admin/sms/templates/${editingTemplate.id}`
        : '/api/admin/sms/templates'

      const method = editingTemplate ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save template')
      }

      setSuccess(editingTemplate ? 'Template updated' : 'Template created')
      setShowModal(false)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (template: SmsTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/sms/templates/${template.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete template')
      }

      setSuccess('Template deleted')
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const toggleActive = async (template: SmsTemplate) => {
    try {
      const res = await fetch(`/api/admin/sms/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update template')
      }

      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.messageKa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.messageEn.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !categoryFilter || t.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Group by category
  const groupedTemplates = filteredTemplates.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = []
      acc[t.category].push(t)
      return acc
    },
    {} as Record<string, SmsTemplate[]>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/sms"
          className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to SMS
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent-900">SMS Templates</h1>
          <div className="flex gap-2">
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="px-4 py-2 border border-accent-300 text-accent-700 rounded-neu hover:bg-accent-50 flex items-center gap-2"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Seed Defaults
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-neu text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-neu text-green-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-neu shadow-neu-flat p-4 mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-neu shadow-neu-flat p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-accent-300" />
          <p className="text-accent-600 mb-4">No SMS templates yet</p>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700"
          >
            Load Default Templates
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category} className="bg-white rounded-neu shadow-neu-flat overflow-hidden">
              <div className="px-6 py-3 bg-accent-50 border-b border-accent-200">
                <span className={`text-sm font-medium px-2 py-1 rounded ${CATEGORY_COLORS[category]}`}>
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span className="ml-2 text-sm text-accent-500">
                  {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-accent-100">
                {categoryTemplates.map((template) => (
                  <div key={template.id} className="px-6 py-4 hover:bg-accent-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-accent-900">{template.name}</h3>
                          {template.isDefault && (
                            <span className="text-xs bg-accent-200 text-accent-600 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          {!template.isActive && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-accent-500 mt-0.5">{template.slug}</p>
                        {template.description && (
                          <p className="text-sm text-accent-400 mt-1">{template.description}</p>
                        )}
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="text-sm">
                            <span className="text-accent-400">KA:</span>{' '}
                            <span className="text-accent-600 truncate">
                              {template.messageKa.substring(0, 60)}
                              {template.messageKa.length > 60 ? '...' : ''}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-accent-400">EN:</span>{' '}
                            <span className="text-accent-600 truncate">
                              {template.messageEn.substring(0, 60)}
                              {template.messageEn.length > 60 ? '...' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(template)}
                          className={`px-3 py-1 text-sm rounded ${
                            template.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {template.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 text-accent-500 hover:text-accent-700 hover:bg-accent-100 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleDelete(template)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-neu shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-accent-200">
              <h2 className="text-xl font-semibold text-accent-900">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Template Name"
                    className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                    }
                    placeholder="template-slug"
                    className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                    disabled={editingTemplate?.isDefault}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                  disabled={editingTemplate?.isDefault}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1">
                  Georgian Message
                </label>
                <textarea
                  value={formData.messageKa}
                  onChange={(e) => setFormData({ ...formData, messageKa: e.target.value })}
                  placeholder="SMS message in Georgian..."
                  rows={3}
                  className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <div className="mt-1 flex gap-4 text-xs text-accent-500">
                  <span>{getSmsCharacterInfo(formData.messageKa).charCount} chars</span>
                  <span>{getSmsCharacterInfo(formData.messageKa).segments} segment(s)</span>
                  <span className="capitalize">{getSmsCharacterInfo(formData.messageKa).encoding}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1">
                  English Message
                </label>
                <textarea
                  value={formData.messageEn}
                  onChange={(e) => setFormData({ ...formData, messageEn: e.target.value })}
                  placeholder="SMS message in English..."
                  rows={3}
                  className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <div className="mt-1 flex gap-4 text-xs text-accent-500">
                  <span>{getSmsCharacterInfo(formData.messageEn).charCount} chars</span>
                  <span>{getSmsCharacterInfo(formData.messageEn).segments} segment(s)</span>
                  <span className="capitalize">{getSmsCharacterInfo(formData.messageEn).encoding}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Internal notes about this template..."
                  className="w-full px-4 py-2 border border-accent-200 rounded-neu focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div className="bg-accent-50 p-4 rounded-neu text-sm">
                <p className="font-medium text-accent-700 mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{firstName}}', '{{lastName}}', '{{email}}', '{{phone}}', '{{link}}', '{{code}}', '{{webinarTitle}}', '{{courseTitle}}', '{{date}}', '{{time}}'].map(
                    (v) => (
                      <code key={v} className="bg-white px-2 py-1 rounded text-accent-600 text-xs">
                        {v}
                      </code>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-accent-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-accent-300 text-accent-700 rounded-neu hover:bg-accent-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.slug || !formData.messageKa || !formData.messageEn}
                className="px-4 py-2 bg-accent-600 text-white rounded-neu hover:bg-accent-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
