'use client'

import { useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import type { ChatBotScript, ChatBotMessage } from '@/lib/webinar/chat-bot'

interface ChatScriptEditorProps {
  initialScript: ChatBotScript | null
  onSave: (script: ChatBotScript) => Promise<void>
}

export function ChatScriptEditor({ initialScript, onSave }: ChatScriptEditorProps) {
  const [script, setScript] = useState<ChatBotScript>(
    initialScript || {
      enabled: false,
      messages: [],
    }
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleEnabled = () => {
    setScript({ ...script, enabled: !script.enabled })
  }

  const handleAddMessage = () => {
    const newMessage: ChatBotMessage = {
      time: script.messages.length > 0
        ? Math.max(...script.messages.map(m => m.time)) + 60
        : 60, // Start at 1 minute
      sender: 'Attendee',
      message: '',
    }
    setScript({
      ...script,
      messages: [...script.messages, newMessage],
    })
  }

  const handleUpdateMessage = (index: number, field: keyof ChatBotMessage, value: string | number) => {
    const updated = [...script.messages]
    updated[index] = { ...updated[index], [field]: value }
    setScript({ ...script, messages: updated })
  }

  const handleDeleteMessage = (index: number) => {
    const updated = script.messages.filter((_, i) => i !== index)
    setScript({ ...script, messages: updated })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Sort messages by time before saving
      const sortedScript = {
        ...script,
        messages: [...script.messages].sort((a, b) => a.time - b.time),
      }
      await onSave(sortedScript)
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Simulated Chat Messages</h3>
          <p className="text-sm text-text-muted">
            Create pre-scripted messages that appear during the webinar
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={script.enabled}
            onChange={handleToggleEnabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neu-dark rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>

      {script.enabled && (
        <>
          {/* Messages List */}
          <div className="space-y-4">
            {script.messages.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                No messages yet. Click "Add Message" to create one.
              </div>
            ) : (
              script.messages.map((msg, index) => (
                <div
                  key={index}
                  className="bg-neu-base rounded-neu shadow-neu p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium text-text-secondary">
                      Message #{index + 1}
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(index)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Time */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Time (seconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={msg.time}
                        onChange={(e) =>
                          handleUpdateMessage(index, 'time', parseInt(e.target.value) || 0)
                        }
                        className="w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-text-muted">
                        Appears at: {formatTime(msg.time)}
                      </p>
                    </div>

                    {/* Sender Name */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Sender Name
                      </label>
                      <input
                        type="text"
                        value={msg.sender}
                        onChange={(e) => handleUpdateMessage(index, 'sender', e.target.value)}
                        placeholder="e.g., John Doe"
                        className="w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Message
                    </label>
                    <textarea
                      value={msg.message}
                      onChange={(e) => handleUpdateMessage(index, 'message', e.target.value)}
                      placeholder="Type the message..."
                      rows={3}
                      className="w-full rounded-neu border-2 border-transparent bg-neu-base px-3 py-2 text-sm text-text-primary shadow-neu-inset focus:border-primary-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Message Button */}
          <button
            onClick={handleAddMessage}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neu-base text-text-primary rounded-neu shadow-neu hover:shadow-neu-hover transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Message
          </button>

          {/* Preview */}
          {script.messages.length > 0 && (
            <div className="bg-neu-dark/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-text-primary mb-2">Preview Timeline</h4>
              <div className="space-y-1 text-xs">
                {[...script.messages]
                  .sort((a, b) => a.time - b.time)
                  .map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-text-muted">
                      <span className="font-mono">{formatTime(msg.time)}</span>
                      <span>→</span>
                      <span className="font-medium">{msg.sender}:</span>
                      <span className="truncate">{msg.message || '(empty)'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-neu-dark">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-neu shadow-neu hover:shadow-neu-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Chat Script'}
        </button>
      </div>
    </div>
  )
}
