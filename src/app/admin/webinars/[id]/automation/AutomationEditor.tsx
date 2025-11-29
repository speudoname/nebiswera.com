'use client'

import { useState } from 'react'
import { NotificationsEditor } from './NotificationsEditor'
import { AutomationRulesEditor } from './AutomationRulesEditor'

interface Tag {
  id: string
  name: string
  color: string
}

interface Notification {
  id: string
  type: string
  trigger: string
  triggerMinutes: number | null
  subject: string
  bodyHtml: string
  bodyText: string
  enabled: boolean
}

interface AutomationRule {
  id: string
  trigger: string
  tagIds: string[]
  enabled: boolean
  createdAt: string
}

interface AutomationEditorProps {
  webinarId: string
  webinarTitle: string
  initialNotifications: Notification[]
  initialAutomationRules: AutomationRule[]
  availableTags: Tag[]
}

type Tab = 'notifications' | 'automation'

export function AutomationEditor({
  webinarId,
  webinarTitle,
  initialNotifications,
  initialAutomationRules,
  availableTags,
}: AutomationEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('automation')

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-neu-dark">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'automation'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Tag Automation
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Email Notifications
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'automation' && (
        <AutomationRulesEditor
          webinarId={webinarId}
          initialRules={initialAutomationRules}
          availableTags={availableTags}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsEditor
          webinarId={webinarId}
          webinarTitle={webinarTitle}
          initialNotifications={initialNotifications}
        />
      )}
    </div>
  )
}
