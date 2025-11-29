'use client'

import { useState } from 'react'
import { Upload, Plus, Trash2, Download, User, Clock } from 'lucide-react'

interface ChatMessage {
  id: string
  senderName: string
  message: string
  appearsAt: number
  isFromModerator: boolean
}

interface ChatSimulatorProps {
  webinarId: string
  messages: ChatMessage[]
  onMessagesChange: () => void
}

export function ChatSimulator({
  webinarId,
  messages,
  onMessagesChange,
}: ChatSimulatorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newMessage, setNewMessage] = useState({
    senderName: '',
    message: '',
    appearsAt: 0,
    isFromModerator: false,
  })
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [replaceExisting, setReplaceExisting] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAddMessage = async () => {
    try {
      const response = await fetch(`/api/admin/webinars/${webinarId}/chat/simulated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      })

      if (!response.ok) throw new Error('Failed to add message')

      setNewMessage({ senderName: '', message: '', appearsAt: 0, isFromModerator: false })
      setIsAdding(false)
      onMessagesChange()
    } catch (error) {
      console.error('Failed to add message:', error)
      alert('Failed to add message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this chat message?')) return

    try {
      const response = await fetch(
        `/api/admin/webinars/${webinarId}/chat/simulated/${messageId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete message')

      onMessagesChange()
    } catch (error) {
      console.error('Failed to delete message:', error)
      alert('Failed to delete message')
    }
  }

  const handleCSVImport = async () => {
    if (!csvFile) return

    setIsImporting(true)
    try {
      const csvContent = await csvFile.text()

      const response = await fetch(
        `/api/admin/webinars/${webinarId}/chat/simulated/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent, replaceExisting }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import')
      }

      const result = await response.json()
      alert(`Successfully imported ${result.imported} messages`)
      setCsvFile(null)
      setReplaceExisting(false)
      onMessagesChange()
    } catch (error: any) {
      console.error('Failed to import CSV:', error)
      alert(`Failed to import CSV: ${error.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadCSVTemplate = () => {
    const template = `time,senderName,message,isFromModerator
60,John Doe,This is amazing!,false
120,Jane Smith,Great content,false
180,Moderator,Thanks everyone!,true`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chat-messages-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sortedMessages = [...messages].sort((a, b) => a.appearsAt - b.appearsAt)

  return (
    <div className="bg-neu-light rounded-xl shadow-neu p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Simulated Chat Messages</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSVTemplate}
            className="px-4 py-2 rounded-lg bg-neu-light shadow-neu hover:shadow-neu-inset transition-all flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Message
          </button>
        </div>
      </div>

      {/* CSV Import Section */}
      <div className="border border-neu-dark rounded-lg p-4 space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import from CSV
        </h4>
        <p className="text-sm text-text-secondary">
          Upload a CSV file with columns: time, senderName, message, isFromModerator
        </p>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="flex-1 p-2 rounded-lg bg-neu-light shadow-neu-inset text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Replace existing
          </label>
          <button
            onClick={handleCSVImport}
            disabled={!csvFile || isImporting}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>

      {/* Add Message Form */}
      {isAdding && (
        <div className="border border-neu-dark rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Add New Message</h4>
            <button
              onClick={() => setIsAdding(false)}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Sender Name</label>
              <input
                type="text"
                value={newMessage.senderName}
                onChange={(e) => setNewMessage({ ...newMessage, senderName: e.target.value })}
                placeholder="John Doe"
                className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Time (seconds)
                <span className="ml-2 font-normal text-text-secondary">
                  ({formatTime(newMessage.appearsAt)})
                </span>
              </label>
              <input
                type="number"
                value={newMessage.appearsAt}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, appearsAt: parseInt(e.target.value) })
                }
                placeholder="60"
                className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Message</label>
            <textarea
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              placeholder="Enter message..."
              rows={2}
              className="w-full p-2 rounded-lg bg-neu-light shadow-neu-inset text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newMessage.isFromModerator}
                onChange={(e) =>
                  setNewMessage({ ...newMessage, isFromModerator: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">From Moderator</span>
            </label>

            <button
              onClick={handleAddMessage}
              disabled={!newMessage.senderName || !newMessage.message}
              className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Add Message
            </button>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-text-secondary">
          {sortedMessages.length} Messages
        </h4>

        {sortedMessages.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>No simulated chat messages yet.</p>
            <p className="text-sm mt-2">Add messages manually or import from CSV.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-neu-light shadow-neu-inset hover:shadow-neu transition-shadow"
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.isFromModerator
                        ? 'bg-primary-500 text-white'
                        : 'bg-neu-dark text-text-secondary'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{msg.senderName}</span>
                    {msg.isFromModerator && (
                      <span className="px-2 py-0.5 rounded text-xs bg-primary-500 text-white">
                        Moderator
                      </span>
                    )}
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(msg.appearsAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary break-words">{msg.message}</p>
                </div>

                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
