'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'

interface Session {
  id: string
  scheduledAt: Date
  type: 'SCHEDULED' | 'JUST_IN_TIME' | 'ON_DEMAND'
  registrationCount: number
}

interface SessionFilterProps {
  webinarId: string
  value: string | null // null = all sessions
  onChange: (sessionId: string | null) => void
}

export function SessionFilter({ webinarId, value, onChange }: SessionFilterProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/admin/webinars/${webinarId}/sessions`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [webinarId])

  const selectedSession = sessions.find((s) => s.id === value)

  const formatSessionLabel = (session: Session) => {
    const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${date} (${session.registrationCount} registrants)`
  }

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-text-secondary bg-neu-base rounded-lg shadow-neu">
        Loading sessions...
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-neu-base text-text-primary rounded-lg shadow-neu hover:shadow-neu-hover transition-all min-w-[200px]"
      >
        <CalendarIcon className="w-4 h-4 text-primary-500" />
        <span className="flex-1 text-left">
          {value === null ? 'All Sessions' : selectedSession ? formatSessionLabel(selectedSession) : 'Select session'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-neu-lg border-2 border-neu-dark z-20 max-h-80 overflow-y-auto">
            <button
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-neu-base transition-colors ${
                value === null ? 'bg-primary-100 text-primary-700 font-medium' : 'text-text-primary'
              }`}
            >
              All Sessions ({sessions.reduce((sum, s) => sum + s.registrationCount, 0)} total registrants)
            </button>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onChange(session.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neu-base transition-colors border-t border-neu-dark ${
                  value === session.id ? 'bg-primary-100 text-primary-700 font-medium' : 'text-text-primary'
                }`}
              >
                {formatSessionLabel(session)}
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="px-3 py-4 text-sm text-text-secondary text-center">
                No sessions scheduled yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
