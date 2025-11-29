'use client'

import { useState } from 'react'
import { Plus, Trash2, Tag as TagIcon } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface Tag {
  id: string
  name: string
  color: string
}

interface AutomationRule {
  id: string
  trigger: string
  tagIds: string[]
  enabled: boolean
  createdAt: string
}

interface AutomationRulesEditorProps {
  webinarId: string
  initialRules: AutomationRule[]
  availableTags: Tag[]
}

const TRIGGER_LABELS: Record<string, string> = {
  REGISTERED: 'When user registers',
  ATTENDED: 'When user attends (joins watch room)',
  COMPLETED: 'When user completes webinar',
  MISSED: 'When user misses scheduled session',
}

const TRIGGER_COLORS: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700',
  ATTENDED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  MISSED: 'bg-orange-100 text-orange-700',
}

export function AutomationRulesEditor({
  webinarId,
  initialRules,
  availableTags,
}: AutomationRulesEditorProps) {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules)
  const [isAdding, setIsAdding] = useState(false)
  const [newRule, setNewRule] = useState<{ trigger: string; tagIds: string[] }>({
    trigger: 'REGISTERED',
    tagIds: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddRule = async () => {
    if (newRule.tagIds.length === 0) {
      alert('Please select at least one tag')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/webinars/${webinarId}/automation-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })

      if (!response.ok) {
        throw new Error('Failed to create automation rule')
      }

      const { rule } = await response.json()
      setRules([...rules, rule])
      setNewRule({ trigger: 'REGISTERED', tagIds: [] })
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to create automation rule:', error)
      alert('Failed to create automation rule')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this automation rule?')) return

    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/automation-rules/${ruleId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete automation rule')
      }

      setRules(rules.filter((r) => r.id !== ruleId))
    } catch (error) {
      console.error('Failed to delete automation rule:', error)
      alert('Failed to delete automation rule')
    }
  }

  const handleToggleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/automation-rules/${ruleId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update automation rule')
      }

      setRules(rules.map((r) => (r.id === ruleId ? { ...r, enabled } : r)))
    } catch (error) {
      console.error('Failed to update automation rule:', error)
      alert('Failed to update automation rule')
    }
  }

  const getTagsByIds = (tagIds: string[]) => {
    return availableTags.filter((tag) => tagIds.includes(tag.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Tag Automation Rules</h2>
          <p className="text-sm text-text-secondary">
            Automatically assign tags to contacts based on their webinar activity
          </p>
        </div>
        {!isAdding && (
          <Button variant="primary" size="sm" onClick={() => setIsAdding(true)} leftIcon={Plus}>
            Add Rule
          </Button>
        )}
      </div>

      {/* Add Rule Form */}
      {isAdding && (
        <Card variant="raised" padding="md">
          <div className="space-y-4">
            <h3 className="font-medium text-text-primary">New Automation Rule</h3>

            {/* Trigger */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Trigger Event
              </label>
              <select
                value={newRule.trigger}
                onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
                className="w-full rounded-neu border-2 border-transparent bg-neu-base px-4 py-2 text-sm shadow-neu-inset focus:border-primary-400 focus:outline-none"
              >
                {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Assign Tags
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-neu bg-neu-light p-3">
                {availableTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.tagIds.includes(tag.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRule({ ...newRule, tagIds: [...newRule.tagIds, tag.id] })
                        } else {
                          setNewRule({
                            ...newRule,
                            tagIds: newRule.tagIds.filter((id) => id !== tag.id),
                          })
                        }
                      }}
                      className="w-4 h-4 rounded border-2 border-neu-dark"
                    />
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAdding(false)
                  setNewRule({ trigger: 'REGISTERED', tagIds: [] })
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddRule}
                loading={isSubmitting}
              >
                Create Rule
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 && !isAdding && (
          <Card variant="inset" padding="lg">
            <div className="text-center text-text-muted">
              <TagIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No automation rules yet</p>
              <p className="text-sm">Create a rule to automatically assign tags to contacts</p>
            </div>
          </Card>
        )}

        {rules.map((rule) => {
          const tags = getTagsByIds(rule.tagIds)
          return (
            <Card key={rule.id} variant="raised" padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        TRIGGER_COLORS[rule.trigger] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {TRIGGER_LABELS[rule.trigger] || rule.trigger}
                    </span>
                    <span className="text-text-secondary text-sm">→</span>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => handleToggleEnabled(rule.id, e.target.checked)}
                      className="w-4 h-4 rounded border-2 border-neu-dark"
                    />
                    <span className="text-sm text-text-secondary">Enabled</span>
                  </label>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
