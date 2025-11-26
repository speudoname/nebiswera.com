'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { FileText, Eye, Check, X } from 'lucide-react'
import { EMAIL_TEMPLATES, getTemplateCategories, type EmailTemplate } from '@/lib/email-templates'

interface TemplatePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: EmailTemplate) => void
}

export function TemplatePicker({ isOpen, onClose, onSelectTemplate }: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)

  const categories = getTemplateCategories()

  const filteredTemplates =
    selectedCategory === 'all'
      ? EMAIL_TEMPLATES
      : EMAIL_TEMPLATES.filter((t) => t.category === selectedCategory)

  const handleSelectTemplate = (template: EmailTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Choose Email Template"
      >
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 border-b border-neu-dark pb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-neu text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neu-base text-text-primary hover:bg-neu-dark/30'
              }`}
            >
              All Templates
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-neu text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-neu-base text-text-primary hover:bg-neu-dark/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-neu-base rounded-neu p-4 border-2 border-transparent hover:border-primary-400 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-text-muted">{template.description}</p>
                  </div>
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    {template.category}
                  </span>
                </div>

                {/* Preview Box */}
                <div className="bg-white rounded border border-neu-dark p-3 mb-3 text-xs text-text-muted overflow-hidden h-32">
                  <div className="text-[10px] leading-tight opacity-60">
                    {template.htmlContent.substring(0, 400)}...
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectTemplate(template)}
                    className="flex-1"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              No templates found in this category
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-neu-dark">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onSelectTemplate({
                  id: 'blank',
                  name: 'Blank',
                  description: 'Start from scratch',
                  category: 'newsletter',
                  suggestedSubject: '',
                  suggestedPreviewText: '',
                  htmlContent: '',
                  textContent: '',
                })
                onClose()
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Start from Scratch
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Preview: ${previewTemplate.name}`}
        >
          <div className="space-y-4">
            <div className="bg-neu-base rounded-neu p-4">
              <h3 className="font-medium text-text-primary mb-2">Suggested Subject:</h3>
              <p className="text-sm text-text-secondary">{previewTemplate.suggestedSubject}</p>
            </div>

            <div className="bg-neu-base rounded-neu p-4">
              <h3 className="font-medium text-text-primary mb-2">Preview Text:</h3>
              <p className="text-sm text-text-secondary">{previewTemplate.suggestedPreviewText}</p>
            </div>

            <div className="bg-white rounded-neu p-6 border-2 border-neu-dark max-h-[50vh] overflow-y-auto">
              <h3 className="font-medium text-text-primary mb-4">HTML Preview:</h3>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleSelectTemplate(previewTemplate)
                  setPreviewTemplate(null)
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
