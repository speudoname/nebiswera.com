'use client'

import { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'
import { Plus, X, Save } from 'lucide-react'
import type { CustomField, RegistrationFieldConfig } from '@/types/registration-fields'

interface RegistrationFieldsFormProps {
  webinarId: string
  initialConfig?: RegistrationFieldConfig | null
  onSave: (config: RegistrationFieldConfig) => Promise<void>
}

const defaultConfig: RegistrationFieldConfig = {
  nameFormat: 'SPLIT',
  showPhone: false,
  phoneRequired: false,
  customFields: [],
}

export function RegistrationFieldsForm({
  webinarId,
  initialConfig,
  onSave,
}: RegistrationFieldsFormProps) {
  const [config, setConfig] = useState<RegistrationFieldConfig>(
    initialConfig || defaultConfig
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await onSave(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fields config')
    } finally {
      setSaving(false)
    }
  }

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
    }
    setConfig((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }))
  }

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setConfig((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    }))
  }

  const removeCustomField = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((field) => field.id !== id),
    }))
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-neu p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Standard Fields Configuration */}
      <Card variant="raised" padding="lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Standard Fields
        </h3>

        <div className="space-y-4">
          {/* Email - always required, shown as info */}
          <div className="p-4 bg-neu-light rounded-neu">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-text-primary">Email</div>
                <div className="text-sm text-text-secondary">
                  Always required and shown
                </div>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                Required
              </span>
            </div>
          </div>

          {/* Name Format */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Name Field Format
            </label>
            <select
              value={config.nameFormat}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  nameFormat: e.target.value as 'SPLIT' | 'FULL',
                }))
              }
              className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
            >
              <option value="SPLIT">First Name + Last Name (2 fields)</option>
              <option value="FULL">Full Name (1 field, auto-split)</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              {config.nameFormat === 'SPLIT'
                ? 'Shows two separate fields for first and last name'
                : 'Shows one field, automatically splits into first and last name'}
            </p>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPhone}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    showPhone: e.target.checked,
                    phoneRequired: e.target.checked ? prev.phoneRequired : false,
                  }))
                }
                className="w-5 h-5 rounded border-2 border-neu-dark text-primary-600 focus:ring-2 focus:ring-primary-400"
              />
              <div>
                <div className="font-medium text-text-primary">Show Phone Field</div>
                <div className="text-sm text-text-secondary">
                  Allow users to provide their phone number
                </div>
              </div>
            </label>

            {config.showPhone && (
              <label className="flex items-center gap-3 cursor-pointer ml-8">
                <input
                  type="checkbox"
                  checked={config.phoneRequired}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      phoneRequired: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-2 border-neu-dark text-primary-600 focus:ring-2 focus:ring-primary-400"
                />
                <div className="text-sm text-text-secondary">Make phone required</div>
              </label>
            )}
          </div>
        </div>
      </Card>

      {/* Custom Fields */}
      <Card variant="raised" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Custom Fields</h3>
          <Button variant="secondary" size="sm" onClick={addCustomField} leftIcon={Plus}>
            Add Field
          </Button>
        </div>

        {config.customFields.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">No custom fields added yet</p>
            <p className="text-xs mt-1">
              Add custom fields to collect additional information during registration
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {config.customFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-neu-base rounded-neu shadow-neu-inset space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="text-sm font-medium text-text-muted">
                    Custom Field #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Field Label"
                      value={field.label}
                      onChange={(e) =>
                        updateCustomField(field.id, { label: e.target.value })
                      }
                      placeholder="e.g., Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Field Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateCustomField(field.id, {
                          type: e.target.value as CustomField['type'],
                        })
                      }
                      className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-3 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Input
                    label="Placeholder (optional)"
                    value={field.placeholder || ''}
                    onChange={(e) =>
                      updateCustomField(field.id, { placeholder: e.target.value })
                    }
                    placeholder="Enter placeholder text"
                  />
                </div>

                {field.type === 'select' && (
                  <div>
                    <Input
                      label="Options (comma-separated)"
                      value={(field.options || []).join(', ')}
                      onChange={(e) =>
                        updateCustomField(field.id, {
                          options: e.target.value
                            .split(',')
                            .map((o) => o.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateCustomField(field.id, { required: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-2 border-neu-dark text-primary-600 focus:ring-2 focus:ring-primary-400"
                  />
                  <span className="text-sm text-text-secondary">Required field</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} leftIcon={Save}>
          Save Field Configuration
        </Button>
      </div>
    </div>
  )
}
